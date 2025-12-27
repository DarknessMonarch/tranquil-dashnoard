"use client";

import styles from "@/app/styles/button.module.css";

export default function Button({
  children,
  variant = "primary",
  size = "medium",
  icon,
  iconPosition = "left",
  onClick,
  disabled = false,
  type = "button",
  className = "",
  fullWidth = false,
  loading = false,
  ...props
}) {
  const buttonClass = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    icon && !children && styles.iconOnly,
    loading && styles.loading,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={buttonClass}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className={styles.spinner}></span>
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
