"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAdminStore } from "@/app/store/AdminStore";
import { useAuthStore } from "@/app/store/AuthStore";
import AdminLayout from "@/app/components/AdminLayout";
import styles from "@/app/styles/adminTable.module.css";

import {
  MdSearch,
  MdDelete,
  MdPerson,
} from "react-icons/md";

export default function UsersPage() {
  const router = useRouter();
  const { isAuth, isAdmin } = useAuthStore();
  const { users, usersLoading, getAllUsers, deleteUser } = useAdminStore();

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!isAuth || !isAdmin) {
      router.push("/admin/login");
      return;
    }

    getAllUsers();
  }, [isAuth, isAdmin]);

  const handleDelete = async (userId, username) => {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) {
      return;
    }

    const result = await deleteUser(userId);
    if (result.success) {
      toast.success("User deleted successfully");
    } else {
      toast.error(result.message || "Failed to delete user");
    }
  };

  const getRoleBadge = (role) => {
    const roleMap = {
      landlord: { style: "success", label: "Landlord" },
      tenant: { style: "info", label: "Tenant" },
      admin: { style: "warning", label: "Admin" },
    };
    const info = roleMap[role] || roleMap.tenant;
    return <span className={`${styles.badge} ${styles[info.style]}`}>{info.label}</span>;
  };

  const filteredUsers = users.filter((user) => {
    const search = searchTerm.toLowerCase();
    return (
      user.username?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.phone?.toLowerCase().includes(search) ||
      user.role?.toLowerCase().includes(search)
    );
  });

  return (
    <AdminLayout>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Users Management</h2>
          <p style={{ color: "var(--warm-gray)", fontSize: "var(--font-size-sm)" }}>
            Manage all system users
          </p>
        </div>
        <div className={styles.pageActions}>
          <div className={styles.searchBar}>
            <MdSearch size={20} color="var(--warm-gray)" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className={styles.tableCard}>
        {usersLoading ? (
          <div className={styles.emptyState}>
            <p>Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className={styles.emptyState}>
            <MdPerson className={styles.emptyStateIcon} />
            <h3 className={styles.emptyStateTitle}>No Users Found</h3>
            <p className={styles.emptyStateDescription}>
              {searchTerm
                ? "No users match your search criteria"
                : "No users in the system"}
            </p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Email Verified</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <strong>{user.username || "N/A"}</strong>
                    </td>
                    <td>{user.email || "N/A"}</td>
                    <td>{user.phone || "N/A"}</td>
                    <td>{getRoleBadge(user.role)}</td>
                    <td>
                      {user.emailVerified ? (
                        <span className={`${styles.badge} ${styles.success}`}>
                          Verified
                        </span>
                      ) : (
                        <span className={`${styles.badge} ${styles.warning}`}>
                          Unverified
                        </span>
                      )}
                    </td>
                    <td>
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button
                          className={`${styles.iconButton} ${styles.delete}`}
                          onClick={() => handleDelete(user._id, user.username)}
                          title="Delete"
                        >
                          <MdDelete size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
