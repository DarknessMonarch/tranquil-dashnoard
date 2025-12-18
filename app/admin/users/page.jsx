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
  MdAdminPanelSettings,
  MdHome,
} from "react-icons/md";

export default function UsersPage() {
  const router = useRouter();
  const { isAuth, isAdmin } = useAuthStore();
  const { users, usersLoading, getAllUsers, deleteUser } = useAdminStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

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

  // Filter by tab first
  const tabFilteredUsers = (users || []).filter((user) => {
    if (activeTab === "admins") {
      return user.role === "admin" || user.isAdmin === true;
    }
    if (activeTab === "tenants") {
      return user.role === "tenant";
    }
    return true; // "all" tab shows everyone
  });

  // Then filter by search term
  const filteredUsers = tabFilteredUsers.filter((user) => {
    const search = searchTerm.toLowerCase();
    return (
      user.username?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.phone?.toLowerCase().includes(search) ||
      user.role?.toLowerCase().includes(search)
    );
  });

  // Calculate counts for tabs
  const allCount = users?.length || 0;
  const adminsCount = (users || []).filter(u => u.role === "admin" || u.isAdmin === true).length;
  const tenantsCount = (users || []).filter(u => u.role === "tenant").length;

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

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        borderBottom: '1px solid var(--border-color)',
        overflowX: 'auto'
      }}>
        <button
          onClick={() => setActiveTab("all")}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            background: 'transparent',
            border: 'none',
            borderBottom: `2px solid ${activeTab === "all" ? 'var(--secondary-color)' : 'transparent'}`,
            color: activeTab === "all" ? 'var(--secondary-color)' : 'var(--warm-gray)',
            cursor: 'pointer',
            fontSize: 'var(--font-size-base)',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <MdPerson size={20} />
          <span>All Users</span>
          <span style={{
            padding: '2px 8px',
            borderRadius: '12px',
            background: activeTab === "all" ? 'rgba(111, 173, 66, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: '600'
          }}>
            {allCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("admins")}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            background: 'transparent',
            border: 'none',
            borderBottom: `2px solid ${activeTab === "admins" ? 'var(--secondary-color)' : 'transparent'}`,
            color: activeTab === "admins" ? 'var(--secondary-color)' : 'var(--warm-gray)',
            cursor: 'pointer',
            fontSize: 'var(--font-size-base)',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <MdAdminPanelSettings size={20} />
          <span>Admins</span>
          <span style={{
            padding: '2px 8px',
            borderRadius: '12px',
            background: activeTab === "admins" ? 'rgba(111, 173, 66, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: '600'
          }}>
            {adminsCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("tenants")}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            background: 'transparent',
            border: 'none',
            borderBottom: `2px solid ${activeTab === "tenants" ? 'var(--secondary-color)' : 'transparent'}`,
            color: activeTab === "tenants" ? 'var(--secondary-color)' : 'var(--warm-gray)',
            cursor: 'pointer',
            fontSize: 'var(--font-size-base)',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <MdHome size={20} />
          <span>Tenants</span>
          <span style={{
            padding: '2px 8px',
            borderRadius: '12px',
            background: activeTab === "tenants" ? 'rgba(111, 173, 66, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: '600'
          }}>
            {tenantsCount}
          </span>
        </button>
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
