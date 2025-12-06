"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/app/store/AuthStore";
import { toast } from "sonner";
import {
  IoCheckmarkCircle,
  IoCloseCircle,
  IoTime,
  IoTrash,
  IoEye,
  IoFilter,
} from "react-icons/io5";
import styles from "@/app/styles/adminSuccessStories.module.css";

const SERVER_API = process.env.NEXT_PUBLIC_SERVER_API;

export default function SuccessStoriesAdmin() {
  const { isAdmin, getAuthHeader } = useAuthStore();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedStory, setSelectedStory] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    if (isAdmin) {
      loadStories();
    }
  }, [isAdmin, filterStatus]);

  const loadStories = async () => {
    setLoading(true);

    try {
      const queryParam = filterStatus !== "all" ? `?status=${filterStatus}` : "";
      const response = await fetch(
        `${SERVER_API}/success-stories-admin/all${queryParam}`,
        {
          headers: getAuthHeader(),
        }
      );

      const data = await response.json();

      if (data.status === "success") {
        setStories(data.data.stories);
      } else {
        toast.error(data.message || "Failed to load success stories");
      }
    } catch (error) {
      console.error("Load stories error:", error);
      toast.error("Failed to load success stories");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (storyId) => {
    try {
      const response = await fetch(
        `${SERVER_API}/success-stories-admin/${storyId}/approve`,
        {
          method: "PATCH",
          headers: getAuthHeader(),
        }
      );

      const data = await response.json();

      if (data.status === "success") {
        toast.success("Success story approved!");
        loadStories();
        setSelectedStory(null);
      } else {
        toast.error(data.message || "Failed to approve story");
      }
    } catch (error) {
      console.error("Approve story error:", error);
      toast.error("Failed to approve story");
    }
  };

  const handleReject = async (storyId) => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      const response = await fetch(
        `${SERVER_API}/success-stories-admin/${storyId}/reject`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
          },
          body: JSON.stringify({ reason: rejectionReason }),
        }
      );

      const data = await response.json();

      if (data.status === "success") {
        toast.success("Success story rejected");
        loadStories();
        setSelectedStory(null);
        setRejectionReason("");
      } else {
        toast.error(data.message || "Failed to reject story");
      }
    } catch (error) {
      console.error("Reject story error:", error);
      toast.error("Failed to reject story");
    }
  };

  const handleDelete = async (storyId) => {
    if (!confirm("Are you sure you want to delete this success story?")) {
      return;
    }

    try {
      const response = await fetch(
        `${SERVER_API}/success-stories-admin/${storyId}`,
        {
          method: "DELETE",
          headers: getAuthHeader(),
        }
      );

      const data = await response.json();

      if (data.status === "success") {
        toast.success("Success story deleted");
        loadStories();
        setSelectedStory(null);
      } else {
        toast.error(data.message || "Failed to delete story");
      }
    } catch (error) {
      console.error("Delete story error:", error);
      toast.error("Failed to delete story");
    }
  };

  const getStatusBadge = (status) => {
    const badgeClass =
      status === "approved"
        ? styles.badgeApproved
        : status === "rejected"
        ? styles.badgeRejected
        : styles.badgePending;

    const icon =
      status === "approved" ? (
        <IoCheckmarkCircle />
      ) : status === "rejected" ? (
        <IoCloseCircle />
      ) : (
        <IoTime />
      );

    return (
      <span className={`${styles.badge} ${badgeClass}`}>
        {icon}
        {status}
      </span>
    );
  };

  const getTierBadge = (tier) => {
    return (
      <span className={`${styles.tierBadge} ${styles[`tier${tier}`]}`}>
        {tier}
      </span>
    );
  };

  const filteredStories = stories;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Success Stories Management</h1>
        <p>Review and manage user-submitted success stories</p>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <button
          className={`${styles.filterButton} ${
            filterStatus === "all" ? styles.filterActive : ""
          }`}
          onClick={() => setFilterStatus("all")}
        >
          All ({stories.length})
        </button>
        <button
          className={`${styles.filterButton} ${
            filterStatus === "pending" ? styles.filterActive : ""
          }`}
          onClick={() => setFilterStatus("pending")}
        >
          <IoTime /> Pending
        </button>
        <button
          className={`${styles.filterButton} ${
            filterStatus === "approved" ? styles.filterActive : ""
          }`}
          onClick={() => setFilterStatus("approved")}
        >
          <IoCheckmarkCircle /> Approved
        </button>
        <button
          className={`${styles.filterButton} ${
            filterStatus === "rejected" ? styles.filterActive : ""
          }`}
          onClick={() => setFilterStatus("rejected")}
        >
          <IoCloseCircle /> Rejected
        </button>
      </div>

      {/* Stories List */}
      <div className={styles.storiesContainer}>
        {loading ? (
          <div className={styles.loading}>Loading success stories...</div>
        ) : filteredStories.length === 0 ? (
          <div className={styles.empty}>
            No success stories found for this filter.
          </div>
        ) : (
          <div className={styles.storiesList}>
            {filteredStories.map((story) => (
              <div key={story._id} className={styles.storyCard}>
                <div className={styles.storyHeader}>
                  <div className={styles.storyMeta}>
                    <h3>{story.title}</h3>
                    <div className={styles.badges}>
                      {getStatusBadge(story.status)}
                      {getTierBadge(story.userTier)}
                    </div>
                  </div>
                  <button
                    className={styles.viewButton}
                    onClick={() => setSelectedStory(story)}
                  >
                    <IoEye /> View Details
                  </button>
                </div>

                <p className={styles.storyPreview}>
                  {story.story.substring(0, 150)}
                  {story.story.length > 150 ? "..." : ""}
                </p>

                <div className={styles.storyFooter}>
                  <div className={styles.storyInfo}>
                    <span>By: {story.user?.username || "Unknown"}</span>
                    <span>
                      Submitted:{" "}
                      {new Date(story.submittedAt).toLocaleDateString()}
                    </span>
                  </div>

                  {story.status === "pending" && (
                    <div className={styles.quickActions}>
                      <button
                        className={styles.approveButton}
                        onClick={() => handleApprove(story._id)}
                      >
                        <IoCheckmarkCircle /> Approve
                      </button>
                      <button
                        className={styles.rejectButton}
                        onClick={() => setSelectedStory(story)}
                      >
                        <IoCloseCircle /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Story Detail Modal */}
      {selectedStory && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            setSelectedStory(null);
            setRejectionReason("");
          }}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2>{selectedStory.title}</h2>
              <button
                className={styles.modalClose}
                onClick={() => {
                  setSelectedStory(null);
                  setRejectionReason("");
                }}
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.modalMeta}>
                {getStatusBadge(selectedStory.status)}
                {getTierBadge(selectedStory.userTier)}
                <span className={styles.modalAuthor}>
                  By: {selectedStory.user?.username || "Unknown"} (
                  {selectedStory.user?.email})
                </span>
                <span className={styles.modalDate}>
                  Submitted:{" "}
                  {new Date(selectedStory.submittedAt).toLocaleString()}
                </span>
              </div>

              <div className={styles.modalStory}>
                <h3>Story</h3>
                <p>{selectedStory.story}</p>
              </div>

              {selectedStory.status === "rejected" &&
                selectedStory.rejectionReason && (
                  <div className={styles.rejectionInfo}>
                    <strong>Rejection Reason:</strong>
                    <p>{selectedStory.rejectionReason}</p>
                  </div>
                )}

              {selectedStory.status === "pending" && (
                <div className={styles.rejectionForm}>
                  <label htmlFor="rejectionReason">
                    Rejection Reason (optional):
                  </label>
                  <textarea
                    id="rejectionReason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide a reason for rejection..."
                    rows={3}
                    className={styles.rejectionTextarea}
                  />
                </div>
              )}
            </div>

            <div className={styles.modalActions}>
              {selectedStory.status === "pending" && (
                <>
                  <button
                    className={styles.approveButton}
                    onClick={() => handleApprove(selectedStory._id)}
                  >
                    <IoCheckmarkCircle /> Approve Story
                  </button>
                  <button
                    className={styles.rejectButton}
                    onClick={() => handleReject(selectedStory._id)}
                  >
                    <IoCloseCircle /> Reject Story
                  </button>
                </>
              )}
              <button
                className={styles.deleteButton}
                onClick={() => handleDelete(selectedStory._id)}
              >
                <IoTrash /> Delete Story
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
