import { create } from "zustand";
import { useAuthStore } from "./AuthStore";

const SERVER_API = process.env.NEXT_PUBLIC_SERVER_API;

export const useAdminStore = create((set, get) => ({
  // Admin State
  users: [],
  usersLoading: false,
  stats: null,
  statsLoading: false,

  // Get All Users
  getAllUsers: async () => {
    try {
      set({ usersLoading: true });
      const { getAuthHeader } = useAuthStore.getState();
      
      const response = await fetch(`${SERVER_API}/auth/users`, {
        headers: getAuthHeader(),
      });

      const data = await response.json();
      if (data.status === "success") {
        set({
          users: data.data.users,
          usersLoading: false,
        });
        return { success: true, data: data.data.users };
      }
      set({ usersLoading: false });
      return { success: false, message: data.message };
    } catch (error) {
      console.error("Get all users error:", error);
      set({ usersLoading: false });
      return { success: false, message: "Failed to fetch users" };
    }
  },

  // Delete User
  deleteUser: async (userId) => {
    try {
      const { getAuthHeader } = useAuthStore.getState();
      
      const response = await fetch(`${SERVER_API}/auth/users/${userId}`, {
        method: "DELETE",
        headers: getAuthHeader(),
      });

      const data = await response.json();
      if (data.status === "success") {
        get().getAllUsers(); // Refresh users list
        return { success: true, message: "User deleted successfully" };
      }
      return { success: false, message: data.message };
    } catch (error) {
      console.error("Delete user error:", error);
      return { success: false, message: "Failed to delete user" };
    }
  },

  // Bulk Delete Users
  bulkDeleteUsers: async (userIds) => {
    try {
      const { getAuthHeader } = useAuthStore.getState();
      
      const response = await fetch(`${SERVER_API}/auth/users/bulk-delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({ userIds }),
      });

      const data = await response.json();
      if (data.status === "success") {
        get().getAllUsers(); // Refresh users list
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message };
    } catch (error) {
      console.error("Bulk delete users error:", error);
      return { success: false, message: "Failed to delete users" };
    }
  },

  // Make Admin
  makeAdmin: async (userId) => {
    try {
      const { getAuthHeader } = useAuthStore.getState();
      
      const response = await fetch(`${SERVER_API}/auth/make-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      if (data.status === "success") {
        get().getAllUsers(); // Refresh users list
        return { success: true, message: "User promoted to admin" };
      }
      return { success: false, message: data.message };
    } catch (error) {
      console.error("Make admin error:", error);
      return { success: false, message: "Failed to make user admin" };
    }
  },

  // Remove Admin
  removeAdmin: async (userId) => {
    try {
      const { getAuthHeader } = useAuthStore.getState();

      const response = await fetch(`${SERVER_API}/auth/remove-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      if (data.status === "success") {
        get().getAllUsers(); // Refresh users list
        return { success: true, message: "Admin privileges removed" };
      }
      return { success: false, message: data.message };
    } catch (error) {
      console.error("Remove admin error:", error);
      return { success: false, message: "Failed to remove admin privileges" };
    }
  },

  // Get Pending Approvals
  getPendingApprovals: async () => {
    try {
      const { getAuthHeader } = useAuthStore.getState();

      const response = await fetch(`${SERVER_API}/admin/pending-approvals`, {
        headers: getAuthHeader(),
      });

      const data = await response.json();
      if (data.status === "success") {
        return { success: true, data: data.data };
      }
      return { success: false, message: data.message };
    } catch (error) {
      console.error("Get pending approvals error:", error);
      return { success: false, message: "Failed to fetch pending approvals" };
    }
  },

  // Approve User
  approveUser: async (userId) => {
    try {
      const { getAuthHeader } = useAuthStore.getState();

      const response = await fetch(`${SERVER_API}/admin/approve-user/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      });

      const data = await response.json();
      if (data.status === "success") {
        get().getAllUsers(); // Refresh users list
        return { success: true, message: "User approved successfully" };
      }
      return { success: false, message: data.message };
    } catch (error) {
      console.error("Approve user error:", error);
      return { success: false, message: "Failed to approve user" };
    }
  },

  // Reject User (Delete)
  rejectUser: async (userId) => {
    try {
      return await get().deleteUser(userId);
    } catch (error) {
      console.error("Reject user error:", error);
      return { success: false, message: "Failed to reject user" };
    }
  },

  // Send Bulk Email
  sendBulkEmail: async (emails, subject, message) => {
    try {
      const { getAuthHeader } = useAuthStore.getState();
      
      const response = await fetch(`${SERVER_API}/auth/send-bulk-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({ emails, subject, message }),
      });

      const data = await response.json();
      if (data.status === "success") {
        return { 
          success: true, 
          message: data.message,
          data: data.data
        };
      }
      return { success: false, message: data.message };
    } catch (error) {
      console.error("Send bulk email error:", error);
      return { success: false, message: "Failed to send bulk email" };
    }
  },

  // Get Dashboard Stats
  getDashboardStats: async () => {
    try {
      set({ statsLoading: true });
      const { getAuthHeader } = useAuthStore.getState();
      
      // Fetch data from multiple endpoints
      const [usersRes, subscriptionsRes, templatesRes, messagesRes] = await Promise.all([
        fetch(`${SERVER_API}/auth/users`, { headers: getAuthHeader() }),
        fetch(`${SERVER_API}/subscriptions-admin/all`, { headers: getAuthHeader() }),
        fetch(`${SERVER_API}/templates-admin/all`, { headers: getAuthHeader() }),
        fetch(`${SERVER_API}/support-admin/messages`, { headers: getAuthHeader() })
      ]);

      const [usersData, subscriptionsData, templatesData, messagesData] = await Promise.all([
        usersRes.json(),
        subscriptionsRes.json(),
        templatesRes.json(),
        messagesRes.json()
      ]);

      if (
        usersData.status === "success" &&
        subscriptionsData.status === "success" &&
        templatesData.status === "success" &&
        messagesData.status === "success"
      ) {
        const users = usersData.data.users;
        const subscriptions = subscriptionsData.data.subscriptions;
        const templates = templatesData.data.templates;
        const messages = messagesData.data.messages;

        const stats = {
          totalUsers: users.length,
          verifiedUsers: users.filter(u => u.emailVerified).length,
          totalSubscriptions: subscriptions.length,
          activeSubscriptions: subscriptions.filter(s => s.status === "active").length,
          totalRevenue: subscriptions.reduce((sum, s) => sum + (s.amount || 0), 0),
          totalTemplates: templates.length,
          activeTemplates: templates.filter(t => t.isActive).length,
          totalMessages: messages.length,
          openMessages: messages.filter(m => m.status === "open").length,
          tierBreakdown: {
            starter: users.filter(u => u.currentTier === "starter").length,
            pro: users.filter(u => u.currentTier === "pro").length,
            elite: users.filter(u => u.currentTier === "elite").length,
          }
        };

        set({ stats, statsLoading: false });
        return { success: true, data: stats };
      }

      set({ statsLoading: false });
      return { success: false, message: "Failed to fetch some data" };
    } catch (error) {
      console.error("Get dashboard stats error:", error);
      set({ statsLoading: false });
      return { success: false, message: "Failed to fetch dashboard stats" };
    }
  },

  // Clear Stats
  clearStats: () => {
    set({ stats: null });
  },
}));
