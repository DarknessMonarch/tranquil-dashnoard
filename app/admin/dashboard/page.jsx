"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLandlordStore } from "@/app/store/LandlordStore";
import { useAuthStore } from "@/app/store/AuthStore";
import AdminLayout from "@/app/components/AdminLayout";
import PageHeader from "@/app/components/PageHeader";
import MetricCard from "@/app/components/MetricCard";
import Button from "@/app/components/Button";
import { formatCurrency } from "@/app/lib/formatters";
import styles from "@/app/styles/adminDashboard.module.css";

import {
  MdAttachMoney,
  MdApartment,
  MdCheckCircle,
  MdWarning,
} from "react-icons/md";

export default function AdminDashboard() {
  const router = useRouter();
  const { isAuth, isLandlord, isAdmin } = useAuthStore();
  const {
    properties,
    analytics,
    fetchAnalytics,
    fetchProperties,
  } = useLandlordStore();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuth || (!isLandlord && !isAdmin)) {
      router.push("/admin/login");
      return;
    }

    loadDashboardData();
  }, [isAuth, isLandlord, isAdmin]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchAnalytics(),
        fetchProperties(),
      ]);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const metrics = [
    {
      label: "Total Properties",
      value: properties?.length || 0,
      icon: MdApartment,
      color: "primary",
    },
    {
      label: "Total Revenue",
      value: formatCurrency(analytics?.currentMonth?.totalRevenue || 0),
      icon: MdAttachMoney,
      color: "success",
    },
    {
      label: "Collected",
      value: formatCurrency(analytics?.currentMonth?.collectedRevenue || 0),
      icon: MdCheckCircle,
      color: "secondary",
    },
    {
      label: "Arrears",
      value: formatCurrency(analytics?.currentMonth?.arrears || 0),
      icon: MdWarning,
      color: "warning",
    },
  ];

  return (
    <AdminLayout>
      <PageHeader subtitle="Welcome back! Here's an overview of your properties" />

      <div className={styles.dashboardGrid}>
        {/* Metrics */}
        <div className={styles.metricsGrid}>
          {metrics.map((metric, idx) => (
            <MetricCard
              key={idx}
              icon={metric.icon}
              label={metric.label}
              value={metric.value}
              color={metric.color}
              onClick={() => {
                if (metric.label === "Total Properties") {
                  router.push("/admin/properties");
                }
              }}
            />
          ))}
        </div>

        {/* Charts */}
        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3 className={styles.chartTitle}>Revenue Trend</h3>
              <select className={styles.chartFilter}>
                <option>Last 6 Months</option>
                <option>Last Year</option>
                <option>All Time</option>
              </select>
            </div>
            <div className={styles.chartContent}>
              <p style={{ color: "var(--warm-gray)" }}>
                Chart visualization will be displayed here
              </p>
            </div>
          </div>

          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3 className={styles.chartTitle}>Occupancy Overview</h3>
              <select className={styles.chartFilter}>
                <option>Current Month</option>
                <option>Last Month</option>
                <option>Last Quarter</option>
              </select>
            </div>
            <div className={styles.chartContent}>
              <p style={{ color: "var(--warm-gray)" }}>
                Chart visualization will be displayed here
              </p>
            </div>
          </div>
        </div>

        {/* Properties Overview */}
        <div className={styles.recentActivity}>
          <div className={styles.activityHeader}>
            <h3 className={styles.activityTitle}>Properties Overview</h3>
            <Button
              variant="primary"
              onClick={() => router.push("/admin/properties")}
            >
              View All
            </Button>
          </div>
          <div className={styles.activityList}>
            {properties?.slice(0, 5).map((property) => (
              <div
                key={property._id}
                className={styles.activityItem}
                onClick={() => router.push(`/admin/properties/${property._id}`)}
              >
                <div className={styles.activityIcon}>
                  <MdApartment />
                </div>
                <div className={styles.activityDetails}>
                  <p className={styles.activityName}>{property.name}</p>
                  <p className={styles.activityDescription}>
                    {property.address?.street}, {property.address?.city}
                  </p>
                </div>
                <div className={styles.activityValue}>
                  {property.totalUnits || 0} units
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
