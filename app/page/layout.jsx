"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/store/AuthStore";
import { toast } from "sonner";
import SideNav from "@/app/components/SideNav";
import Desknavbar from "@/app/components/Desknavbar";
import styles from "@/app/styles/pageLayout.module.css";

export default function AdminLayout({ children }) {
  const { isAuth, isAdmin, initializeAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!isAuth) {
      toast.error("Please log in to access admin panel");
      router.push("/authentication/login");
      return;
    }

    if (!isAdmin) {
      toast.error("Admin privileges required");
      router.push("/authentication/login");
    }
  }, [isAuth, isAdmin, router]);

  if (!isAuth || !isAdmin) {
    return null;
  }

  return (
    <div className={styles.pageLayout}>
      <SideNav />
      <div className={styles.pageContent}>
        <Desknavbar 
          title="Admin Dashboard"
          info="Manage your Tranquil platform"
        />
        <div className={styles.pageMain}>
          {children}
        </div>
      </div>
    </div>
  );
}
