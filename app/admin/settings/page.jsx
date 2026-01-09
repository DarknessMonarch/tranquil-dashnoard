"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/app/store/AuthStore";
import AdminLayout from "@/app/components/AdminLayout";
import PageHeader from "@/app/components/PageHeader";
import Button from "@/app/components/Button";
import FormGroup from "@/app/components/Form/FormGroup";
import FormInput from "@/app/components/Form/FormInput";
import { validateRequired, validateEmail } from "@/app/lib/validators";
import styles from "@/app/styles/adminTable.module.css";

import { MdSave } from "react-icons/md";

export default function SettingsPage() {
  const router = useRouter();
  const { isAuth, isManager, isAdmin, username, email, phone, updateProfile } =
    useAuthStore();

  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    phone: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isAuth || (!isManager && !isAdmin)) {
      router.push("/admin/login");
      return;
    }

    setProfileData({
      username: username || "",
      email: email || "",
      phone: phone || "",
    });
  }, [isAuth, isManager, isAdmin, username, email, phone]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    const usernameValidation = validateRequired(profileData.username, "Username");
    if (!usernameValidation.valid) {
      newErrors.username = usernameValidation.message;
    }

    const emailValidation = validateRequired(profileData.email, "Email");
    if (!emailValidation.valid) {
      newErrors.email = emailValidation.message;
    } else if (!validateEmail(profileData.email)) {
      newErrors.email = "Invalid email format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
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
      <PageHeader subtitle="Manage your account settings" />

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

            <FormGroup label="Username" required error={errors.username}>
              <FormInput
                type="text"
                name="username"
                value={profileData.username}
                onChange={handleProfileChange}
                placeholder="Your username"
                error={!!errors.username}
              />
            </FormGroup>

            <FormGroup label="Email Address" required error={errors.email}>
              <FormInput
                type="email"
                name="email"
                value={profileData.email}
                onChange={handleProfileChange}
                placeholder="Your email"
                error={!!errors.email}
              />
            </FormGroup>

            <FormGroup label="Phone Number" hint="Optional - for account recovery">
              <FormInput
                type="tel"
                name="phone"
                value={profileData.phone}
                onChange={handleProfileChange}
                placeholder="Your phone number"
              />
            </FormGroup>

            <Button
              type="submit"
              variant="primary"
              icon={<MdSave size={20} />}
              style={{ marginTop: "var(--spacing-lg)" }}
            >
              Save Profile
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
