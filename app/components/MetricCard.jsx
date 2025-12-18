"use client";

import styles from "@/app/styles/metricCard.module.css";

export default function MetricCard({
  icon: Icon,
  label,
  value,
  trend = null,
  color = "primary",
  onClick,
  className = "",
  ...props
}) {
  const isClickable = !!onClick;

  return (
    <div
      className={`${styles.metricCard} ${isClickable ? styles.clickable : ""} ${className}`}
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      {...props}
    >
      <div className={`${styles.iconWrapper} ${styles[color]}`}>
        {Icon && <Icon className={styles.icon} />}
      </div>
      <div className={styles.content}>
        <p className={styles.label}>{label}</p>
        <p className={styles.value}>{value}</p>
        {trend && <p className={styles.trend}>{trend}</p>}
      </div>
    </div>
  );
}
