"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/app/store/AuthStore";
import ProfilePicture from "@/app/components/ProfilePicture";
import { toast } from "sonner";
import styles from "@/app/styles/adminSettings.module.css";

const SERVER_API = process.env.NEXT_PUBLIC_SERVER_API;

export default function AdminSettings() {
  const { isAdmin, username, email, currentTier, getAuthHeader } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    allowRegistration: true,
    requireEmailVerification: true,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    if (isAdmin) {
      loadSettings();
    }
  }, [isAdmin]);

  const loadSettings = async () => {
    try {
      const response = await fetch(`${SERVER_API}/settings`, {
        headers: getAuthHeader()
      });

      const data = await response.json();

      if (data.status === 'success') {
        setSettings(data.data.settings);
      }
    } catch (error) {
      console.error('Load settings error:', error);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);

    try {
      const response = await fetch(`${SERVER_API}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(settings)
      });

      const data = await response.json();

      if (data.status === 'success') {
        toast.success("Settings saved successfully");
      } else {
        toast.error(data.message || "Failed to save settings");
      }
    } catch (error) {
      console.error('Save settings error:', error);
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast.error("Please fill all password fields");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${SERVER_API}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (data.status === 'success') {
        toast.success("Password changed successfully");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
      } else {
        toast.error(data.message || "Failed to change password");
      }
    } catch (error) {
      console.error('Change password error:', error);
      toast.error("Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Admin Settings</h1>

      {/* Profile Section */}
      <div className={styles.settingsCard}>
        <h2 className={styles.sectionTitle}>Profile</h2>

        <div className={styles.profileSection}>
          <div className={styles.profilePictureContainer}>
            <ProfilePicture size="large" />
          </div>

          <div className={styles.profileInfo}>
            <div className={styles.infoGroup}>
              <label>Username</label>
              <p>{username || "N/A"}</p>
            </div>

            <div className={styles.infoGroup}>
              <label>Email</label>
              <p>{email || "N/A"}</p>
            </div>

            <div className={styles.infoGroup}>
              <label>Role</label>
              <p className={styles.adminBadge}>Administrator</p>
            </div>

            <div className={styles.infoGroup}>
              <label>Tier</label>
              <p className={styles.tierBadge}>{currentTier || "starter"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Settings */}
      <div className={styles.settingsCard}>
        <h2 className={styles.sectionTitle}>Feature Settings</h2>

        <div className={styles.togglesContainer}>
          <label className={styles.toggleItem}>
            <div className={styles.toggleInfo}>
              <p className={styles.toggleTitle}>Maintenance Mode</p>
              <p className={styles.toggleDescription}>Disable site access for maintenance</p>
            </div>
            <input
              type="checkbox"
              checked={settings.maintenanceMode}
              onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
              className={styles.checkbox}
            />
          </label>

          <label className={styles.toggleItem}>
            <div className={styles.toggleInfo}>
              <p className={styles.toggleTitle}>Allow Registration</p>
              <p className={styles.toggleDescription}>Allow new users to register</p>
            </div>
            <input
              type="checkbox"
              checked={settings.allowRegistration}
              onChange={(e) => setSettings({...settings, allowRegistration: e.target.checked})}
              className={styles.checkbox}
            />
          </label>

          <label className={styles.toggleItem}>
            <div className={styles.toggleInfo}>
              <p className={styles.toggleTitle}>Require Email Verification</p>
              <p className={styles.toggleDescription}>Users must verify email before accessing features</p>
            </div>
            <input
              type="checkbox"
              checked={settings.requireEmailVerification}
              onChange={(e) => setSettings({...settings, requireEmailVerification: e.target.checked})}
              className={styles.checkbox}
            />
          </label>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={loading}
          className={styles.saveButton}
        >
          {loading ? "Saving..." : "Save Feature Settings"}
        </button>
      </div>

      {/* Security Settings */}
      <div className={styles.settingsCard}>
        <h2 className={styles.sectionTitle}>Change Password</h2>

        <div className={styles.formInputContainer}>
          <label>Current Password</label>
          <input
            type="password"
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
            className={styles.inputField}
          />
        </div>

        <div className={styles.formInputContainer}>
          <label>New Password</label>
          <input
            type="password"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
            className={styles.inputField}
          />
        </div>

        <div className={styles.formInputContainer}>
          <label>Confirm New Password</label>
          <input
            type="password"
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
            className={styles.inputField}
          />
        </div>

        <button
          onClick={handleChangePassword}
          disabled={loading}
          className={styles.passwordButton}
        >
          {loading ? "Changing..." : "Change Password"}
        </button>
      </div>
    </div>
  );
}