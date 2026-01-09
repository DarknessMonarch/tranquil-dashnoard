"use client";

import Image from "next/image";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/app/components/Loader";
import LogoImg from "@/public/assets/logo.png";
import { useAuthStore } from "@/app/store/AuthStore";
import styles from "@/app/styles/auth.module.css";

import {
  FiEye as ShowPasswordIcon,
  FiEyeOff as HidePasswordIcon,
} from "react-icons/fi";

import { FaRegUser as UserNameIcon } from "react-icons/fa6";
import { MdOutlineVpnKey as PasswordIcon } from "react-icons/md";

export default function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  async function onSubmit(e) {
    e.preventDefault();

    if (!formData.email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!formData.password) {
      toast.error("Password is required");
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(formData.email, formData.password);

      if (result.requiresVerification) {
        toast.error(result.message);
        return;
      }

      if (result.success) {
        const authState = useAuthStore.getState();

        // Check if user is manager/admin
        if (!authState.isManager && !authState.isAdmin) {
          toast.error("Access denied. Admin credentials required.");
          useAuthStore.getState().clearUser();
          return;
        }

        toast.success("Welcome back, Admin!");
        router.push("/admin/dashboard", { scroll: false });
      } else {
        toast.error(result.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.authWrapper}>
      <form
        onSubmit={onSubmit}
        className={styles.formContainer}
        autoComplete="on"
      >
        <div className={styles.formLogo}>
          <Image
            src={LogoImg}
            alt="Tranquil image"
            fill
            sizes="100%"
            quality={100}
            style={{
              objectFit: "contain",
            }}
            priority={true}
          />
        </div>
        <div className={styles.formHeader}>
          <h1>Admin Portal</h1>
          <p>Sign in to manage your properties</p>
        </div>

        {/* Email */}
        <div className={styles.authInput}>
          <UserNameIcon
            className={styles.authIcon}
            alt="Email icon"
            width={20}
            height={20}
          />
          <input
            type="email"
            name="email"
            id="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Email"
            autoComplete="username"
            required
          />
        </div>

        {/* Password */}
        <div className={styles.authInput}>
          <PasswordIcon
            className={styles.authIcon}
            alt="password icon"
            width={20}
            height={20}
          />
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            id="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Password"
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            className={styles.showBtn}
            onClick={toggleShowPassword}
          >
            {showPassword ? (
              <ShowPasswordIcon
                className={styles.authIcon}
                width={20}
                height={20}
              />
            ) : (
              <HidePasswordIcon
                className={styles.authIcon}
                width={20}
                height={20}
              />
            )}
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={styles.formAuthButton}
        >
          {isLoading ? <Loader /> : "Sign In"}
        </button>

        <p>Tranquil Property Management System</p>
      </form>
    </div>
  );
}
