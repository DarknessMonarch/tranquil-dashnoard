"use client";

import { useState, useRef } from "react";
import { useAuthStore } from "@/app/store/AuthStore";
import { toast } from "sonner";
import { IoCamera, IoLockClosed } from "react-icons/io5";
import styles from "@/app/styles/profilePicture.module.css";

const SERVER_API = process.env.NEXT_PUBLIC_SERVER_API;

export default function ProfilePicture({ size = "medium" }) {
  const { username, currentTier, profileImage, uploadProfilePicture } = useAuthStore();
  const [preview, setPreview] = useState(profileImage);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const isLocked = currentTier === "starter";

  const handleClick = () => {
    if (isLocked) {
      toast.info("Upgrade to Pro to change your profile picture");
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    const result = await uploadProfilePicture(file);
    setUploading(false);

    if (result.success) {
      toast.success('Profile picture updated!');
    } else {
      toast.error(result.message || 'Failed to upload');
      setPreview(profileImage); // Revert preview on error
    }
  };

  const sizeClass = size === "small" ? styles.small : size === "large" ? styles.large : styles.medium;

  // Get the profile image URL
  const getProfileImageUrl = () => {
    if (preview) return preview;
    if (profileImage) {
      // Check if it's already a full URL or needs SERVER_API prefix
      return profileImage.startsWith('http') ? profileImage : `${SERVER_API}${profileImage}`;
    }
    return null;
  };

  const profileImageUrl = getProfileImageUrl();

  return (
    <div className={`${styles.avatarWrapper} ${sizeClass} ${isLocked ? styles.locked : ""}`} onClick={handleClick}>
      {profileImageUrl ? (
        <img
          src={profileImageUrl}
          alt={`${username}'s profile picture` || "Profile"}
          className={styles.avatarImage}
          onError={(e) => {
            // Fallback to placeholder if image fails to load
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : (
        <div className={styles.avatarPlaceholder}>
          {username?.charAt(0).toUpperCase() || "Q"}
        </div>
      )}

      {/* Hidden placeholder for image load error fallback */}
      <div
        className={styles.avatarPlaceholder}
        style={{ display: profileImageUrl ? 'none' : 'flex' }}
      >
        {username?.charAt(0).toUpperCase() || "Q"}
      </div>

      <div className={styles.avatarOverlay}>
        {uploading ? (
          <div className={styles.spinner}></div>
        ) : isLocked ? (
          <IoLockClosed className={styles.overlayIcon} />
        ) : (
          <IoCamera className={styles.overlayIcon} />
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className={styles.fileInput}
        disabled={isLocked}
      />
    </div>
  );
}
