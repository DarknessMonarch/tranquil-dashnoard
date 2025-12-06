"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/app/store/AuthStore";
import { useAdminStore } from "@/app/store/AdminStore";
import PopupComponent from "@/app/components/Popup";
import { toast } from "sonner";
import styles from "@/app/styles/adminUsers.module.css";
import Table from "@/app/components/Table";

const USER_COLUMNS = [
  { key: "profileImage", label: "AVATAR" },
  { key: "username", label: "USERNAME" },
  { key: "email", label: "EMAIL" },
  { key: "phone", label: "PHONE" },
  { key: "currentTier", label: "TIER" },
  { key: "status", label: "STATUS" },
  { key: "createdAt", label: "REGISTERED" },
];

export default function AdminUsers() {
  const { 
    users, 
    usersLoading, 
    getAllUsers, 
    deleteUser, 
    bulkDeleteUsers,
    sendBulkEmail,
    makeAdmin,
    removeAdmin
  } = useAdminStore();

  const { isAdmin } = useAuthStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({ 
    subject: "", 
    message: "", 
    recipients: [] 
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      getAllUsers();
    }
  }, [isAdmin, getAllUsers]);

  const transformedUsers = users.map(user => ({
    ...user,
    status: user.isAdmin ? "Admin" : "User",
    phone: user.phone || "N/A",
    currentTier: user.currentTier || "starter",
    createdAt: new Date(user.createdAt).toLocaleDateString(),
  }));

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const handleDeleteUser = async (user) => {
    setLoading(true);
    const result = await deleteUser(user._id);
    if (result.success) {
      toast.success("User deleted successfully");
      await getAllUsers();
      setSelectedUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(user._id);
        return newSet;
      });
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  const handleBulkDelete = async (userIds) => {
    setLoading(true);
    const result = await bulkDeleteUsers(userIds);
    if (result.success) {
      toast.success(`Deleted ${userIds.length} users`);
      setSelectedUsers(new Set());
      await getAllUsers();
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  const handleBulkEmail = (userIds) => {
    const selectedUserEmails = users
      .filter(u => userIds.includes(u._id))
      .map(u => u.email);
    
    setEmailData({ 
      subject: "", 
      message: "", 
      recipients: selectedUserEmails 
    });
    setShowEmailModal(true);
  };

  const handleEmailSubmit = async () => {
    if (!emailData.subject || !emailData.message) {
      toast.error("Subject and message are required");
      return;
    }

    setLoading(true);
    const result = await sendBulkEmail(
      emailData.recipients,
      emailData.subject,
      emailData.message
    );

    if (result.success) {
      toast.success("Emails sent successfully");
      setShowEmailModal(false);
      setEmailData({ subject: "", message: "", recipients: [] });
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  const handleToggleAdmin = async (user) => {
    setLoading(true);
    const result = user.isAdmin 
      ? await removeAdmin(user._id)
      : await makeAdmin(user._id);

    if (result.success) {
      toast.success(result.message);
      await getAllUsers();
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  return (
    <div>
      <Table
        title="Users"
        columns={USER_COLUMNS}
        data={transformedUsers}
        showEditButton={true}
        showDeleteButton={true}
        showBulkActions={true}
        statusKey="status"
        isLoading={usersLoading || loading}
        onEdit={handleViewUser}
        onDelete={handleDeleteUser}
        onBulkDelete={handleBulkDelete}
        onBulkEmail={handleBulkEmail}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        enableSelection={true}
        selectedItems={selectedUsers}
        onSelectionChange={setSelectedUsers}
        customActions={(user) => (
          <button
            onClick={() => handleToggleAdmin(user)}
            className={`${styles.customActionButton} ${
              user.isAdmin ? styles.removeAdminButton : styles.makeAdminButton
            }`}
          >
            {user.isAdmin ? "Remove Admin" : "Make Admin"}
          </button>
        )}
      />

      {/* User Details Modal */}
      <PopupComponent
        IsOpen={showDetailsModal}
        OnClose={() => setShowDetailsModal(false)}
        Width={600}
        BorderRadiusTopLeft={20}
        BorderRadiusTopRight={20}
        BorderRadiusBottomLeft={20}
        BorderRadiusBottomRight={20}
        Blur={5}
        Zindex={1000}
        Content={
          selectedUser && (
            <div className={styles.modalBody}>
              <h3 className={styles.modalTitle}>User Details</h3>

              <div className={styles.modalInfoCard}>
                <span>Username</span>
                <span>{selectedUser.username}</span>
              </div>

              <div className={styles.modalInfoCard}>
                <span>Email</span>
                <div className={styles.emailBadgeContainer}>
                  <span>{selectedUser.email}</span>
                  {selectedUser.emailVerified ? (
                    <span className={styles.verifiedBadge}>✓ Verified</span>
                  ) : (
                    <span className={styles.unverifiedBadge}>! Unverified</span>
                  )}
                </div>
              </div>

              <div className={styles.modalInfoCard}>
                <span>Phone</span>
                <span>{selectedUser.phone || "N/A"}</span>
              </div>

              <div className={styles.modalInfoCard}>
                <span>Current Tier</span>
                <span className={styles.tierBadge}>{selectedUser.currentTier}</span>
              </div>

              <div className={styles.modalInfoCard}>
                <span>Admin Status</span>
                <span className={`${styles.adminStatusBadge} ${
                  selectedUser.isAdmin ? styles.isAdmin : styles.notAdmin
                }`}>
                  {selectedUser.isAdmin ? "Yes" : "No"}
                </span>
              </div>

              <div className={styles.modalInfoCard}>
                <span>Registration Date</span>
                <span className={styles.registrationDate}>
                  {new Date(selectedUser.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          )
        }
      />

      {/* Email Modal */}
      <PopupComponent
        IsOpen={showEmailModal}
        OnClose={() => setShowEmailModal(false)}
        Width={600}
        BorderRadiusTopLeft={20}
        BorderRadiusTopRight={20}
        BorderRadiusBottomLeft={20}
        BorderRadiusBottomRight={20}
        Blur={5}
        Zindex={1000}
        Content={
          <div className={styles.modalBody}>
            <h3 className={styles.modalTitle}>Send Bulk Email</h3>
            <p className={styles.modalSubtitle}>
              Sending to {emailData.recipients?.length || 0} users
            </p>

            <div className={styles.modalField}>
              <label>Subject</label>
              <input
                type="text"
                placeholder="Enter email subject"
                value={emailData.subject}
                onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
                className={styles.modalInput}
              />
            </div>

            <div className={styles.modalField}>
              <label>Message</label>
              <textarea
                placeholder="Enter your message"
                value={emailData.message}
                onChange={(e) => setEmailData({...emailData, message: e.target.value})}
                rows={6}
                className={styles.modalTextarea}
              />
            </div>

            <button
              onClick={handleEmailSubmit}
              disabled={loading}
              className={styles.submitButton}
            >
              {loading ? "Sending..." : "Send Email"}
            </button>
          </div>
        }
      />
    </div>
  );
}
