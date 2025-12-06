import { create } from "zustand";
import { useAuthStore } from "./AuthStore";

const SERVER_API = process.env.NEXT_PUBLIC_SERVER_API;

export const useSupportStore = create((set, get) => ({
  // Support State
  messages: [],
  messagesLoading: false,
  selectedMessage: null,
  messageLoading: false,
  allMessages: [],
  allMessagesLoading: false,

  // Subject Options
  subjects: [
    { value: "template-inquiry", label: "Template Inquiry" },
    { value: "tier-question", label: "Tier Questions" },
    { value: "access-issue", label: "Access Issues" },
    { value: "technical-support", label: "Technical Support" },
    { value: "coaching", label: "Coaching Session Booking" },
  ],

  // Submit Support Message
  submitMessage: async (subject, message) => {
    try {
      const { getAuthHeader } = useAuthStore.getState();
      
      const response = await fetch(`${SERVER_API}/support/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({ subject, message }),
      });

      const data = await response.json();
      if (data.status === "success") {
        get().getUserMessages(); // Refresh messages list
        return { 
          success: true, 
          message: data.message,
          data: data.data
        };
      }
      return { success: false, message: data.message };
    } catch (error) {
      console.error("Submit message error:", error);
      return { success: false, message: "Failed to submit message" };
    }
  },

  // Get User Messages
  getUserMessages: async () => {
    try {
      set({ messagesLoading: true });
      const { getAuthHeader } = useAuthStore.getState();
      
      const response = await fetch(`${SERVER_API}/support/messages`, {
        headers: getAuthHeader(),
      });

      const data = await response.json();
      if (data.status === "success") {
        set({
          messages: data.data.messages,
          messagesLoading: false,
        });
        return { success: true, data: data.data.messages };
      }
      set({ messagesLoading: false });
      return { success: false, message: data.message };
    } catch (error) {
      console.error("Get messages error:", error);
      set({ messagesLoading: false });
      return { success: false, message: "Failed to fetch messages" };
    }
  },

  // Get Single Message
  getMessage: async (messageId) => {
    try {
      set({ messageLoading: true });
      const { getAuthHeader } = useAuthStore.getState();
      
      const response = await fetch(`${SERVER_API}/support/messages/${messageId}`, {
        headers: getAuthHeader(),
      });

      const data = await response.json();
      if (data.status === "success") {
        set({
          selectedMessage: data.data.message,
          messageLoading: false,
        });
        return { success: true, data: data.data.message };
      }
      set({ messageLoading: false });
      return { success: false, message: data.message };
    } catch (error) {
      console.error("Get message error:", error);
      set({ messageLoading: false });
      return { success: false, message: "Failed to fetch message" };
    }
  },

  // Reply to Message
  replyToMessage: async (messageId, message) => {
    try {
      const { getAuthHeader } = useAuthStore.getState();
      
      const response = await fetch(`${SERVER_API}/support/messages/${messageId}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();
      if (data.status === "success") {
        // Update selected message with new reply
        set({ selectedMessage: data.data.message });
        return { success: true, message: "Reply sent successfully" };
      }
      return { success: false, message: data.message };
    } catch (error) {
      console.error("Reply to message error:", error);
      return { success: false, message: "Failed to send reply" };
    }
  },

  // Clear Selected Message
  clearSelectedMessage: () => {
    set({ selectedMessage: null });
  },

  // Admin: Get All Messages
  getAllMessages: async (filters = {}) => {
    try {
      set({ allMessagesLoading: true });
      const { getAuthHeader } = useAuthStore.getState();
      
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`${SERVER_API}/support-admin/messages?${queryParams}`, {
        headers: getAuthHeader(),
      });

      const data = await response.json();
      if (data.status === "success") {
        set({
          allMessages: data.data.messages,
          allMessagesLoading: false,
        });
        return { success: true, data: data.data.messages };
      }
      set({ allMessagesLoading: false });
      return { success: false, message: data.message };
    } catch (error) {
      console.error("Get all messages error:", error);
      set({ allMessagesLoading: false });
      return { success: false, message: "Failed to fetch messages" };
    }
  },

  // Admin: Reply to Message
  adminReply: async (messageId, message) => {
    try {
      const { getAuthHeader } = useAuthStore.getState();
      
      const response = await fetch(`${SERVER_API}/support-admin/messages/${messageId}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();
      if (data.status === "success") {
        get().getAllMessages(); // Refresh messages list
        return { success: true, message: "Reply sent successfully" };
      }
      return { success: false, message: data.message };
    } catch (error) {
      console.error("Admin reply error:", error);
      return { success: false, message: "Failed to send reply" };
    }
  },

  // Admin: Resolve Message
  resolveMessage: async (messageId) => {
    try {
      const { getAuthHeader } = useAuthStore.getState();
      
      const response = await fetch(`${SERVER_API}/support-admin/messages/${messageId}/resolve`, {
        method: "PATCH",
        headers: getAuthHeader(),
      });

      const data = await response.json();
      if (data.status === "success") {
        get().getAllMessages(); // Refresh messages list
        return { success: true, message: "Message resolved successfully" };
      }
      return { success: false, message: data.message };
    } catch (error) {
      console.error("Resolve message error:", error);
      return { success: false, message: "Failed to resolve message" };
    }
  },

  // Admin: Close Message
  closeMessage: async (messageId) => {
    try {
      const { getAuthHeader } = useAuthStore.getState();
      
      const response = await fetch(`${SERVER_API}/support-admin/messages/${messageId}/close`, {
        method: "PATCH",
        headers: getAuthHeader(),
      });

      const data = await response.json();
      if (data.status === "success") {
        get().getAllMessages(); // Refresh messages list
        return { success: true, message: "Message closed successfully" };
      }
      return { success: false, message: data.message };
    } catch (error) {
      console.error("Close message error:", error);
      return { success: false, message: "Failed to close message" };
    }
  },

  // Admin: Update Priority
  updatePriority: async (messageId, priority) => {
    try {
      const { getAuthHeader } = useAuthStore.getState();
      
      const response = await fetch(`${SERVER_API}/support-admin/messages/${messageId}/priority`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({ priority }),
      });

      const data = await response.json();
      if (data.status === "success") {
        get().getAllMessages(); // Refresh messages list
        return { success: true, message: "Priority updated successfully" };
      }
      return { success: false, message: data.message };
    } catch (error) {
      console.error("Update priority error:", error);
      return { success: false, message: "Failed to update priority" };
    }
  },

  // Admin: Delete Message
  deleteMessage: async (messageId) => {
    try {
      const { getAuthHeader } = useAuthStore.getState();
      
      const response = await fetch(`${SERVER_API}/support-admin/messages/${messageId}`, {
        method: "DELETE",
        headers: getAuthHeader(),
      });

      const data = await response.json();
      if (data.status === "success") {
        get().getAllMessages(); // Refresh messages list
        return { success: true, message: "Message deleted successfully" };
      }
      return { success: false, message: data.message };
    } catch (error) {
      console.error("Delete message error:", error);
      return { success: false, message: "Failed to delete message" };
    }
  },

  // Get Expected Response Time
  getExpectedResponseTime: () => {
    const { currentTier } = useAuthStore.getState();
    const responseTimes = {
      elite: "2 hours (VIP Support)",
      pro: "12 hours (Priority Support)",
      starter: "24 hours (Standard Support)"
    };
    return responseTimes[currentTier] || responseTimes.starter;
  },
}));
