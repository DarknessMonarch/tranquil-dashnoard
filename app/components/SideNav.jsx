"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/app/store/AuthStore";
import { useDrawerStore } from "@/app/store/Drawer";
import styles from "@/app/styles/sideNav.module.css";
import ColoredLogo from "@/public/assets/logo.png";

import { IoMdNotificationsOutline as NotificationIcon } from "react-icons/io";
import { MdAccountCircle as AccountIcon } from "react-icons/md";
import { IoIosAlbums as SidePanelIcon } from "react-icons/io";
import { MdOutlineMail as EmailIcon } from "react-icons/md";
import { FaCrown as TierIcon } from "react-icons/fa";
import { IoSparkles as TemplateIcon } from "react-icons/io5";
import { IoChatbubbles as SupportIcon } from "react-icons/io5";
import { MdDashboard as DashboardIcon } from "react-icons/md";
import { IoStatsChart as AnalyticsIcon } from "react-icons/io5";
import { IoDocumentText as ReportsIcon } from "react-icons/io5";
import { IoSettings as SettingsIcon } from "react-icons/io5";
import { IoStar as SuccessStoryIcon } from "react-icons/io5";

export default function AdminSideNav() {
  const { isOpen, toggleDrawer } = useDrawerStore();
  const { isAuth, initializeAuth } = useAuthStore();
  const [isMobile, setMobile] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (isAuth) {
      initializeAuth();
    }
  }, [isAuth, initializeAuth]);

  useEffect(() => {
    const handleResize = () => {
      setMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const isLinkActive = (href) => {
    const fullPath = "/page/" + href;
    if (pathname === fullPath) return true;
    const linkLastSegment = href.split("/").pop();
    return pathname.includes(`/${linkLastSegment}`);
  };

  const navLinks = [
    {
      href: "account",
      icon: <DashboardIcon className={styles.sideNavIcon} aria-hidden="true" />,
      label: "Account",
    },
 
    {
      href: "templates",
      icon: <TemplateIcon className={styles.sideNavIcon} aria-hidden="true" />,
      label: "Templates",
    },
    {
      href: "subscriptions",
      icon: <TierIcon className={styles.sideNavIcon} aria-hidden="true" />,
      label: "Subscriptions",
    },
    {
      href: "support",
      icon: <SupportIcon className={styles.sideNavIcon} aria-hidden="true" />,
      label: "Support",
    },
    {
      href: "success-stories",
      icon: <SuccessStoryIcon className={styles.sideNavIcon} aria-hidden="true" />,
      label: "Success Stories",
    },
    {
      href: "emails",
      icon: <EmailIcon className={styles.sideNavIcon} aria-hidden="true" />,
      label: "Send Email",
    },
    {
      href: "notifications",
      icon: <NotificationIcon className={styles.sideNavIcon} aria-hidden="true" />,
      label: "Notifications",
    },
    {
      href: "analytics",
      icon: <AnalyticsIcon className={styles.sideNavIcon} aria-hidden="true" />,
      label: "Analytics",
    },
    {
      href: "reports",
      icon: <ReportsIcon className={styles.sideNavIcon} aria-hidden="true" />,
      label: "Reports",
    },
    {
      href: "settings",
      icon: <SettingsIcon className={styles.sideNavIcon} aria-hidden="true" />,
      label: "Settings",
    },
  ];

  if (isMobile && !isOpen) {
    return null;
  }

  const closeSideNav = () => {
    if (!isMobile && isOpen) {
      toggleDrawer();
    }
  };

  return (
    <div
      className={`${styles.sideNavContainer} ${
        isOpen ? styles.showSideNav : ""
      }`}
    >
      <div className={styles.sideNavTop}>
        <Image
          className={styles.logoImg}
          src={ColoredLogo}
          alt="Tranquil Logo"
          height={50}
          priority={true}
        />
        <div onClick={closeSideNav}>
          <SidePanelIcon
            className={styles.sidepanelicon}
            aria-hidden="true"
            aria-label="Toggle side panel"
          />
        </div>
      </div>
      <div className={styles.sideNavScroller}>
        <div className={styles.sideNavScrollerTop}>
          {navLinks.map((link, index) => (
            <Link
              key={index}
              href={`/page/${link.href}`}
              className={`${styles.sideNavLinkContainer} ${
                isLinkActive(link.href) ? styles.activesideNav : ""
              }`}
            >
              <div className={styles.sideNavLinkIconContainer}>{link.icon}</div>
              <h1>{link.label}</h1>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
