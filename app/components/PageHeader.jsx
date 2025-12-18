"use client";

import styles from "@/app/styles/pageHeader.module.css";

export default function PageHeader({
  title,
  subtitle,
  actions = null,
  className = "",
  ...props
}) {
  return (
    <div className={`${styles.pageHeader} ${className}`} {...props}>
      <div className={styles.pageHeaderLeft}>
        <h1 className={styles.pageTitle}>{title}</h1>
        {subtitle && <p className={styles.pageSubtitle}>{subtitle}</p>}
      </div>
      {actions && <div className={styles.pageActions}>{actions}</div>}
    </div>
  );
}
