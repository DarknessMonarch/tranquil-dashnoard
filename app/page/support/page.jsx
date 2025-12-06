"use client";

import Table from "@/app/components/Table";
import { useState, useEffect } from "react";
import { useSupportStore } from "@/app/store/SupportStore";
import { useAuthStore } from "@/app/store/AuthStore";
import PopupComponent from "@/app/components/Popup";
import { toast } from "sonner";
import styles from "@/app/styles/adminSupport.module.css";

const SUPPORT_COLUMNS = [
  { key: "user", label: "USER" },
  { key: "subject", label: "SUBJECT" },
  { key: "priority", label: "PRIORITY" },
  { key: "status", label: "STATUS" },
  { key: "createdAt", label: "DATE" },
];

export default function AdminSupport() {
  const {
    allMessages,
    allMessagesLoading,
    getAllMessages,
    adminReply,
    resolveMessage,
    closeMessage,
    updatePriority,
    deleteMessage,
  } = useSupportStore();

  const { isAdmin } = useAuthStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      getAllMessages();
    }
  }, [isAdmin, getAllMessages]);

  const transformedMessages = allMessages.map(msg => ({
    ...msg,
    user: msg.user?.username || msg.user?.email || "Unknown",
    priority: msg.priority || "normal",
    status: msg.status || "open",
    createdAt: new Date(msg.createdAt).toLocaleDateString(),
  }));

  const handleViewMessage = (message) => {
    setSelectedMessage(message);
    setReplyText("");
    setShowReplyModal(true);
  };

  const handleReply = async () => {
    if (!replyText.trim()) {
      toast.error("Reply cannot be empty");
      return;
    }

    setLoading(true);
    const result = await adminReply(selectedMessage._id, replyText);
    if (result.success) {
      toast.success("Reply sent");
      setShowReplyModal(false);
      setReplyText("");
      await getAllMessages();
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  const handleResolve = async (message) => {
    setLoading(true);
    const result = await resolveMessage(message._id);
    if (result.success) {
      toast.success("Message resolved");
      await getAllMessages();
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  const handleClose = async (message) => {
    setLoading(true);
    const result = await closeMessage(message._id);
    if (result.success) {
      toast.success("Message closed");
      await getAllMessages();
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  const handleDelete = async (message) => {
    setLoading(true);
    const result = await deleteMessage(message._id);
    if (result.success) {
      toast.success("Message deleted");
      await getAllMessages();
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  return (
    <div>
      <Table
        title="Support Tickets"
        columns={SUPPORT_COLUMNS}
        data={transformedMessages}
        showEditButton={true}
        showDeleteButton={true}
        statusKey="status"
        isLoading={allMessagesLoading || loading}
        onEdit={handleViewMessage}
        onDelete={handleDelete}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        customActions={(msg) => (
          <div className={styles.actionButtons}>
            {msg.status !== "resolved" && (
              <button
                onClick={() => handleResolve(msg)}
                className={`${styles.actionButton} ${styles.resolveButton}`}
              >
                Resolve
              </button>
            )}
            {msg.status !== "closed" && (
              <button
                onClick={() => handleClose(msg)}
                className={`${styles.actionButton} ${styles.closeButton}`}
              >
                Close
              </button>
            )}
          </div>
        )}
      />

      <PopupComponent
        IsOpen={showReplyModal}
        OnClose={() => setShowReplyModal(false)}
        Width={700}
        Height={600}
        BorderRadiusTopLeft={20}
        BorderRadiusTopRight={20}
        BorderRadiusBottomLeft={20}
        BorderRadiusBottomRight={20}
        Blur={5}
        Zindex={1000}
        Content={
          selectedMessage && (
            <div className={styles.modalBody}>
              <h3 className={styles.modalTitle}>Support Ticket</h3>

              <div className={styles.modalInfoCard}>
                <span>From</span>
                <span>{selectedMessage.user}</span>
              </div>

              <div className={styles.modalInfoCard}>
                <span>Subject</span>
                <span>{selectedMessage.subject}</span>
              </div>

              <div className={styles.modalInfoCard}>
                <span>Status</span>
                <span className={`${styles.statusBadge} ${
                  selectedMessage.status === "resolved" ? styles.resolved : styles.pending
                }`}>
                  {selectedMessage.status}
                </span>
              </div>

              <div className={styles.modalInfoCard}>
                <span>Priority</span>
                <span className={`${styles.priorityBadge} ${
                  selectedMessage.priority === "high" ? styles.high : styles.normal
                }`}>
                  {selectedMessage.priority}
                </span>
              </div>

              <div className={styles.messageBox}>
                <p className={styles.messageLabel}>Message:</p>
                <p className={styles.messageText}>{selectedMessage.message}</p>
              </div>

              {selectedMessage.replies && selectedMessage.replies.length > 0 && (
                <div className={styles.repliesSection}>
                  <p className={styles.repliesTitle}>Previous Replies:</p>
                  {selectedMessage.replies.map((reply, index) => (
                    <div key={index} className={styles.replyItem}>
                      <p className={styles.replyDate}>
                        {new Date(reply.createdAt).toLocaleString()}
                      </p>
                      <p className={styles.replyText}>{reply.message}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.modalField}>
                <label>Your Reply</label>
                <textarea
                  placeholder="Type your reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                  className={styles.modalTextarea}
                />
              </div>

              <button
                onClick={handleReply}
                disabled={loading}
                className={styles.submitButton}
              >
                {loading ? "Sending..." : "Send Reply"}
              </button>
            </div>
          )
        }
      />
    </div>
  );
}
