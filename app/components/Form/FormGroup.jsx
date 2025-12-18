"use client";

import styles from "@/app/styles/form.module.css";

export default function FormGroup({
  label,
  required = false,
  error = null,
  hint = null,
  children,
  className = "",
  ...props
}) {
  return (
    <div className={`${styles.formGroup} ${className}`} {...props}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      {children}
      {hint && !error && <span className={styles.hint}>{hint}</span>}
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
