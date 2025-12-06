"use client";

import { useState } from "react";
import { useAuthStore } from "@/app/store/AuthStore";
import PopupComponent from "@/app/components/Popup";
import Dropdown from "@/app/components/Dropdown";
import styles from "@/app/styles/form.module.css";
import { toast } from "sonner";
import { IoSend, IoNotifications } from "react-icons/io5";

const SERVER_API = process.env.NEXT_PUBLIC_SERVER_API;

export default function AdminNotifications() {
  const { isAdmin, getAuthHeader } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    targetType: "all",
    targetValue: "",
  });

  const handleAdd = () => {
    setFormData({
      title: "",
      body: "",
      targetType: "all",
      targetValue: "",
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.body.trim()) {
      toast.error("Title and message are required");
      return;
    }

    if (formData.targetType === "tier" && !formData.targetValue) {
      toast.error("Please select a tier");
      return;
    }

    if (formData.targetType === "user" && !formData.targetValue) {
      toast.error("Please enter a user ID");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${SERVER_API}/notifications/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.status === "success") {
        toast.success(`Notification sent to ${data.data.successCount} user(s)`);
        setShowModal(false);
        setFormData({ title: "", body: "", targetType: "all", targetValue: "" });
      } else {
        toast.error(data.message || "Failed to send notification");
      }
    } catch (error) {
      console.error("Send notification error:", error);
      toast.error("Failed to send notification");
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>You do not have permission to access this page</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        marginBottom: "30px"
      }}>
        <IoNotifications style={{ fontSize: "2.5rem", color: "#ec4899" }} />
        <div>
          <h1 style={{
            fontSize: "2rem",
            fontWeight: "700",
            background: "linear-gradient(135deg, #ec4899 0%, #a855f7 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            margin: 0
          }}>
            Push Notifications
          </h1>
          <p style={{ color: "#6b7280", margin: "4px 0 0 0" }}>
            Send push notifications to users via Firebase Cloud Messaging
          </p>
        </div>
      </div>

      <button
        onClick={handleAdd}
        style={{
          padding: "12px 24px",
          background: "linear-gradient(135deg, #ec4899 0%, #a855f7 100%)",
          color: "white",
          border: "none",
          borderRadius: "12px",
          cursor: "pointer",
          fontSize: "1rem",
          fontWeight: "600",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          boxShadow: "0 4px 12px rgba(236, 72, 153, 0.3)",
          transition: "all 0.2s ease",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(236, 72, 153, 0.4)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(236, 72, 153, 0.3)";
        }}
      >
        <IoSend />
        <span>Send Notification</span>
      </button>

      <PopupComponent
        IsOpen={showModal}
        OnClose={() => setShowModal(false)}
        Width={600}
        BorderRadiusTopLeft={20}
        BorderRadiusTopRight={20}
        BorderRadiusBottomLeft={20}
        BorderRadiusBottomRight={20}
        Blur={5}
        Zindex={1000}
        Content={
          <div className={styles.formMain}>
            <h3 style={{
              fontSize: "1.5rem",
              fontWeight: "700",
              background: "linear-gradient(135deg, #ec4899 0%, #a855f7 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: "20px",
              textAlign: "center"
            }}>
              Send Push Notification
            </h3>

            <div className={styles.formInputContainer}>
              <label>Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Notification title..."
                maxLength={50}
                className={styles.inputField}
              />
              <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                {formData.title.length}/50
              </span>
            </div>

            <div className={styles.formInputContainer}>
              <label>Message</label>
              <textarea
                value={formData.body}
                onChange={(e) => setFormData({...formData, body: e.target.value})}
                placeholder="Notification message..."
                maxLength={200}
                rows={4}
                className={styles.inputField}
              />
              <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                {formData.body.length}/200
              </span>
            </div>

            <div className={styles.formInputContainer}>
              <label>Send To</label>
              <Dropdown
                options={[
                  { value: "all", label: "All Users" },
                  { value: "tier", label: "Specific Tier" },
                  { value: "user", label: "Specific User" }
                ]}
                onSelect={(option) => setFormData({...formData, targetType: option.value, targetValue: ""})}
                dropPlaceHolder="Select recipient type"
                value={[
                  { value: "all", label: "All Users" },
                  { value: "tier", label: "Specific Tier" },
                  { value: "user", label: "Specific User" }
                ].find(t => t.value === formData.targetType)}
              />
            </div>

            {formData.targetType === "tier" && (
              <div className={styles.formInputContainer}>
                <label>Select Tier</label>
                <Dropdown
                  options={[
                    { value: "starter", label: "Starter Glow" },
                    { value: "pro", label: "Radiant Pro" },
                    { value: "elite", label: "Queen Elite" }
                  ]}
                  onSelect={(option) => setFormData({...formData, targetValue: option.value})}
                  dropPlaceHolder="Select tier"
                  value={[
                    { value: "starter", label: "Starter Glow" },
                    { value: "pro", label: "Radiant Pro" },
                    { value: "elite", label: "Queen Elite" }
                  ].find(t => t.value === formData.targetValue)}
                />
              </div>
            )}

            {formData.targetType === "user" && (
              <div className={styles.formInputContainer}>
                <label>User ID</label>
                <input
                  type="text"
                  value={formData.targetValue}
                  onChange={(e) => setFormData({...formData, targetValue: e.target.value})}
                  placeholder="Enter user ID..."
                  className={styles.inputField}
                />
              </div>
            )}

            {/* Preview */}
            <div style={{
              marginTop: "20px",
              padding: "16px",
              background: "rgba(236, 72, 153, 0.05)",
              borderRadius: "12px",
              border: "1px solid rgba(236, 72, 153, 0.2)"
            }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "0.875rem", color: "#6b7280" }}>
                Preview
              </h4>
              <div style={{
                display: "flex",
                gap: "12px",
                alignItems: "flex-start",
                background: "white",
                padding: "12px",
                borderRadius: "8px"
              }}>
                <IoNotifications style={{ fontSize: "1.5rem", color: "#ec4899", flexShrink: 0 }} />
                <div>
                  <h4 style={{ margin: "0 0 4px 0", fontSize: "1rem", fontWeight: "600" }}>
                    {formData.title || "Notification Title"}
                  </h4>
                  <p style={{ margin: 0, fontSize: "0.875rem", color: "#6b7280" }}>
                    {formData.body || "Notification message will appear here..."}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className={styles.submitButton}
            >
              {loading ? "Sending..." : "Send Notification"}
            </button>
          </div>
        }
      />
    </div>
  );
}
