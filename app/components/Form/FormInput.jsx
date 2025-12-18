"use client";

import styles from "@/app/styles/form.module.css";

export default function FormInput({
  type = "text",
  placeholder,
  value,
  onChange,
  icon = null,
  error = false,
  className = "",
  ...props
}) {
  return (
    <div className={`${styles.inputWrapper} ${error ? styles.hasError : ""}`}>
      {icon && <span className={styles.inputIcon}>{icon}</span>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`${styles.input} ${icon ? styles.withIcon : ""} ${className}`}
        {...props}
      />
    </div>
  );
}
