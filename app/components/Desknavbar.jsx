"use client";

import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/app/store/AuthStore";
import { useDrawerStore } from "@/app/store/Drawer";
import ProfileImg from "@/public/assets/banner.png";
import { TbMenu3 as MenuIcon } from "react-icons/tb";
import styles from "@/app/styles/desknav.module.css";
import { BsFillPersonFill as LoginIcon } from "react-icons/bs";
import { MdOutlineLogout as LogoutIcon } from "react-icons/md";
import { MdCameraAlt as CameraIcon } from "react-icons/md";

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

const ROUTE_TITLES = {
  account: {
    title: "Account Management",
    info: "Manage user accounts and permissions"
  },
  templates: {
    title: "Templates",
    info: "Create and manage conversation templates"
  },
  subscriptions: {
    title: "Subscriptions",
    info: "Manage user subscriptions and pricing"
  },
  support: {
    title: "Support Tickets",
    info: "Handle customer support requests"
  },
  emails: {
    title: "Email Management",
    info: "Send emails to users"
  },
  notifications: {
    title: "Notifications",
    info: "Manage system notifications"
  },
  analytics: {
    title: "Analytics",
    info: "View platform statistics and insights"
  },
  reports: {
    title: "Reports",
    info: "Generate and view reports"
  },
  settings: {
    title: "Settings",
    info: "Configure system settings"
  },
};

export default function DeskNavbar() {
  const { isOpen, toggleDrawer } = useDrawerStore();
  const [isMobile, setIsMobile] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [pageTitle, setPageTitle] = useState("Admin Dashboard");
  const [pageInfo, setPageInfo] = useState("Manage Tranquil");
  const fileInputRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isAuth = useAuthStore((state) => state.isAuth);
  const username = useAuthStore((state) => state.username);
  const email = useAuthStore((state) => state.email);
  const getProfileImageUrl = useAuthStore((state) => state.getProfileImageUrl);
  const logout = useAuthStore((state) => state.logout);
  const updateProfile = useAuthStore((state) => state.updateProfile);

  // Update page title and info when pathname changes
  useEffect(() => {
    const segments = pathname.split('/').filter(Boolean);
    const currentRoute = segments[segments.length - 1];

    const routeInfo = ROUTE_TITLES[currentRoute] || {
      title: "Admin Dashboard",
      info: "Manage Tranquil"
    };

    setPageTitle(routeInfo.title);
    setPageInfo(routeInfo.info);
  }, [pathname]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const validateFile = (file) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Please select a valid image file (JPEG, PNG, WebP or GIF)");
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image size must be less than 100MB");
      return false;
    }

    return true;
  };

  const handleProfileImageClick = () => {
    if (fileInputRef.current && !isUploadingImage) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!validateFile(file)) return;

    setIsUploadingImage(true);

    try {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const result = await updateProfile({ 
            profileImage: e.target.result 
          });

          if (result?.success) {
            toast.success("Profile image updated successfully!");
          } else {
            toast.error(result?.message || "Failed to update profile image");
          }
        } catch (error) {
          console.error("Profile image update error:", error);
          toast.error("Failed to update profile image");
        } finally {
          setIsUploadingImage(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      };

      reader.onerror = () => {
        toast.error("Failed to read the image file");
        setIsUploadingImage(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Image processing error:", error);
      toast.error("Failed to process the image");
      setIsUploadingImage(false);
    }
  };

  const handleLogout = async (e) => {
    e.stopPropagation();
    const result = await logout();
    if (result.success) {
      toast.success(result.message || "Logged out successfully");
    }
    router.push("/authentication/login");
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(",")}
        onChange={handleFileChange}
        style={{ display: "none" }}
        disabled={isUploadingImage}
        aria-hidden="true"
      />
      <div className={styles.navContainer}>
        <div className={styles.navLeft}>
          {isMobile ? (
            <div className={styles.navmenu} onClick={toggleDrawer}>
              <MenuIcon aria-label="menu" className={styles.menuIcon} />
            </div>
          ) : (
            <div className={styles.navLeftInfo}>
              <h1>{pageTitle}</h1>
              <p>{pageInfo}</p>
            </div>
          )}
        </div>
        <div className={styles.navRight}>
          {isAuth ? (
            <div className={styles.userProfile}>
              <div className={styles.profileImageWrapper}>
                <Image
                  src={getProfileImageUrl() || ProfileImg}
                  height={50}
                  width={50}
                  alt={`${username}'s profile`}
                  priority
                  className={styles.profileImg}
                  onClick={handleProfileImageClick}
                  style={{
                    cursor: isUploadingImage ? "not-allowed" : "pointer",
                    opacity: isUploadingImage ? 0.7 : 1,
                  }}
                />
                {isUploadingImage && (
                  <div className={styles.profileImageLoading}>
                    <span>...</span>
                  </div>
                )}
              </div>
              {!isMobile && (
                <div className={styles.userProfileInfo}>
                  <h1>{username}</h1>
                  <span>{email}</span>
                </div>
              )}
              <div className={styles.logoutContainer}>
                <LogoutIcon
                  aria-label="logout"
                  className={styles.logoutIcon}
                  onClick={handleLogout}
                />
              </div>
            </div>
          ) : (
            <div className={styles.logoutContainer}>
              <Link href="/authentication/login">
                <LoginIcon aria-label="login" className={styles.loginIcon} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}