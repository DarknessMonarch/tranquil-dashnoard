"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAdminStore } from "@/app/store/AdminStore";
import { useAuthStore } from "@/app/store/AuthStore";
import AdminLayout from "@/app/components/AdminLayout";
import PageHeader from "@/app/components/PageHeader";
import SearchBar from "@/app/components/SearchBar";
import Tabs from "@/app/components/Tabs";
import Badge from "@/app/components/Badge";
import Button from "@/app/components/Button";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import { formatDate } from "@/app/lib/formatters";
import styles from "@/app/styles/adminTable.module.css";

import {
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    if (!isAuth || !isAdmin) {
      router.push("/admin/login");
      return;
    }

    getAllUsers();
  }, [isAuth, isAdmin]);

  const handleDeleteClick = (userId, username) => {
    setUserToDelete({ id: userId, name: username });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    const result = await deleteUser(userToDelete.id);
    if (result.success) {
      toast.success("User deleted successfully");
    } else {
      toast.error(result.message || "Failed to delete user");
    }
    setUserToDelete(null);
  };

  const getRoleBadgeVariant = (role) => {
    const roleMap = {
      landlord: "landlord",
      tenant: "tenant",
      admin: "admin",
    };
    return roleMap[role] || "tenant";
  };

  const getRoleLabel = (role) => {
    const roleMap = {
      landlord: "Landlord",
      tenant: "Tenant",
      admin: "Admin",
    };
    return roleMap[role] || "Tenant";
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
  const adminsCount = (users || []).filter(
    (u) => u.role === "admin" || u.isAdmin === true
  ).length;
  const tenantsCount = (users || []).filter((u) => u.role === "tenant").length;

  // Tabs configuration
  const tabs = [
    {
      id: "all",
      label: "All Users",
      icon: <MdPerson size={20} />,
      count: allCount,
    },
    {
      id: "admins",
      label: "Admins",
      icon: <MdAdminPanelSettings size={20} />,
      count: adminsCount,
    },
    {
      id: "tenants",
      label: "Tenants",
      icon: <MdHome size={20} />,
      count: tenantsCount,
    },
  ];

  return (
    <AdminLayout>
      <PageHeader
        subtitle="Manage all system users"
        actions={
          <SearchBar
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm("")}
          />
        }
      />

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

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
                    <td>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={user.emailVerified ? "verified" : "unverified"}>
                        {user.emailVerified ? "Verified" : "Unverified"}
                      </Badge>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <div className={styles.actionButtons}>
                        <Button
                          variant="icon"
                          icon={<MdDelete size={18} />}
                          onClick={() =>
                            handleDeleteClick(user._id, user.username)
                          }
                          title="Delete"
                          className={styles.delete}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setUserToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete User"
        message={`Are you sure you want to delete "${userToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </AdminLayout>
  );
}
