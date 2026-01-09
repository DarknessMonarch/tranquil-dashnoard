"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/app/store/AuthStore";
import styles from "@/app/styles/adminLayout.module.css";

import Image from "next/image";
import {
  MdDashboard,
  MdApartment,
  MdSettings,
  MdLogout,
  MdMenu,
  MdNotifications,
  MdClose,
  MdPerson,
} from "react-icons/md";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { isAuth, isAdmin, isManager, isSpecialist, role, username, clearUser } = useAuthStore();

  useEffect(() => {
    // Check authentication - allow admin, manager, and specialist
    if (!isAuth || !['admin', 'manager', 'specialist'].includes(role)) {
      router.push("/admin/login");
      return;
    }
  }, [isAuth, role]);

  const handleLogout = () => {
    clearUser();
    router.push("/admin/login");
  };

  // Conditionally build navigation based on role
  const navItems = [
    // Dashboard - only for admins
    ...(role === 'admin' ? [{
      section: "Overview",
      items: [
        {
          label: "Dashboard",
          icon: MdDashboard,
          path: "/admin/dashboard",
        },
      ],
    }] : []),
    // Properties - for all roles
    {
      section: "Management",
      items: [
        {
          label: "Properties",
          icon: MdApartment,
          path: "/admin/properties",
        },
      ],
    },
    // Users - only for admins
    ...(role === 'admin' ? [{
      section: "Administration",
      items: [
        {
          label: "Users",
          icon: MdPerson,
          path: "/admin/users",
        },
      ],
    }] : []),
    // Settings - only for admins
    ...(role === 'admin' ? [{
      section: "Settings",
      items: [
        {
          label: "Settings",
          icon: MdSettings,
          path: "/admin/settings",
        },
      ],
    }] : []),
  ];

  const isActive = (path) => pathname === path;

  const getPageTitle = () => {
    const currentPath = pathname;
    if (currentPath.includes("/dashboard")) return "Dashboard";
    if (currentPath.includes("/properties")) return "Properties";
    if (currentPath.includes("/users")) return "Users";
    if (currentPath.includes("/settings")) return "Settings";
    return "Admin Panel";
  };

  const getUserInitials = () => {
    if (!username) return "AD";
    return username
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={styles.adminContainer}>
      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${
          mobileMenuOpen ? styles.mobileOpen : ""
        }`}
      >
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarLogo}>
            <Image
              src="/assets/logo.png"
              alt="Tranquil Logo"
              width={150}
              height={50}
              className={styles.logo}
              priority
            />
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          {navItems.map((section, idx) => (
            <div key={idx} className={styles.navSection}>
              <div className={styles.navSectionTitle}>{section.section}</div>
              {section.items.map((item, itemIdx) => (
                <a
                  key={itemIdx}
                  href={item.path}
                  className={`${styles.navItem} ${
                    isActive(item.path) ? styles.active : ""
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    router.push(item.path);
                    setMobileMenuOpen(false);
                  }}
                >
                  <item.icon className={styles.navIcon} />
                  <span className={styles.navLabel}>{item.label}</span>
                </a>
              ))}
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
     
          <button
            onClick={handleLogout}
            className={`${styles.navItembtn}`}
          >
            <MdLogout className={styles.navIcon} />
            <span className={styles.navLabel}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      <div
        className={`${styles.mobileSidebarOverlay} ${
          mobileMenuOpen ? styles.active : ""
        }`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Top Bar */}
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <button
              className={styles.menuToggle}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <MdClose /> : <MdMenu />}
            </button>
            <h1 className={styles.topBarTitle}>{getPageTitle()}</h1>
          </div>

          <div className={styles.topBarRight}>
            <button className={styles.iconButton}>
              <MdNotifications size={20} />
              <span className={styles.notificationBadge} />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className={styles.contentArea}>{children}</main>
      </div>
    </div>
  );
}
