"use client";

import styles from "@/app/styles/form.module.css";

export default function FormTextarea({
  placeholder,
  value,
  onChange,
  rows = 4,
  error = false,
  className = "",
  ...props
}) {
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      rows={rows}
      className={`${styles.textarea} ${error ? styles.hasError : ""} ${className}`}
      {...props}
    />
  );
}
