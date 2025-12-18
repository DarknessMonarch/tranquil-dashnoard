"use client";

import styles from "@/app/styles/tabs.module.css";

export default function Tabs({
  tabs = [],
  activeTab,
  onTabChange,
  className = "",
  ...props
}) {
  return (
    <div className={`${styles.tabs} ${className}`} {...props}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ""}`}
        >
          {tab.icon && <span className={styles.tabIcon}>{tab.icon}</span>}
          <span className={styles.tabLabel}>{tab.label}</span>
          {tab.count !== undefined && (
            <span className={styles.tabCount}>{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
