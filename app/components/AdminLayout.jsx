"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/app/store/AuthStore";
import { useLandlordStore } from "@/app/store/LandlordStore";
import styles from "@/app/styles/adminLayout.module.css";

import {
  MdDashboard,
  MdApartment,
  MdMeetingRoom,
  MdPeople,
  MdBuild,
  MdCampaign,
  MdBarChart,
  MdSettings,
  MdLogout,
  MdMenu,
  MdNotifications,
  MdClose,
  MdReceipt,
  MdPayment,
  MdPerson,
} from "react-icons/md";

import { FiChevronDown } from "react-icons/fi";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { isAuth, isLandlord, isAdmin, username, clearUser } = useAuthStore();
  const {
    selectedProperty,
    properties,
    setSelectedProperty,
    fetchProperties,
  } = useLandlordStore();

  useEffect(() => {
    // Check authentication
    if (!isAuth || (!isLandlord && !isAdmin)) {
      router.push("/admin/login");
      return;
    }

    // Fetch properties on mount
    if (properties.length === 0) {
      fetchProperties();
    }
  }, [isAuth, isLandlord, isAdmin, properties.length]);

  const handleLogout = () => {
    clearUser();
    router.push("/admin/login");
  };

  const handlePropertyChange = (e) => {
    const propertyId = e.target.value;
    const property = properties.find((p) => p._id === propertyId);
    if (property) {
      setSelectedProperty(property);
    }
  };

  const navItems = [
    {
      section: "Overview",
      items: [
        {
          label: "Dashboard",
          icon: MdDashboard,
          path: "/admin/dashboard",
        },
        {
          label: "Analytics",
          icon: MdBarChart,
          path: "/admin/analytics",
        },
      ],
    },
    {
      section: "Management",
      items: [
        {
          label: "Properties",
          icon: MdApartment,
          path: "/admin/properties",
        },
        {
          label: "Units",
          icon: MdMeetingRoom,
          path: "/admin/units",
        },
        {
          label: "Tenants",
          icon: MdPeople,
          path: "/admin/tenants",
        },
      ],
    },
    {
      section: "Operations",
      items: [
        {
          label: "Bills",
          icon: MdReceipt,
          path: "/admin/bills",
        },
        {
          label: "Payments",
          icon: MdPayment,
          path: "/admin/payments",
        },
        {
          label: "Maintenance",
          icon: MdBuild,
          path: "/admin/maintenance",
        },
        {
          label: "Announcements",
          icon: MdCampaign,
          path: "/admin/announcements",
        },
      ],
    },
    {
      section: "Administration",
      items: [
        {
          label: "Users",
          icon: MdPerson,
          path: "/admin/users",
        },
      ],
    },
    {
      section: "Settings",
      items: [
        {
          label: "Settings",
          icon: MdSettings,
          path: "/admin/settings",
        },
      ],
    },
  ];

  const isActive = (path) => pathname === path;

  const getPageTitle = () => {
    const currentPath = pathname;
    if (currentPath.includes("/dashboard")) return "Dashboard";
    if (currentPath.includes("/analytics")) return "Analytics";
    if (currentPath.includes("/properties")) return "Properties";
    if (currentPath.includes("/units")) return "Units";
    if (currentPath.includes("/tenants")) return "Tenants";
    if (currentPath.includes("/bills")) return "Bills";
    if (currentPath.includes("/payments")) return "Payments";
    if (currentPath.includes("/maintenance")) return "Maintenance";
    if (currentPath.includes("/announcements")) return "Announcements";
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
            <MdApartment className={styles.sidebarLogoIcon} />
            <span>Tranquil</span>
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
          <div className={styles.userCard}>
            <div className={styles.userAvatar}>{getUserInitials()}</div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{username || "Admin"}</div>
              <div className={styles.userRole}>Property Manager</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className={`${styles.navItem}`}
            style={{ marginTop: "var(--spacing-md)", width: "100%" }}
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
            {properties.length > 0 && (
              <select
                className={styles.propertySelector}
                value={selectedProperty?._id || ""}
                onChange={handlePropertyChange}
              >
                <option value="">Select Property</option>
                {properties.map((property) => (
                  <option key={property._id} value={property._id}>
                    {property.name}
                  </option>
                ))}
              </select>
            )}

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
