"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/app/store/AuthStore";
import AdminLayout from "@/app/components/AdminLayout";
import styles from "@/app/styles/adminTable.module.css";

import { MdSave } from "react-icons/md";

const SERVER_API = process.env.NEXT_PUBLIC_SERVER_API;

export default function SettingsPage() {
  const router = useRouter();
  const { isAuth, isLandlord, isAdmin, username, email, phone, updateProfile, accessToken } =
    useAuthStore();

  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    phone: "",
  });

  const [appSettings, setAppSettings] = useState({
    appName: "",
    companyName: "",
    contactEmail: "",
    contactPhone: "",
    currency: "USD",
    primaryColor: "#0D1925",
    secondaryColor: "#6FAD42",
  });

  const [settingsLoading, setSettingsLoading] = useState(false);

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

    if (isAdmin) {
      fetchAppSettings();
    }
  }, [isAuth, isLandlord, isAdmin, username, email, phone]);

  const fetchAppSettings = async () => {
    try {
      setSettingsLoading(true);
      const response = await fetch(`${SERVER_API}/settings`);
      const data = await response.json();

      if (data.status === "success" && data.data.settings) {
        const settings = data.data.settings;
        setAppSettings({
          appName: settings.appName || "",
          companyName: settings.companyName || "",
          contactEmail: settings.contactEmail || "",
          contactPhone: settings.contactPhone || "",
          currency: settings.currency || "USD",
          primaryColor: settings.primaryColor || "#0D1925",
          secondaryColor: settings.secondaryColor || "#6FAD42",
        });
      }
    } catch (error) {
      console.error("Error fetching app settings:", error);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAppSettingsChange = (e) => {
    const { name, value } = e.target;
    setAppSettings((prev) => ({ ...prev, [name]: value }));
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

  const handleAppSettingsSubmit = async (e) => {
    e.preventDefault();

    if (!appSettings.appName.trim()) {
      toast.error("App name is required");
      return;
    }

    if (!appSettings.companyName.trim()) {
      toast.error("Company name is required");
      return;
    }

    if (!appSettings.contactEmail.trim()) {
      toast.error("Contact email is required");
      return;
    }

    try {
      const response = await fetch(`${SERVER_API}/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(appSettings),
      });

      const data = await response.json();

      if (data.status === "success") {
        toast.success("App settings updated successfully");
        fetchAppSettings();
      } else {
        toast.error(data.message || "Failed to update app settings");
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

      {isAdmin && (
        <div
          className={styles.tableCard}
          style={{ maxWidth: "800px", marginTop: "var(--spacing-xl)" }}
        >
          <form onSubmit={handleAppSettingsSubmit}>
            <div style={{ padding: "var(--spacing-xl)" }}>
              <h3
                style={{
                  fontSize: "var(--font-size-lg)",
                  fontWeight: "var(--font-weight-semibold)",
                  marginBottom: "var(--spacing-lg)",
                  color: "var(--dark-color)",
                }}
              >
                Application Settings
              </h3>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>App Name *</label>
                <input
                  type="text"
                  name="appName"
                  className={styles.formInput}
                  value={appSettings.appName}
                  onChange={handleAppSettingsChange}
                  placeholder="e.g., Tranquil"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Company Name *</label>
                <input
                  type="text"
                  name="companyName"
                  className={styles.formInput}
                  value={appSettings.companyName}
                  onChange={handleAppSettingsChange}
                  placeholder="e.g., Tranquil Property Management"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Contact Email *</label>
                <input
                  type="email"
                  name="contactEmail"
                  className={styles.formInput}
                  value={appSettings.contactEmail}
                  onChange={handleAppSettingsChange}
                  placeholder="e.g., support@tranquil.com"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Contact Phone</label>
                <input
                  type="tel"
                  name="contactPhone"
                  className={styles.formInput}
                  value={appSettings.contactPhone}
                  onChange={handleAppSettingsChange}
                  placeholder="e.g., +254712345678"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Currency</label>
                <select
                  name="currency"
                  className={styles.formSelect}
                  value={appSettings.currency}
                  onChange={handleAppSettingsChange}
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="KES">KES - Kenyan Shilling</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Primary Color</label>
                <input
                  type="color"
                  name="primaryColor"
                  className={styles.formInput}
                  value={appSettings.primaryColor}
                  onChange={handleAppSettingsChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Secondary Color</label>
                <input
                  type="color"
                  name="secondaryColor"
                  className={styles.formInput}
                  value={appSettings.secondaryColor}
                  onChange={handleAppSettingsChange}
                />
              </div>

              <button
                type="submit"
                className={styles.primaryButton}
                style={{ marginTop: "var(--spacing-lg)" }}
                disabled={settingsLoading}
              >
                <MdSave size={20} />
                Save App Settings
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
}
