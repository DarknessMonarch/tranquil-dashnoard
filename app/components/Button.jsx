"use client";

import styles from "@/app/styles/button.module.css";
import Loader from "./Loader";

export default function Button({
  variant = "primary",
  size = "medium",
  loading = false,
  disabled = false,
  icon = null,
  iconPosition = "left",
  onClick,
  children,
  className = "",
  type = "button",
  ...props
}) {
  const buttonClass = `${styles.button} ${styles[variant]} ${styles[size]} ${
    loading ? styles.loading : ""
  } ${className}`;

  return (
    <button
      type={type}
      className={buttonClass}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader />
      ) : (
        <>
          {icon && iconPosition === "left" && (
            <span className={styles.icon}>{icon}</span>
          )}
          {children && <span className={styles.label}>{children}</span>}
          {icon && iconPosition === "right" && (
            <span className={styles.icon}>{icon}</span>
          )}
        </>
      )}
    </button>
  );
}
