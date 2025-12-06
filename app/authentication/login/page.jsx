"use client";

import { toast } from "sonner";
import Image from "next/image";
import { useAuthStore } from "@/app/store/AuthStore";
import { useState } from "react";
import Loader from "@/app/components/StateLoader";
import LogoImg from "@/public/assets/logo.png";
import styles from "@/app/styles/auth.module.css";
import { useRouter } from "next/navigation";

import {
  FiEye as ShowPasswordIcon,
  FiEyeOff as HidePasswordIcon,
} from "react-icons/fi";
import {
  MdOutlineVpnKey as PasswordIcon,
  MdOutlineEmail as EmailIcon,
} from "react-icons/md";

export default function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

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
        toast.error("Please verify your email before logging in.");
        return;
      }

      if (result.success) {
        const { isAdmin } = useAuthStore.getState();
        
        if (isAdmin) {
          toast.success("Welcome back, Admin!");
          setTimeout(() => {
            router.push("/page/account");
          }, 100);
        } else {
          toast.error("Access denied. Admin privileges required.");
        }
      } else {
        toast.error(result.message || "Login failed");
      }
    } catch (error) {
      toast.error(error.message || "An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authWrapper}>
      <form onSubmit={handleSubmit} className={styles.formContainer}>
        <div className={styles.formLogo}>
          <Image
            className={styles.logo}
            src={LogoImg}
            alt="Tranquil Logo"
            width={100}
            priority={true}
          />
        </div>
        <div className={styles.formHeader}>
          <h1>Admin Login</h1>
          <p>Enter your credentials to access the dashboard</p>
        </div>
        <div className={styles.authInput}>
          <EmailIcon className={styles.authIcon} />
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Enter your email"
            autoComplete="email"
            required
          />
        </div>
        <div className={styles.authInput}>
          <PasswordIcon className={styles.authIcon} />
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            className={styles.showBtn}
            onClick={togglePasswordVisibility}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <ShowPasswordIcon className={styles.authIcon} />
            ) : (
              <HidePasswordIcon className={styles.authIcon} />
            )}
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={styles.formAuthButton}
        >
          {isLoading ? <Loader /> : "Login"}
        </button>
      </form>
    </div>
  );
}
