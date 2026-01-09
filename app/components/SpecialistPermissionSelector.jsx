"use client";

import styles from "@/app/styles/permissionSelector.module.css";

const AVAILABLE_PERMISSIONS = [
  { value: 'bills', label: 'Bills Management', description: 'Create and edit bills for tenants' },
  { value: 'payments', label: 'Payments Management', description: 'Record and manage payments' },
  { value: 'maintenance', label: 'Maintenance Requests', description: 'View and update maintenance status' },
  { value: 'feedback', label: 'Feedback Management', description: 'View and reply to feedback' },
  { value: 'notices', label: 'Notices Management', description: 'Create and manage notices' },
];

export default function SpecialistPermissionSelector({
  selectedPermissions = [],
  onChange,
  disabled = false
}) {
  const handleToggle = (permission) => {
    if (disabled) return;

    const isSelected = selectedPermissions.includes(permission);
    const updated = isSelected
      ? selectedPermissions.filter(p => p !== permission)
      : [...selectedPermissions, permission];
    onChange(updated);
  };

  return (
    <div className={styles.permissionSelector}>
      <h3 className={styles.title}>Specialist Permissions</h3>
      <p className={styles.subtitle}>Select the permissions this specialist will have access to</p>

      <div className={styles.permissionGrid}>
        {AVAILABLE_PERMISSIONS.map(perm => (
          <label
            key={perm.value}
            className={`${styles.permissionItem} ${
              selectedPermissions.includes(perm.value) ? styles.selected : ''
            } ${disabled ? styles.disabled : ''}`}
          >
            <input
              type="checkbox"
              checked={selectedPermissions.includes(perm.value)}
              onChange={() => handleToggle(perm.value)}
              disabled={disabled}
              className={styles.checkbox}
            />
            <div className={styles.permissionInfo}>
              <span className={styles.permissionLabel}>{perm.label}</span>
              <span className={styles.permissionDescription}>{perm.description}</span>
            </div>
          </label>
        ))}
      </div>

      {selectedPermissions.length === 0 && !disabled && (
        <p className={styles.warning}>⚠️ At least one permission is required for specialists</p>
      )}
    </div>
  );
}
