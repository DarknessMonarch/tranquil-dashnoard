"use client";

import { useEffect } from "react";
import { useLoadingStore } from "@/app/store/LoadingStore";
import styles from "@/app/styles/globalLoader.module.css";

export default function GlobalLoader() {
  const { isLoading } = useLoadingStore();

  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.loaderContainer}>
        <div className={styles.spinnerWrapper}>
          <div className={styles.spinner}></div>
          <div className={styles.spinnerInner}></div>
        </div>
        <p className={styles.loadingText}>
          Loading
          <span className={styles.dots}>
            <span className={styles.dot}>.</span>
            <span className={styles.dot}>.</span>
            <span className={styles.dot}>.</span>
          </span>
        </p>
      </div>
    </div>
  );
}
