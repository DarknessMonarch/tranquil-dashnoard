"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLandlordStore } from "@/app/store/LandlordStore";
import { useAuthStore } from "@/app/store/AuthStore";
import AdminLayout from "@/app/components/AdminLayout";
import styles from "@/app/styles/adminTable.module.css";

import { MdSearch, MdBuild } from "react-icons/md";

export default function MaintenancePage() {
  const router = useRouter();
  const { isAuth, isLandlord, isAdmin } = useAuthStore();
  const {
    selectedProperty,
    maintenanceRequests,
    fetchMaintenanceRequests,
    updateMaintenanceStatus,
  } = useLandlordStore();

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!isAuth || (!isLandlord && !isAdmin)) {
      router.push("/admin/login");
      return;
    }

    if (selectedProperty) {
      fetchMaintenanceRequests(selectedProperty._id);
    }
  }, [selectedProperty, isAuth, isLandlord, isAdmin]);

  const handleStatusChange = async (requestId, newStatus) => {
    const result = await updateMaintenanceStatus(requestId, newStatus);
    if (result.success) {
      toast.success("Status updated successfully");
    } else {
      toast.error(result.message || "Failed to update status");
    }
  };

  const filteredRequests = (maintenanceRequests || []).filter(
    (request) =>
      request.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.unitNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { style: "warning", label: "Pending" },
      "in-progress": { style: "info", label: "In Progress" },
      completed: { style: "success", label: "Completed" },
      rejected: { style: "error", label: "Rejected" },
    };
    const statusInfo = statusMap[status] || statusMap.pending;
    return (
      <span className={`${styles.badge} ${styles[statusInfo.style]}`}>
        {statusInfo.label}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityMap = {
      low: { style: "info", label: "Low" },
      medium: { style: "warning", label: "Medium" },
      high: { style: "error", label: "High" },
    };
    const priorityInfo = priorityMap[priority] || priorityMap.medium;
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
          <MdBuild className={styles.emptyStateIcon} />
          <h3 className={styles.emptyStateTitle}>No Property Selected</h3>
          <p className={styles.emptyStateDescription}>
            Please select a property to view maintenance requests.
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Maintenance Requests</h2>
          <p style={{ color: "var(--warm-gray)", fontSize: "var(--font-size-sm)" }}>
            {selectedProperty.name}
          </p>
        </div>
        <div className={styles.pageActions}>
          <div className={styles.searchBar}>
            <MdSearch size={20} color="var(--warm-gray)" />
            <input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className={styles.tableCard}>
        {filteredRequests.length === 0 ? (
          <div className={styles.emptyState}>
            <MdBuild className={styles.emptyStateIcon} />
            <h3 className={styles.emptyStateTitle}>No Maintenance Requests</h3>
            <p className={styles.emptyStateDescription}>
              {searchTerm
                ? "No requests match your search criteria"
                : "No maintenance requests for this property"}
            </p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Unit</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Date Submitted</th>
                  <th>Update Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr key={request._id}>
                    <td>
                      <strong>{request.title || "N/A"}</strong>
                      <br />
                      <span style={{ fontSize: "var(--font-size-xs)", color: "var(--warm-gray)" }}>
                        {request.description?.substring(0, 60)}
                        {request.description?.length > 60 ? "..." : ""}
                      </span>
                    </td>
                    <td>{request.unitNumber || "N/A"}</td>
                    <td>{getPriorityBadge(request.priority || "medium")}</td>
                    <td>{getStatusBadge(request.status)}</td>
                    <td>
                      {request.createdAt
                        ? new Date(request.createdAt).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td>
                      <select
                        className={styles.formSelect}
                        value={request.status}
                        onChange={(e) =>
                          handleStatusChange(request._id, e.target.value)
                        }
                        style={{ fontSize: "var(--font-size-xs)", padding: "6px 10px" }}
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="rejected">Rejected</option>
                      </select>
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
