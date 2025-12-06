"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/app/store/AuthStore";
import { useAdminStore } from "@/app/store/AdminStore";
import styles from "@/app/styles/adminAnalytics.module.css";
import LoadingLogo from "@/app/components/LoadingLogo";

const SERVER_API = process.env.NEXT_PUBLIC_SERVER_API;

export default function AdminAnalytics() {
  const { getDashboardStats } = useAdminStore();
  const { isAdmin, getAuthHeader } = useAuthStore();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");
  const [templates, setTemplates] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);

  useEffect(() => {
    if (isAdmin) {
      fetchAnalytics();
    }
  }, [isAdmin, timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    const result = await getDashboardStats();
    if (result.success) {
      setStats(result.data);
      await fetchTemplatesAndSubscriptions();
    }
    setLoading(false);
  };

  const fetchTemplatesAndSubscriptions = async () => {
    try {
      const [templatesRes, subscriptionsRes] = await Promise.all([
        fetch(`${SERVER_API}/templates-admin/all`, {
          headers: getAuthHeader()
        }),
        fetch(`${SERVER_API}/subscriptions/subscriptions-admin/all`, {
          headers: getAuthHeader()
        })
      ]);

      const [templatesData, subscriptionsData] = await Promise.all([
        templatesRes.json(),
        subscriptionsRes.json()
      ]);

      if (templatesData.status === 'success') {
        setTemplates(templatesData.data.templates || []);
      }
      if (subscriptionsData.status === 'success') {
        setSubscriptions(subscriptionsData.data.subscriptions || []);
      }
    } catch (error) {
      console.error('Fetch templates/subscriptions error:', error);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingLogo />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={styles.container}>
        <p>Failed to load analytics data</p>
      </div>
    );
  }

  const growthMetrics = [
    {
      title: "Total Users",
      value: stats.totalUsers || 0,
      subtitle: `${stats.verifiedUsers || 0} verified`,
      color: "#ec4899"
    },
    {
      title: "Active Subscriptions",
      value: stats.activeSubscriptions || 0,
      subtitle: `${stats.totalSubscriptions || 0} total`,
      color: "#a855f7"
    },
    {
      title: "Total Templates",
      value: stats.totalTemplates || 0,
      subtitle: `${stats.activeTemplates || 0} active`,
      color: "#fbbf24"
    },
    {
      title: "Support Messages",
      value: stats.totalMessages || 0,
      subtitle: `${stats.openMessages || 0} open`,
      color: "#10b981"
    }
  ];

  const topTemplates = templates
    .sort((a, b) => (b.reads || 0) - (a.reads || 0))
    .slice(0, 5)
    .map(t => ({
      name: t.title,
      views: t.reads || 0,
      bookmarks: t.bookmarks || 0
    }));

  const tierBreakdown = stats.tierBreakdown || { starter: 0, pro: 0, elite: 0 };
  const userActivity = [
    { day: "Starter", users: tierBreakdown.starter },
    { day: "Pro", users: tierBreakdown.pro },
    { day: "Elite", users: tierBreakdown.elite }
  ];

  // Calculate revenue by tier
  const proSubscriptions = subscriptions.filter(s => s.tier === 'pro' && s.status === 'active');
  const eliteSubscriptions = subscriptions.filter(s => s.tier === 'elite' && s.status === 'active');
  const proRevenue = proSubscriptions.reduce((sum, s) => sum + (s.amount || 0), 0);
  const eliteRevenue = eliteSubscriptions.reduce((sum, s) => sum + (s.amount || 0), 0);
  const totalRevenue = stats.totalRevenue || 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Analytics & Insights</h1>

        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className={styles.timeRangeSelect}
        >
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
        </select>
      </div>

      {/* Growth Metrics */}
      <div className={styles.statsGrid}>
        {growthMetrics.map((metric, index) => (
          <div key={index} className={styles.statCard}>
            <h3 className={styles.statCardTitle}>{metric.title}</h3>
            <p className={styles.statCardValue} style={{ color: metric.color }}>
              {metric.value}
            </p>
            <span className={styles.statCardSubtitle}>{metric.subtitle}</span>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className={styles.chartsGrid}>
        {/* User Activity Chart */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Users by Tier</h3>

          <div className={styles.chartContainer}>
            {userActivity.map((item, index) => (
              <div key={index} className={styles.barWrapper}>
                <div
                  className={styles.bar}
                  style={{ height: `${Math.min((item.users / Math.max(...userActivity.map(u => u.users), 1)) * 100, 100)}%` }}
                />
                <span className={styles.barLabel}>{item.day}</span>
                <span className={styles.barValue}>{item.users}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Templates */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Top Performing Templates</h3>

          <div className={styles.templateList}>
            {topTemplates.map((template, index) => (
              <div key={index} className={styles.templateItem}>
                <div>
                  <p className={styles.templateName}>
                    {index + 1}. {template.name}
                  </p>
                  <div className={styles.templateStats}>
                    <span>👁️ {template.views} views</span>
                    <span>🔖 {template.bookmarks} bookmarks</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className={styles.revenueCard}>
        <h3 className={styles.chartTitle}>Revenue by Tier</h3>

        <div className={styles.revenueGrid}>
          <div className={`${styles.revenueTier} ${styles.pro}`}>
            <h4 className={styles.revenueTierTitle}>Pro Tier Revenue</h4>
            <p className={`${styles.revenueTierValue} ${styles.proValue}`}>
              KSh {proRevenue.toLocaleString()}
            </p>
            <span className={styles.revenueTierSubtitle}>{proSubscriptions.length} subscriptions</span>
          </div>

          <div className={`${styles.revenueTier} ${styles.elite}`}>
            <h4 className={styles.revenueTierTitle}>Elite Tier Revenue</h4>
            <p className={`${styles.revenueTierValue} ${styles.eliteValue}`}>
              KSh {eliteRevenue.toLocaleString()}
            </p>
            <span className={styles.revenueTierSubtitle}>{eliteSubscriptions.length} subscriptions</span>
          </div>

          <div className={`${styles.revenueTier} ${styles.total}`}>
            <h4 className={styles.revenueTierTitle}>Total Revenue</h4>
            <p className={`${styles.revenueTierValue} ${styles.totalValue}`}>
              KSh {totalRevenue.toLocaleString()}
            </p>
            <span className={styles.revenueTierSubtitle}>{stats.activeSubscriptions} total subscriptions</span>
          </div>
        </div>
      </div>
    </div>
  );
}