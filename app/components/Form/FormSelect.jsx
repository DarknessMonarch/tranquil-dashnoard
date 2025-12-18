"use client";

import styles from "@/app/styles/form.module.css";

export default function FormSelect({
  options = [],
  value,
  onChange,
  placeholder = "Select an option",
  error = false,
  className = "",
  ...props
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`${styles.select} ${error ? styles.hasError : ""} ${className}`}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option, index) => (
        <option key={index} value={option.value || option}>
          {option.label || option}
        </option>
      ))}
    </select>
  );
}
