"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/app/store/AuthStore";
import AdminLayout from "@/app/components/AdminLayout";
import styles from "@/app/styles/adminTable.module.css";

import { MdSave } from "react-icons/md";

export default function SettingsPage() {
  const router = useRouter();
  const { isAuth, isLandlord, isAdmin, username, email, phone, updateProfile } =
    useAuthStore();

  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (!isAuth || (!isLandlord && !isAdmin)) {
      router.push("/admin/login");
      return;
    }

    setProfileData({
      username: username || "",
      email: email || "",
      phone: phone || "",
    });
  }, [isAuth, isLandlord, isAdmin, username, email, phone]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    if (!profileData.username.trim()) {
      toast.error("Username is required");
      return;
    }

    if (!profileData.email.trim()) {
      toast.error("Email is required");
      return;
    }

    try {
      const result = await updateProfile({
        username: profileData.username,
        email: profileData.email,
        phone: profileData.phone,
      });

      if (result.success) {
        toast.success("Profile updated successfully");
      } else {
        toast.error(result.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred");
    }
  };

  return (
    <AdminLayout>
      <div>
        <h2
          style={{
            marginBottom: "var(--spacing-xl)",
            color: "var(--dark-color)",
          }}
        >
          Settings
        </h2>
      </div>

      <div className={styles.tableCard} style={{ maxWidth: "800px" }}>
        <form onSubmit={handleProfileSubmit}>
          <div style={{ padding: "var(--spacing-xl)" }}>
            <h3
              style={{
                fontSize: "var(--font-size-lg)",
                fontWeight: "var(--font-weight-semibold)",
                marginBottom: "var(--spacing-lg)",
                color: "var(--dark-color)",
              }}
            >
              Profile Information
            </h3>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Username *</label>
              <input
                type="text"
                name="username"
                className={styles.formInput}
                value={profileData.username}
                onChange={handleProfileChange}
                placeholder="Your username"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Email Address *</label>
              <input
                type="email"
                name="email"
                className={styles.formInput}
                value={profileData.email}
                onChange={handleProfileChange}
                placeholder="Your email"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Phone Number</label>
              <input
                type="tel"
                name="phone"
                className={styles.formInput}
                value={profileData.phone}
                onChange={handleProfileChange}
                placeholder="Your phone number"
              />
            </div>

            <button
              type="submit"
              className={styles.primaryButton}
              style={{ marginTop: "var(--spacing-lg)" }}
            >
              <MdSave size={20} />
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
