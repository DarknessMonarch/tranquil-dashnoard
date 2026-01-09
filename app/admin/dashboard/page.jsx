"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLandlordStore } from "@/app/store/LandlordStore";
import { useAuthStore } from "@/app/store/AuthStore";
import AdminLayout from "@/app/components/AdminLayout";
import PageHeader from "@/app/components/PageHeader";
import MetricCard from "@/app/components/MetricCard";
import Button from "@/app/components/Button";
import RevenueChart from "@/app/components/charts/RevenueChart";
import OccupancyChart from "@/app/components/charts/OccupancyChart";
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
  const { isAuth, isManager, isAdmin } = useAuthStore();
  const {
    properties,
    analytics,
    fetchAnalytics,
    fetchProperties,
  } = useLandlordStore();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuth || (!isManager && !isAdmin)) {
      router.push("/admin/login");
      return;
    }

    loadDashboardData();
  }, [isAuth, isManager, isAdmin]);

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
              </select>
            </div>
            <div className={styles.chartContent}>
              {isLoading ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '300px',
                  color: 'var(--warm-gray)'
                }}>
                  Loading chart...
                </div>
              ) : (
                <RevenueChart data={analytics?.revenueChart || []} />
              )}
            </div>
          </div>

          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3 className={styles.chartTitle}>Occupancy Overview</h3>
            </div>
            <div className={styles.chartContent}>
              {isLoading ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '300px',
                  color: 'var(--warm-gray)'
                }}>
                  Loading chart...
                </div>
              ) : (
                <OccupancyChart
                  occupiedUnits={analytics?.occupiedUnits || 0}
                  vacantUnits={analytics?.vacantUnits || 0}
                />
              )}
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
