"use client";

import styles from "@/app/styles/badge.module.css";

export default function Badge({
  variant = "neutral",
  size = "medium",
  children,
  className = "",
  ...props
}) {
  const badgeClass = `${styles.badge} ${styles[variant]} ${styles[size]} ${className}`;

  return (
    <span className={badgeClass} {...props}>
      {children}
    </span>
  );
}
