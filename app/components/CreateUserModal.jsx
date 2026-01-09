"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";
import Button from "./Button";
import SpecialistPermissionSelector from "./SpecialistPermissionSelector";
import { useAuthStore } from "@/app/store/AuthStore";
import { useLandlordStore } from "@/app/store/LandlordStore";
import formStyles from "@/app/styles/form.module.css";
import styles from "@/app/styles/createUserModal.module.css";

const SERVER_API = process.env.NEXT_PUBLIC_SERVER_API;

export default function CreateUserModal({ isOpen, onClose, onSuccess }) {
  const { accessToken, role: currentUserRole } = useAuthStore();
  const { properties, fetchProperties } = useLandlordStore();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
    role: "manager",
  });

  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [selectedProperties, setSelectedProperties] = useState([]);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Fetch properties when modal opens
  useEffect(() => {
    if (isOpen && properties.length === 0) {
      fetchProperties();
    }
  }, [isOpen]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        username: "",
        email: "",
        password: "",
        phone: "",
        role: currentUserRole === "admin" ? "manager" : "specialist",
      });
      setSelectedPermissions([]);
      setSelectedProperties([]);
      setErrors({});
      setSubmitError("");
    }
  }, [isOpen, currentUserRole]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    setFormData((prev) => ({ ...prev, role: newRole }));
    // Clear permissions if switching away from specialist
    if (newRole !== "specialist") {
      setSelectedPermissions([]);
    }
    // Clear properties if switching to admin
    if (newRole === "admin") {
      setSelectedProperties([]);
    }
  };

  const handlePropertyToggle = (propertyId) => {
    setSelectedProperties((prev) =>
      prev.includes(propertyId)
        ? prev.filter((id) => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.role === "specialist" && selectedPermissions.length === 0) {
      newErrors.permissions = "At least one permission is required for specialists";
    }

    if (
      (formData.role === "manager" || formData.role === "specialist") &&
      selectedProperties.length === 0
    ) {
      newErrors.properties = "At least one property must be assigned";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Determine the correct endpoint based on role
      let endpoint = "";
      let requestBody = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
      };

      if (formData.role === "manager") {
        endpoint = `${SERVER_API}/auth/createManager`;
        requestBody.assignedProperties = selectedProperties;
      } else if (formData.role === "specialist") {
        endpoint = `${SERVER_API}/auth/createSpecialist`;
        requestBody.specialistPermissions = selectedPermissions;
        requestBody.assignedProperties = selectedProperties;
      } else if (formData.role === "admin") {
        endpoint = `${SERVER_API}/auth/createAdmin`;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.status === "success") {
        onSuccess && onSuccess(data.data.user);
        onClose();
      } else {
        setSubmitError(data.message || "Failed to create user");
      }
    } catch (error) {
      console.error("Create user error:", error);
      setSubmitError("An error occurred while creating the user");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter available roles based on current user's role
  const availableRoles = currentUserRole === "admin"
    ? [
        { value: "manager", label: "Manager" },
        { value: "specialist", label: "Specialist" },
        { value: "admin", label: "Admin" },
      ]
    : [{ value: "specialist", label: "Specialist" }];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New User"
      size="large"
      actions={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={isLoading}>
            Create User
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        {submitError && <div className={styles.errorBanner}>{submitError}</div>}

        {/* Basic Information */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Basic Information</h3>

          <div className={formStyles.formGroup}>
            <label className={formStyles.label}>
              Username <span className={formStyles.required}>*</span>
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className={formStyles.input}
              placeholder="Enter username"
              disabled={isLoading}
            />
            {errors.username && (
              <span className={formStyles.error}>{errors.username}</span>
            )}
          </div>

          <div className={formStyles.formGroup}>
            <label className={formStyles.label}>
              Email <span className={formStyles.required}>*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={formStyles.input}
              placeholder="Enter email address"
              disabled={isLoading}
            />
            {errors.email && (
              <span className={formStyles.error}>{errors.email}</span>
            )}
          </div>

          <div className={formStyles.formGroup}>
            <label className={formStyles.label}>
              Password <span className={formStyles.required}>*</span>
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={formStyles.input}
              placeholder="Enter password (min. 6 characters)"
              disabled={isLoading}
            />
            {errors.password && (
              <span className={formStyles.error}>{errors.password}</span>
            )}
          </div>

          <div className={formStyles.formGroup}>
            <label className={formStyles.label}>Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className={formStyles.input}
              placeholder="Enter phone number (optional)"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Role Selection */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Role & Permissions</h3>

          <div className={formStyles.formGroup}>
            <label className={formStyles.label}>
              Role <span className={formStyles.required}>*</span>
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleRoleChange}
              className={formStyles.select}
              disabled={isLoading}
            >
              {availableRoles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
            <span className={formStyles.hint}>
              {formData.role === "admin" &&
                "Full access to all features and settings"}
              {formData.role === "manager" &&
                "Can manage assigned properties, tenants, and create specialists"}
              {formData.role === "specialist" &&
                "Limited access based on assigned permissions"}
            </span>
          </div>

          {/* Specialist Permissions */}
          {formData.role === "specialist" && (
            <>
              <SpecialistPermissionSelector
                selectedPermissions={selectedPermissions}
                onChange={setSelectedPermissions}
                disabled={isLoading}
              />
              {errors.permissions && (
                <span className={formStyles.error}>{errors.permissions}</span>
              )}
            </>
          )}
        </div>

        {/* Property Assignment */}
        {(formData.role === "manager" || formData.role === "specialist") && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Property Assignment</h3>
            <p className={styles.sectionDescription}>
              Select the properties this user will have access to
            </p>

            {properties.length === 0 ? (
              <div className={styles.noProperties}>
                No properties available. Please create a property first.
              </div>
            ) : (
              <div className={styles.propertyGrid}>
                {properties.map((property) => (
                  <label key={property._id} className={styles.propertyItem}>
                    <input
                      type="checkbox"
                      checked={selectedProperties.includes(property._id)}
                      onChange={() => handlePropertyToggle(property._id)}
                      disabled={isLoading}
                      className={styles.propertyCheckbox}
                    />
                    <div className={styles.propertyInfo}>
                      <span className={styles.propertyName}>{property.name}</span>
                      <span className={styles.propertyAddress}>
                        {property.address}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {errors.properties && (
              <span className={formStyles.error}>{errors.properties}</span>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
}
