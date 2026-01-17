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
  const { accessToken, role: currentUserRole, isSuperAdmin } = useAuthStore();
  const { properties, fetchProperties } = useLandlordStore();

  const [selectedRole, setSelectedRole] = useState("manager");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [selectedProperties, setSelectedProperties] = useState([]);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Fetch properties when modal opens
  useEffect(() => {
    if (isOpen && properties.length === 0) {
      fetchProperties();
    }
  }, [isOpen]);

  // Fetch assignable users when modal opens or role changes
  useEffect(() => {
    if (isOpen) {
      fetchAssignableUsers(selectedRole);
    }
  }, [isOpen, selectedRole]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedRole(currentUserRole === "admin" ? "manager" : "specialist");
      setSelectedUserId("");
      setAssignableUsers([]);
      setSelectedPermissions([]);
      setSelectedProperties([]);
      setErrors({});
      setSubmitError("");
    }
  }, [isOpen, currentUserRole]);

  const fetchAssignableUsers = async (targetRole) => {
    setIsLoadingUsers(true);
    try {
      const response = await fetch(
        `${SERVER_API}/auth/assignable-users?targetRole=${targetRole}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();
      if (data.status === "success") {
        setAssignableUsers(data.data.users || []);
      } else {
        console.error("Failed to fetch assignable users:", data.message);
        setAssignableUsers([]);
      }
    } catch (error) {
      console.error("Error fetching assignable users:", error);
      setAssignableUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    setSelectedRole(newRole);
    setSelectedUserId("");
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

    if (!selectedUserId) {
      newErrors.user = "Please select a user";
    }

    if (selectedRole === "specialist" && selectedPermissions.length === 0) {
      newErrors.permissions = "At least one permission is required for specialists";
    }

    if (
      (selectedRole === "manager" || selectedRole === "specialist") &&
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
      const requestBody = {
        userId: selectedUserId,
        role: selectedRole,
      };

      if (selectedRole === "specialist") {
        requestBody.permissions = selectedPermissions;
        requestBody.properties = selectedProperties;
      } else if (selectedRole === "manager") {
        requestBody.properties = selectedProperties;
      }

      const response = await fetch(`${SERVER_API}/auth/assign-role`, {
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
        setSubmitError(data.message || "Failed to assign role");
      }
    } catch (error) {
      console.error("Assign role error:", error);
      setSubmitError("An error occurred while assigning the role");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to format address
  const formatAddress = (address) => {
    if (!address) return "No address";
    if (typeof address === "string") return address;

    // Handle address object
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.country) parts.push(address.country);

    return parts.length > 0 ? parts.join(", ") : "No address";
  };

  // Get role badge color
  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'tenant':
        return { background: '#E3F2FD', color: '#1976D2' };
      case 'specialist':
        return { background: '#F3E5F5', color: '#7B1FA2' };
      case 'manager':
        return { background: '#E8F5E9', color: '#388E3C' };
      default:
        return { background: '#F5F5F5', color: '#616161' };
    }
  };

  // Filter available roles based on current user's role
  const availableRoles = currentUserRole === "admin"
    ? [
        { value: "manager", label: "Manager" },
        { value: "specialist", label: "Specialist" },
        ...(isSuperAdmin ? [{ value: "admin", label: "Admin" }] : []),
      ]
    : [{ value: "specialist", label: "Specialist" }];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Role"
      size="large"
      actions={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={isLoading}>
            Assign Role
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        {submitError && <div className={styles.errorBanner}>{submitError}</div>}

        {/* Role Selection */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Select Role</h3>

          <div className={formStyles.formGroup}>
            <label className={formStyles.label}>
              Role <span className={formStyles.required}>*</span>
            </label>
            <select
              name="role"
              value={selectedRole}
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
              {selectedRole === "admin" &&
                "Full access to all features and settings"}
              {selectedRole === "manager" &&
                "Can manage assigned properties, tenants, and create specialists"}
              {selectedRole === "specialist" &&
                "Limited access based on assigned permissions"}
            </span>
          </div>

          {/* Specialist Permissions */}
          {selectedRole === "specialist" && (
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

        {/* User Selection */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Select User</h3>
          <p className={styles.sectionDescription}>
            Choose an existing user to assign this role to
          </p>

          <div className={formStyles.formGroup}>
            <label className={formStyles.label}>
              User <span className={formStyles.required}>*</span>
            </label>
            {isLoadingUsers ? (
              <div className={styles.loadingUsers}>Loading users...</div>
            ) : assignableUsers.length === 0 ? (
              <div className={styles.noUsers}>
                No users available for this role assignment.
                {selectedRole === "specialist" && " Only tenants can be assigned as specialists."}
                {selectedRole === "manager" && " Only tenants or specialists can be promoted to managers."}
              </div>
            ) : (
              <>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className={formStyles.select}
                  disabled={isLoading}
                >
                  <option value="">-- Select a user --</option>
                  {assignableUsers.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.username} ({user.email}) - {user.role}
                    </option>
                  ))}
                </select>

                {/* Selected user preview */}
                {selectedUserId && (
                  <div className={styles.selectedUserPreview}>
                    {(() => {
                      const user = assignableUsers.find(u => u._id === selectedUserId);
                      if (!user) return null;
                      return (
                        <>
                          <div className={styles.userPreviewHeader}>
                            <span className={styles.userName}>{user.username}</span>
                            <span
                              className={styles.userRoleBadge}
                              style={getRoleBadgeStyle(user.role)}
                            >
                              {user.role}
                            </span>
                          </div>
                          <div className={styles.userPreviewDetails}>
                            <span>{user.email}</span>
                            {user.phone && <span> | {user.phone}</span>}
                          </div>
                          {user.assignedProperties && user.assignedProperties.length > 0 && (
                            <div className={styles.userPreviewProperties}>
                              Current properties: {user.assignedProperties.map(p => p.name).join(', ')}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </>
            )}
            {errors.user && (
              <span className={formStyles.error}>{errors.user}</span>
            )}
          </div>
        </div>

        {/* Property Assignment */}
        {(selectedRole === "manager" || selectedRole === "specialist") && (
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
                        {formatAddress(property.address)}
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
