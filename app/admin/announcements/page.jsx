"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLandlordStore } from "@/app/store/LandlordStore";
import { useAuthStore } from "@/app/store/AuthStore";
import AdminLayout from "@/app/components/AdminLayout";
import styles from "@/app/styles/adminTable.module.css";

import {
  MdAdd,
  MdSearch,
  MdDelete,
  MdCampaign,
  MdClose,
} from "react-icons/md";

export default function AnnouncementsPage() {
  const router = useRouter();
  const { isAuth, isLandlord, isAdmin } = useAuthStore();
  const {
    selectedProperty,
    announcements,
    fetchAnnouncements,
    createAnnouncement,
    deleteAnnouncement,
  } = useLandlordStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    priority: "normal",
  });

  useEffect(() => {
    if (!isAuth || (!isLandlord && !isAdmin)) {
      router.push("/admin/login");
      return;
    }

    if (selectedProperty) {
      fetchAnnouncements(selectedProperty._id);
    }
  }, [selectedProperty, isAuth, isLandlord, isAdmin]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    setFormData({
      title: "",
      message: "",
      priority: "normal",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedProperty) {
      toast.error("Please select a property first");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!formData.message.trim()) {
      toast.error("Message is required");
      return;
    }

    try {
      const result = await createAnnouncement(selectedProperty._id, formData);

      if (result.success) {
        toast.success("Announcement created successfully");
        setShowModal(false);
        fetchAnnouncements(selectedProperty._id);
      } else {
        toast.error(result.message || "Operation failed");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred");
    }
  };

  const handleDelete = async (announcementId, title) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    const result = await deleteAnnouncement(announcementId);
    if (result.success) {
      toast.success("Announcement deleted successfully");
      fetchAnnouncements(selectedProperty._id);
    } else {
      toast.error(result.message || "Failed to delete announcement");
    }
  };

  const filteredAnnouncements = announcements.filter(
    (announcement) =>
      announcement.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.message?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPriorityBadge = (priority) => {
    const priorityMap = {
      low: { style: "info", label: "Low" },
      normal: { style: "success", label: "Normal" },
      high: { style: "warning", label: "High" },
      urgent: { style: "error", label: "Urgent" },
    };
    const priorityInfo = priorityMap[priority] || priorityMap.normal;
    return (
      <span className={`${styles.badge} ${styles[priorityInfo.style]}`}>
        {priorityInfo.label}
      </span>
    );
  };

  if (!selectedProperty) {
    return (
      <AdminLayout>
        <div className={styles.emptyState}>
          <MdCampaign className={styles.emptyStateIcon} />
          <h3 className={styles.emptyStateTitle}>No Property Selected</h3>
          <p className={styles.emptyStateDescription}>
            Please select a property to manage announcements.
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Announcements</h2>
          <p style={{ color: "var(--warm-gray)", fontSize: "var(--font-size-sm)" }}>
            {selectedProperty.name}
          </p>
        </div>
        <div className={styles.pageActions}>
          <div className={styles.searchBar}>
            <MdSearch size={20} color="var(--warm-gray)" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className={styles.primaryButton} onClick={openCreateModal}>
            <MdAdd size={20} />
            New Announcement
          </button>
        </div>
      </div>

      <div className={styles.tableCard}>
        {filteredAnnouncements.length === 0 ? (
          <div className={styles.emptyState}>
            <MdCampaign className={styles.emptyStateIcon} />
            <h3 className={styles.emptyStateTitle}>No Announcements Found</h3>
            <p className={styles.emptyStateDescription}>
              {searchTerm
                ? "No announcements match your search criteria"
                : "Create announcements to notify your tenants"}
            </p>
            {!searchTerm && (
              <button className={styles.primaryButton} onClick={openCreateModal}>
                <MdAdd size={20} />
                New Announcement
              </button>
            )}
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Message</th>
                  <th>Priority</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAnnouncements.map((announcement) => (
                  <tr key={announcement._id}>
                    <td>
                      <strong>{announcement.title}</strong>
                    </td>
                    <td>
                      {announcement.message?.substring(0, 80)}
                      {announcement.message?.length > 80 ? "..." : ""}
                    </td>
                    <td>{getPriorityBadge(announcement.priority || "normal")}</td>
                    <td>
                      {announcement.createdAt
                        ? new Date(announcement.createdAt).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button
                          className={`${styles.iconButton} ${styles.delete}`}
                          onClick={() =>
                            handleDelete(announcement._id, announcement.title)
                          }
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

      {/* Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>New Announcement</h3>
              <button
                className={styles.modalClose}
                onClick={() => setShowModal(false)}
              >
                <MdClose />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Title *</label>
                  <input
                    type="text"
                    name="title"
                    className={styles.formInput}
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Water Maintenance Schedule"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Message *</label>
                  <textarea
                    name="message"
                    className={styles.formTextarea}
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Write your announcement message here..."
                    required
                    rows={6}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Priority</label>
                  <select
                    name="priority"
                    className={styles.formSelect}
                    value={formData.priority}
                    onChange={handleInputChange}
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.primaryButton}>
                  Publish Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
