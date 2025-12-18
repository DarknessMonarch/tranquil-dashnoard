"use client";

import { MdSearch, MdClose } from "react-icons/md";
import styles from "@/app/styles/searchBar.module.css";

export default function SearchBar({
  placeholder = "Search...",
  value,
  onChange,
  onClear,
  className = "",
  ...props
}) {
  return (
    <div className={`${styles.searchBar} ${className}`} {...props}>
      <MdSearch className={styles.searchIcon} />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={styles.searchInput}
      />
      {value && (
        <button
          onClick={onClear}
          className={styles.clearButton}
          aria-label="Clear search"
        >
          <MdClose />
        </button>
      )}
    </div>
  );
}
