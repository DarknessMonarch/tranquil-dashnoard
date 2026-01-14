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
import CreateUserModal from "@/app/components/CreateUserModal";
import { formatDate } from "@/app/lib/formatters";
import styles from "@/app/styles/adminTable.module.css";

import {
  MdDelete,
  MdPerson,
  MdAdminPanelSettings,
  MdHome,
  MdHourglassEmpty,
  MdCheck,
  MdClose,
  MdAdd,
  MdBusiness,
  MdWork,
} from "react-icons/md";

export default function UsersPage() {
  const router = useRouter();
  const { isAuth, isAdmin, isSuperAdmin, role } = useAuthStore();
  const {
    users,
    usersLoading,
    getAllUsers,
    deleteUser,
    getPendingApprovals,
    approveUser,
    rejectUser
  } = useAdminStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);

  useEffect(() => {
    if (!isAuth || !isAdmin) {
      router.push("/admin/login");
      return;
    }

    getAllUsers();
    fetchPendingApprovals();
  }, [isAuth, isAdmin]);

  const fetchPendingApprovals = async () => {
    setPendingLoading(true);
    const result = await getPendingApprovals();
    if (result.success) {
      setPendingUsers(result.data || []);
    }
    setPendingLoading(false);
  };

  const handleApprove = async (userId, username) => {
    const result = await approveUser(userId);
    if (result.success) {
      toast.success(`${username} approved successfully`);
      fetchPendingApprovals();
    } else {
      toast.error(result.message || "Failed to approve user");
    }
  };

  const handleReject = async (userId, username) => {
    const result = await rejectUser(userId);
    if (result.success) {
      toast.success(`${username} rejected`);
      fetchPendingApprovals();
    } else {
      toast.error(result.message || "Failed to reject user");
    }
  };

  const handleDeleteClick = (user) => {
    // Check if user is a super admin
    if (user.isSuperAdmin) {
      toast.error("Super admin cannot be deleted");
      return;
    }

    // Check if regular admin trying to delete another admin
    if (!isSuperAdmin && role === 'admin' && user.role === 'admin') {
      toast.error("Regular admins cannot delete other admin users");
      return;
    }

    setUserToDelete({ id: user._id, name: user.username, user });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    const result = await deleteUser(userToDelete.id);
    if (result.success) {
      toast.success("User deleted successfully");
      getAllUsers(); // Refresh user list
    } else {
      toast.error(result.message || "Failed to delete user");
    }
    setUserToDelete(null);
  };

  const handleUserCreated = () => {
    toast.success("User created successfully");
    getAllUsers(); // Refresh user list
  };

  const getRoleBadgeVariant = (role) => {
    const roleMap = {
      manager: "landlord",
      tenant: "tenant",
      admin: "admin",
      specialist: "info",
    };
    return roleMap[role] || "tenant";
  };

  const getRoleLabel = (role) => {
    const roleMap = {
      manager: "Manager",
      tenant: "Tenant",
      admin: "Admin",
      specialist: "Specialist",
    };
    return roleMap[role] || "Tenant";
  };

  // Filter by tab first
  const tabFilteredUsers = (users || []).filter((user) => {
    if (activeTab === "admins") {
      return user.role === "admin" || user.isAdmin === true;
    }
    if (activeTab === "managers") {
      return user.role === "manager";
    }
    if (activeTab === "specialists") {
      return user.role === "specialist";
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
  const managersCount = (users || []).filter(
    (u) => u.role === "manager"
  ).length;
  const specialistsCount = (users || []).filter(
    (u) => u.role === "specialist"
  ).length;
  const tenantsCount = (users || []).filter((u) => u.role === "tenant").length;

  // Tabs configuration
  const tabs = [
    {
      id: "pending",
      label: "Pending Approval",
      icon: <MdHourglassEmpty size={20} />,
      count: pendingUsers.length,
    },
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
      id: "managers",
      label: "Managers",
      icon: <MdBusiness size={20} />,
      count: managersCount,
    },
    {
      id: "specialists",
      label: "Specialists",
      icon: <MdWork size={20} />,
      count: specialistsCount,
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
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <SearchBar
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm("")}
            />
            <Button
              icon={<MdAdd size={20} />}
              onClick={() => setCreateUserModalOpen(true)}
            >
              Create User
            </Button>
          </div>
        }
      />

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className={styles.tableCard}>
        {activeTab === "pending" ? (
          pendingLoading ? (
            <div className={styles.emptyState}>
              <p>Loading pending approvals...</p>
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className={styles.emptyState}>
              <MdHourglassEmpty className={styles.emptyStateIcon} />
              <h3 className={styles.emptyStateTitle}>No Pending Approvals</h3>
              <p className={styles.emptyStateDescription}>
                All users have been approved
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
                    <th>Unit Number</th>
                    <th>Registered</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map((user) => (
                    <tr key={user._id}>
                      <td>
                        <strong>{user.username || "N/A"}</strong>
                      </td>
                      <td>{user.email || "N/A"}</td>
                      <td>{user.phone || "N/A"}</td>
                      <td>
                        {user.tenantInfo?.unitNumber || "N/A"}
                      </td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <Button
                            variant="success"
                            size="small"
                            loading={user.approvalLoading}
                            onClick={() => handleApprove(user._id, user.username)}
                          >
                            <MdCheck size={16} />
                          </Button>
                          <Button
                            variant="danger"
                          size="small"
                            loading={user.approvalLoading}
                            onClick={() => handleReject(user._id, user.username)}
                          >
                            <MdClose size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : usersLoading ? (
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
                  <th>Permissions</th>
                  <th>Email Verified</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user._id}
                    onClick={() => user.role === 'tenant' && router.push(`/admin/tenants/${user._id}`)}
                    className={user.role === 'tenant' ? styles.clickableRow : ''}
                    style={{ cursor: user.role === 'tenant' ? 'pointer' : 'default' }}
                  >
                    <td>
                      <div>
                        <strong>{user.username || "N/A"}</strong>
                        {user.isSuperAdmin && (
                          <Badge variant="warning" style={{ marginLeft: "8px", fontSize: "11px" }}>
                            SUPER ADMIN
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td>{user.email || "N/A"}</td>
                    <td>{user.phone || "N/A"}</td>
                    <td>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </td>
                    <td>
                      {user.role === 'specialist' && user.specialistPermissions?.length > 0 ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                          {user.specialistPermissions.map((perm) => (
                            <Badge key={perm} variant="info" style={{ fontSize: "11px" }}>
                              {perm}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: "#999" }}>—</span>
                      )}
                    </td>
                    <td>
                      <Badge variant={user.emailVerified ? "verified" : "unverified"}>
                        {user.emailVerified ? "Verified" : "Unverified"}
                      </Badge>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className={styles.actionButtons}>
                        <Button
                          variant="icon"
                          icon={<MdDelete size={18} />}
                          onClick={() => handleDeleteClick(user)}
                          title={
                            user.isSuperAdmin
                              ? "Super admin cannot be deleted"
                              : !isSuperAdmin && role === 'admin' && user.role === 'admin'
                              ? "Regular admins cannot delete other admins"
                              : "Delete"
                          }
                          disabled={
                            user.isSuperAdmin ||
                            (!isSuperAdmin && role === 'admin' && user.role === 'admin')
                          }
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

      <CreateUserModal
        isOpen={createUserModalOpen}
        onClose={() => setCreateUserModalOpen(false)}
        onSuccess={handleUserCreated}
      />
    </AdminLayout>
  );
}
