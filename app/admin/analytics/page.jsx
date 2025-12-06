"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLandlordStore } from "@/app/store/LandlordStore";
import { useAuthStore } from "@/app/store/AuthStore";
import AdminLayout from "@/app/components/AdminLayout";
import styles from "@/app/styles/adminDashboard.module.css";

import { MdBarChart } from "react-icons/md";

export default function AnalyticsPage() {
  const router = useRouter();
  const { isAuth, isLandlord, isAdmin } = useAuthStore();
  const { selectedProperty } = useLandlordStore();

  useEffect(() => {
    if (!isAuth || (!isLandlord && !isAdmin)) {
      router.push("/admin/login");
      return;
    }
  }, [isAuth, isLandlord, isAdmin]);

  if (!selectedProperty) {
    return (
      <AdminLayout>
        <div className={styles.emptyState}>
          <MdBarChart className={styles.emptyStateIcon} />
          <h3 className={styles.emptyStateTitle}>No Property Selected</h3>
          <p className={styles.emptyStateDescription}>
            Please select a property to view analytics.
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        <h2 style={{ marginBottom: "var(--spacing-lg)", color: "var(--dark-color)" }}>
          Analytics & Reports
        </h2>
        <p style={{ color: "var(--warm-gray)", marginBottom: "var(--spacing-xl)" }}>
          {selectedProperty.name}
        </p>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Revenue Analysis</h3>
            <select className={styles.chartFilter}>
              <option>Last 12 Months</option>
              <option>Last 6 Months</option>
              <option>This Year</option>
            </select>
          </div>
          <div className={styles.chartContent}>
            <p style={{ color: "var(--warm-gray)" }}>
              Revenue chart visualization will be displayed here
            </p>
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Occupancy Rate</h3>
            <select className={styles.chartFilter}>
              <option>Last 12 Months</option>
              <option>Last 6 Months</option>
              <option>This Year</option>
            </select>
          </div>
          <div className={styles.chartContent}>
            <p style={{ color: "var(--warm-gray)" }}>
              Occupancy chart visualization will be displayed here
            </p>
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Payment Collection Rate</h3>
            <select className={styles.chartFilter}>
              <option>Last 12 Months</option>
              <option>Last 6 Months</option>
              <option>This Year</option>
            </select>
          </div>
          <div className={styles.chartContent}>
            <p style={{ color: "var(--warm-gray)" }}>
              Payment collection chart will be displayed here
            </p>
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Maintenance Requests</h3>
            <select className={styles.chartFilter}>
              <option>Last 12 Months</option>
              <option>Last 6 Months</option>
              <option>This Year</option>
            </select>
          </div>
          <div className={styles.chartContent}>
            <p style={{ color: "var(--warm-gray)" }}>
              Maintenance requests chart will be displayed here
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
