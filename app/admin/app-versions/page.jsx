"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppVersionStore } from "@/app/store/AppVersionStore";
import { useAuthStore } from "@/app/store/AuthStore";
import AdminLayout from "@/app/components/AdminLayout";
import PageHeader from "@/app/components/PageHeader";
import Button from "@/app/components/Button";
import Badge from "@/app/components/Badge";
import Modal from "@/app/components/Modal";
import FormGroup from "@/app/components/Form/FormGroup";
import FormInput from "@/app/components/Form/FormInput";
import FormTextarea from "@/app/components/Form/FormTextarea";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import { formatDate } from "@/app/lib/formatters";
import styles from "@/app/styles/adminTable.module.css";
import uploadStyles from "./upload.module.css";

import {
  MdUpload,
  MdDelete,
  MdNotifications,
  MdAndroid,
  MdCloudUpload,
  MdCheckCircle,
  MdError,
  MdClose,
  MdSmartphone,
  MdNewReleases,
  MdDownload,
} from "react-icons/md";

export default function AppVersionsPage() {
  const router = useRouter();
  const { isAuth, isAdmin } = useAuthStore();
  const {
    versions,
    isLoading,
    uploadProgress,
    fetchVersions,
    uploadVersion,
    deleteVersion,
    sendNotification,
    resetUploadProgress,
  } = useAppVersionStore();

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [versionToDelete, setVersionToDelete] = useState(null);
  const [notifyDialogOpen, setNotifyDialogOpen] = useState(false);
  const [versionToNotify, setVersionToNotify] = useState(null);

  // Upload form state
  const [apkFiles, setApkFiles] = useState({
    arm32: null,
    arm64: null,
    x64: null,
  });
  const [formData, setFormData] = useState({
    version: "",
    buildNumber: "",
    releaseNotes: "",
    forceUpdate: false,
    canRollback: true,
  });
  const [errors, setErrors] = useState({});
  const [isUploading, setIsUploading] = useState(false);

  const arm32InputRef = useRef(null);
  const arm64InputRef = useRef(null);
  const x64InputRef = useRef(null);

  useEffect(() => {
    if (!isAuth || !isAdmin) {
      router.push("/admin/login");
      return;
    }

    fetchVersions();
  }, [isAuth, isAdmin]);

  const handleFileChange = (arch, file) => {
    if (file && !file.name.endsWith(".apk")) {
      toast.error("Please select a valid APK file");
      return;
    }
    setApkFiles((prev) => ({ ...prev, [arch]: file }));
    if (errors[arch]) {
      setErrors((prev) => ({ ...prev, [arch]: "" }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.version.trim()) {
      newErrors.version = "Version is required";
    } else if (!/^\d+\.\d+\.\d+$/.test(formData.version.trim())) {
      newErrors.version = "Version must be in format X.Y.Z (e.g., 3.0.0)";
    }

    if (!formData.buildNumber.trim()) {
      newErrors.buildNumber = "Build number is required";
    } else if (!/^\d+$/.test(formData.buildNumber.trim())) {
      newErrors.buildNumber = "Build number must be a number";
    }

    if (!apkFiles.arm32 && !apkFiles.arm64 && !apkFiles.x64) {
      newErrors.files = "At least one APK file is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpload = async () => {
    try {
      console.log("=== handleUpload called ===");

      if (!validateForm()) {
        console.log("Validation failed");
        return;
      }

      setIsUploading(true);
      resetUploadProgress();

      const uploadFormData = new FormData();

      // Add APK files
      if (apkFiles.arm32) {
        uploadFormData.append("apk", apkFiles.arm32);
      }
      if (apkFiles.arm64) {
        uploadFormData.append("apk", apkFiles.arm64);
      }
      if (apkFiles.x64) {
        uploadFormData.append("apk", apkFiles.x64);
      }

      // Add form fields
      uploadFormData.append("version", formData.version.trim());
      uploadFormData.append("buildNumber", formData.buildNumber.trim());
      uploadFormData.append("releaseNotes", formData.releaseNotes.trim() || "Bug fixes and improvements");
      uploadFormData.append("forceUpdate", String(formData.forceUpdate));
      uploadFormData.append("canRollback", String(formData.canRollback));
      uploadFormData.append("minimumVersion", formData.version.trim());

      console.log("Calling uploadVersion from store...");
      const result = await uploadVersion(uploadFormData);
      console.log("Upload result:", result);

      setIsUploading(false);

      if (result.success) {
        toast.success("APK uploaded successfully!");
        setUploadModalOpen(false);
        resetForm();
        fetchVersions();
      } else {
        toast.error(result.message || "Failed to upload APK");
      }
    } catch (error) {
      console.error("handleUpload error:", error);
      setIsUploading(false);
      toast.error(`Upload error: ${error.message}`);
    }
  };

  const resetForm = () => {
    setApkFiles({ arm32: null, arm64: null, x64: null });
    setFormData({
      version: "",
      buildNumber: "",
      releaseNotes: "",
      forceUpdate: false,
      canRollback: true,
    });
    setErrors({});
    resetUploadProgress();
  };

  const handleDeleteClick = (version) => {
    setVersionToDelete(version);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!versionToDelete) return;

    const result = await deleteVersion(versionToDelete._id);
    if (result.success) {
      toast.success("Version deleted successfully");
      fetchVersions();
    } else {
      toast.error(result.message || "Failed to delete version");
    }
    setVersionToDelete(null);
  };

  const handleNotifyClick = (version) => {
    setVersionToNotify(version);
    setNotifyDialogOpen(true);
  };

  const handleNotifyConfirm = async () => {
    if (!versionToNotify) return;

    const result = await sendNotification(versionToNotify._id);
    if (result.success) {
      const count = result.data?.successCount || 0;
      toast.success(`Notification sent to ${count} users`);
    } else {
      toast.error(result.message || "Failed to send notification");
    }
    setVersionToNotify(null);
    setNotifyDialogOpen(false);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getArchLabel = (arch) => {
    const labels = {
      "armeabi-v7a": "ARMv7 (32-bit)",
      "arm64-v8a": "ARM64 (64-bit)",
      "x86_64": "x86_64",
    };
    return labels[arch] || arch;
  };

  return (
    <AdminLayout>
      <PageHeader
        subtitle="Manage app releases and APK uploads"
        actions={
          <Button
            icon={<MdUpload size={20} />}
            onClick={() => setUploadModalOpen(true)}
          >
            Upload New Version
          </Button>
        }
      />

      <div className={styles.tableCard}>
        {isLoading && versions.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Loading versions...</p>
          </div>
        ) : versions.length === 0 ? (
          <div className={styles.emptyState}>
            <MdAndroid className={styles.emptyStateIcon} />
            <h3 className={styles.emptyStateTitle}>No App Versions</h3>
            <p className={styles.emptyStateDescription}>
              Upload your first APK to get started
            </p>
            <Button
              icon={<MdUpload size={20} />}
              onClick={() => setUploadModalOpen(true)}
              style={{ marginTop: "16px" }}
            >
              Upload APK
            </Button>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Version</th>
                  <th>Build</th>
                  <th>Release Notes</th>
                  <th>APK Variants</th>
                  <th>Force Update</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {versions.map((version, index) => (
                  <tr key={version._id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <strong>{version.version}</strong>
                        {index === 0 && (
                          <Badge variant="success">Latest</Badge>
                        )}
                      </div>
                    </td>
                    <td>{version.buildNumber}</td>
                    <td className={styles.truncate}>
                      {version.releaseNotes || "—"}
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {version.variants?.map((variant) => (
                          <a
                            key={variant.architecture}
                            href={variant.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: "12px",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              textDecoration: "none",
                              color: "inherit",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              background: "var(--light-background-color)",
                              transition: "background 0.2s"
                            }}
                            title="Click to download"
                          >
                            <MdSmartphone size={14} />
                            <span>{getArchLabel(variant.architecture)}</span>
                            <span style={{ color: "#999" }}>
                              ({formatFileSize(variant.fileSize)})
                            </span>
                            <MdDownload size={14} style={{ marginLeft: "auto", color: "var(--secondary-color)" }} />
                          </a>
                        ))}
                        {(!version.variants || version.variants.length === 0) && (
                          <span style={{ color: "#999" }}>No variants</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <Badge variant={version.forceUpdate ? "warning" : "info"}>
                        {version.forceUpdate ? "Yes" : "No"}
                      </Badge>
                    </td>
                    <td>{formatDate(version.createdAt)}</td>
                    <td>
                      <div className={styles.actionButtons}>
                        <Button
                          variant="icon"
                          icon={<MdNotifications size={18} />}
                          onClick={() => handleNotifyClick(version)}
                          title="Send notification"
                        />
                        <Button
                          variant="icon"
                          icon={<MdDelete size={18} />}
                          onClick={() => handleDeleteClick(version)}
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

      {/* Upload Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => {
          if (!isUploading) {
            setUploadModalOpen(false);
            resetForm();
          }
        }}
        title="Upload New App Version"
        size="large"
      >
        <div className={uploadStyles.uploadForm}>
          <div className={uploadStyles.formRow}>
            <FormGroup label="Version" required error={errors.version}>
              <FormInput
                name="version"
                value={formData.version}
                onChange={handleInputChange}
                placeholder="3.0.0"
                error={!!errors.version}
                disabled={isUploading}
              />
            </FormGroup>

            <FormGroup label="Build Number" required error={errors.buildNumber}>
              <FormInput
                name="buildNumber"
                value={formData.buildNumber}
                onChange={handleInputChange}
                placeholder="7"
                error={!!errors.buildNumber}
                disabled={isUploading}
              />
            </FormGroup>
          </div>

          <FormGroup label="Release Notes">
            <FormTextarea
              name="releaseNotes"
              value={formData.releaseNotes}
              onChange={handleInputChange}
              placeholder="Bug fixes and improvements"
              rows={3}
              disabled={isUploading}
            />
          </FormGroup>

          <div className={uploadStyles.checkboxRow}>
            <label className={uploadStyles.checkbox}>
              <input
                type="checkbox"
                name="forceUpdate"
                checked={formData.forceUpdate}
                onChange={handleInputChange}
                disabled={isUploading}
              />
              <span>Force Update</span>
              <small>Users must update to continue using the app</small>
            </label>

            <label className={uploadStyles.checkbox}>
              <input
                type="checkbox"
                name="canRollback"
                checked={formData.canRollback}
                onChange={handleInputChange}
                disabled={isUploading}
              />
              <span>Allow Rollback</span>
              <small>Users can downgrade from this version</small>
            </label>
          </div>

          {errors.files && (
            <div className={uploadStyles.errorMessage}>
              <MdError size={16} />
              {errors.files}
            </div>
          )}

          <div className={uploadStyles.apkSection}>
            <h4>
              <MdAndroid size={20} />
              APK Files
            </h4>
            <p className={uploadStyles.hint}>
              Upload architecture-specific APKs. At least one is required.
            </p>

            <div className={uploadStyles.apkGrid}>
              {/* ARM32 */}
              <div
                className={`${uploadStyles.apkDropzone} ${apkFiles.arm32 ? uploadStyles.hasFile : ""}`}
                onClick={() => !isUploading && arm32InputRef.current?.click()}
              >
                <input
                  ref={arm32InputRef}
                  type="file"
                  accept=".apk"
                  onChange={(e) => handleFileChange("arm32", e.target.files[0])}
                  style={{ display: "none" }}
                  disabled={isUploading}
                />
                {apkFiles.arm32 ? (
                  <div className={uploadStyles.fileInfo}>
                    <MdCheckCircle size={24} className={uploadStyles.successIcon} />
                    <span className={uploadStyles.fileName}>{apkFiles.arm32.name}</span>
                    <span className={uploadStyles.fileSize}>
                      {formatFileSize(apkFiles.arm32.size)}
                    </span>
                    <button
                      type="button"
                      className={uploadStyles.removeBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        setApkFiles((prev) => ({ ...prev, arm32: null }));
                      }}
                      disabled={isUploading}
                    >
                      <MdClose size={18} />
                    </button>
                  </div>
                ) : (
                  <div className={uploadStyles.dropzoneContent}>
                    <MdCloudUpload size={32} />
                    <span>ARMv7 (32-bit)</span>
                    <small>app-armeabi-v7a-release.apk</small>
                  </div>
                )}
              </div>

              {/* ARM64 */}
              <div
                className={`${uploadStyles.apkDropzone} ${apkFiles.arm64 ? uploadStyles.hasFile : ""}`}
                onClick={() => !isUploading && arm64InputRef.current?.click()}
              >
                <input
                  ref={arm64InputRef}
                  type="file"
                  accept=".apk"
                  onChange={(e) => handleFileChange("arm64", e.target.files[0])}
                  style={{ display: "none" }}
                  disabled={isUploading}
                />
                {apkFiles.arm64 ? (
                  <div className={uploadStyles.fileInfo}>
                    <MdCheckCircle size={24} className={uploadStyles.successIcon} />
                    <span className={uploadStyles.fileName}>{apkFiles.arm64.name}</span>
                    <span className={uploadStyles.fileSize}>
                      {formatFileSize(apkFiles.arm64.size)}
                    </span>
                    <button
                      type="button"
                      className={uploadStyles.removeBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        setApkFiles((prev) => ({ ...prev, arm64: null }));
                      }}
                      disabled={isUploading}
                    >
                      <MdClose size={18} />
                    </button>
                  </div>
                ) : (
                  <div className={uploadStyles.dropzoneContent}>
                    <MdCloudUpload size={32} />
                    <span>ARM64 (64-bit)</span>
                    <small>app-arm64-v8a-release.apk</small>
                  </div>
                )}
              </div>

              {/* x86_64 */}
              <div
                className={`${uploadStyles.apkDropzone} ${apkFiles.x64 ? uploadStyles.hasFile : ""}`}
                onClick={() => !isUploading && x64InputRef.current?.click()}
              >
                <input
                  ref={x64InputRef}
                  type="file"
                  accept=".apk"
                  onChange={(e) => handleFileChange("x64", e.target.files[0])}
                  style={{ display: "none" }}
                  disabled={isUploading}
                />
                {apkFiles.x64 ? (
                  <div className={uploadStyles.fileInfo}>
                    <MdCheckCircle size={24} className={uploadStyles.successIcon} />
                    <span className={uploadStyles.fileName}>{apkFiles.x64.name}</span>
                    <span className={uploadStyles.fileSize}>
                      {formatFileSize(apkFiles.x64.size)}
                    </span>
                    <button
                      type="button"
                      className={uploadStyles.removeBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        setApkFiles((prev) => ({ ...prev, x64: null }));
                      }}
                      disabled={isUploading}
                    >
                      <MdClose size={18} />
                    </button>
                  </div>
                ) : (
                  <div className={uploadStyles.dropzoneContent}>
                    <MdCloudUpload size={32} />
                    <span>x86_64</span>
                    <small>app-x86_64-release.apk</small>
                  </div>
                )}
              </div>
            </div>
          </div>

          {isUploading && (
            <div className={uploadStyles.progressSection}>
              <div className={uploadStyles.progressBar}>
                <div
                  className={uploadStyles.progressFill}
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className={uploadStyles.progressText}>
                Uploading... {uploadProgress}%
              </span>
            </div>
          )}

          <div className={uploadStyles.modalActions}>
            <Button
              variant="secondary"
              onClick={() => {
                setUploadModalOpen(false);
                resetForm();
              }}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              icon={<MdUpload size={20} />}
              onClick={handleUpload}
              loading={isUploading}
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Upload Version"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setVersionToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Version"
        message={`Are you sure you want to delete version ${versionToDelete?.version}? This will remove all APK files and cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />

      {/* Notify Confirmation */}
      <ConfirmDialog
        isOpen={notifyDialogOpen}
        onClose={() => {
          setNotifyDialogOpen(false);
          setVersionToNotify(null);
        }}
        onConfirm={handleNotifyConfirm}
        title="Send Update Notification"
        message={`Send push notification to all users about version ${versionToNotify?.version}?`}
        confirmText="Send Notification"
        variant="primary"
      />
    </AdminLayout>
  );
}
