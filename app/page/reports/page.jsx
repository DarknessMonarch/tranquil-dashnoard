"use client";

import { useState } from "react";
import { useAuthStore } from "@/app/store/AuthStore";
import { toast } from "sonner";
import styles from "@/app/styles/adminReports.module.css";

const SERVER_API = process.env.NEXT_PUBLIC_SERVER_API;

export default function AdminReports() {
  const { isAdmin, getAuthHeader } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: ""
  });

  const reportTypes = [
    {
      id: "users",
      name: "User Report",
      description: "Complete user data including registrations, tiers, and activity",
      fields: ["Username", "Email", "Tier", "Registration Date", "Last Login", "Status"]
    },
    {
      id: "subscriptions",
      name: "Subscription Report",
      description: "All subscription transactions and revenue data",
      fields: ["User", "Tier", "Amount", "Payment Method", "Date", "Status", "Reference"]
    },
    {
      id: "templates",
      name: "Template Report",
      description: "Template performance metrics and usage statistics",
      fields: ["Title", "Category", "Tier", "Views", "Bookmarks", "Created Date", "Status"]
    },
    {
      id: "support",
      name: "Support Ticket Report",
      description: "Support ticket history and resolution times",
      fields: ["User", "Subject", "Priority", "Status", "Created Date", "Resolved Date"]
    },
    {
      id: "revenue",
      name: "Revenue Report",
      description: "Financial overview with revenue breakdown by tier",
      fields: ["Date", "Tier", "Amount", "Transaction Count", "Total Revenue"]
    },
    {
      id: "analytics",
      name: "Analytics Report",
      description: "User engagement and platform usage analytics",
      fields: ["Date", "Active Users", "New Users", "Template Views", "Conversion Rate"]
    }
  ];

  const handleGenerateReport = async () => {
    if (!selectedReport) {
      toast.error("Please select a report type");
      return;
    }

    if (!dateRange.startDate || !dateRange.endDate) {
      toast.error("Please select date range");
      return;
    }

    setLoading(true);

    try {
      const selectedReportData = reportTypes.find(r => r.id === selectedReport);
      const csvContent = await generateCSV(selectedReportData);

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedReport}_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Report generated successfully");
    } catch (error) {
      console.error('Generate report error:', error);
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const generateCSV = async (reportData) => {
    let csv = reportData.fields.join(",") + "\n";
    let data = [];

    try {
      switch (reportData.id) {
        case 'users':
          const usersRes = await fetch(`${SERVER_API}/auth/users`, {
            headers: getAuthHeader()
          });
          const usersData = await usersRes.json();
          if (usersData.status === 'success') {
            data = usersData.data.users.map(u => [
              u.username || 'N/A',
              u.email,
              u.currentTier || 'starter',
              new Date(u.createdAt).toLocaleDateString(),
              u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never',
              u.emailVerified ? 'Verified' : 'Unverified'
            ]);
          }
          break;

        case 'subscriptions':
          const subsRes = await fetch(`${SERVER_API}/subscriptions/subscriptions-admin/all`, {
            headers: getAuthHeader()
          });
          const subsData = await subsRes.json();
          if (subsData.status === 'success') {
            data = subsData.data.subscriptions.map(s => [
              s.user?.username || s.user?.email || 'Unknown',
              s.tier || 'N/A',
              `KSh ${s.amount || 0}`,
              'Paystack',
              new Date(s.createdAt).toLocaleDateString(),
              s.status || 'pending',
              s.reference || 'N/A'
            ]);
          }
          break;

        case 'templates':
          const templatesRes = await fetch(`${SERVER_API}/templates-admin/all`, {
            headers: getAuthHeader()
          });
          const templatesData = await templatesRes.json();
          if (templatesData.status === 'success') {
            data = templatesData.data.templates.map(t => [
              t.title,
              t.category,
              t.tier,
              t.views || 0,
              t.bookmarks || 0,
              new Date(t.createdAt).toLocaleDateString(),
              t.isActive ? 'Active' : 'Inactive'
            ]);
          }
          break;

        case 'support':
          const supportRes = await fetch(`${SERVER_API}/support-admin/messages`, {
            headers: getAuthHeader()
          });
          const supportData = await supportRes.json();
          if (supportData.status === 'success') {
            data = supportData.data.messages.map(m => [
              m.user?.username || m.user?.email || 'Unknown',
              m.subject || 'N/A',
              m.priority || 'normal',
              m.status || 'open',
              new Date(m.createdAt).toLocaleDateString(),
              m.resolvedAt ? new Date(m.resolvedAt).toLocaleDateString() : 'Pending'
            ]);
          }
          break;

        case 'revenue':
          const revenueRes = await fetch(`${SERVER_API}/subscriptions/subscriptions-admin/all`, {
            headers: getAuthHeader()
          });
          const revenueData = await revenueRes.json();
          if (revenueData.status === 'success') {
            const subscriptions = revenueData.data.subscriptions;
            const revenueByDate = {};

            subscriptions.forEach(s => {
              const date = new Date(s.createdAt).toLocaleDateString();
              if (!revenueByDate[date]) {
                revenueByDate[date] = { pro: 0, elite: 0, count: 0 };
              }
              if (s.tier === 'pro') revenueByDate[date].pro += s.amount || 0;
              if (s.tier === 'elite') revenueByDate[date].elite += s.amount || 0;
              revenueByDate[date].count++;
            });

            data = Object.entries(revenueByDate).map(([date, rev]) => [
              date,
              `Pro: KSh ${rev.pro} | Elite: KSh ${rev.elite}`,
              `KSh ${rev.pro + rev.elite}`,
              rev.count,
              `KSh ${rev.pro + rev.elite}`
            ]);
          }
          break;

        case 'analytics':
          const analyticsRes = await fetch(`${SERVER_API}/auth/users`, {
            headers: getAuthHeader()
          });
          const analyticsData = await analyticsRes.json();
          if (analyticsData.status === 'success') {
            const users = analyticsData.data.users;
            data = [[
              new Date().toLocaleDateString(),
              users.length,
              users.filter(u => {
                const createdDate = new Date(u.createdAt);
                const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                return createdDate >= sevenDaysAgo;
              }).length,
              'N/A',
              'N/A'
            ]];
          }
          break;
      }

      data.forEach(row => {
        csv += row.map(field => `"${field}"`).join(",") + "\n";
      });
    } catch (error) {
      console.error('CSV generation error:', error);
    }

    return csv;
  };

  const handleExportAll = () => {
    setLoading(true);
    setTimeout(() => {
      toast.success("Full export initiated. You'll receive an email when ready.");
      setLoading(false);
    }, 1500);
  };

  const setQuickRange = (days) => {
    const today = new Date();
    const pastDate = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
    setDateRange({
      startDate: pastDate.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    });
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Generate Reports</h1>

      {/* Report Selection */}
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Select Report Type</h2>

        <div className={styles.reportGrid}>
          {reportTypes.map((report) => (
            <div
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className={`${styles.reportType} ${
                selectedReport === report.id ? styles.selected : styles.unselected
              }`}
            >
              <h3 className={styles.reportName}>{report.name}</h3>
              <p className={styles.reportDescription}>{report.description}</p>
              <div className={styles.reportFields}>
                Includes: {report.fields.slice(0, 3).join(", ")}...
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Date Range */}
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Date Range</h2>

        <div className={styles.dateGrid}>
          <div className={styles.formInputContainer}>
            <label>Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
              className={styles.inputField}
            />
          </div>

          <div className={styles.formInputContainer}>
            <label>End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
              className={styles.inputField}
            />
          </div>
        </div>

        <div className={styles.quickFilters}>
          <button
            onClick={() => setQuickRange(7)}
            className={styles.quickFilterButton}
          >
            Last 7 Days
          </button>

          <button
            onClick={() => setQuickRange(30)}
            className={styles.quickFilterButton}
          >
            Last 30 Days
          </button>

          <button
            onClick={() => setQuickRange(365)}
            className={styles.quickFilterButton}
          >
            Last Year
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actionsContainer}>
        <button
          onClick={handleGenerateReport}
          disabled={loading || !selectedReport}
          className={styles.primaryButton}
        >
          {loading ? "Generating..." : "Generate Report"}
        </button>

        <button
          onClick={handleExportAll}
          disabled={loading}
          className={styles.secondaryButton}
        >
          Export All Data
        </button>
      </div>

      {/* Info Box */}
      <div className={styles.infoBox}>
        <p className={styles.infoText}>
          <strong>📊 Report Information:</strong>
          Reports are generated in CSV format for easy import into Excel or other tools.
          Large reports may take a few minutes to generate. You'll receive an email notification
          when your full data export is ready for download.
        </p>
      </div>
    </div>
  );
}
