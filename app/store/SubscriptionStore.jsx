import { create } from "zustand";
import { useAuthStore } from "./AuthStore";

const SERVER_API = process.env.NEXT_PUBLIC_SERVER_API;

export const useSubscriptionStore = create((set, get) => ({
  currentSubscription: null,
  subscriptionLoading: false,
  paymentLoading: false,
  allSubscriptions: [],
  allSubscriptionsLoading: false,


  getSubscription: async () => {
    try {
      set({ subscriptionLoading: true });
      const { getAuthHeader } = useAuthStore.getState();
      
      const response = await fetch(`${SERVER_API}/subscriptions/me`, {
        headers: getAuthHeader(),
      });

      const data = await response.json();
      if (data.status === "success") {
        set({
          currentSubscription: data.data.subscription,
          subscriptionLoading: false,
        });
        
        // Update auth store with current tier
        useAuthStore.getState().updateUser({ 
          currentTier: data.data.currentTier 
        });
        
        return { success: true, data: data.data };
      }
      set({ subscriptionLoading: false });
      return { success: false, message: data.message };
    } catch (error) {
      console.error("Get subscription error:", error);
      set({ subscriptionLoading: false });
      return { success: false, message: "Failed to fetch subscription" };
    }
  },

  // Initialize Payment
  initializePayment: async (tier) => {
    try {
      set({ paymentLoading: true });
      const { getAuthHeader } = useAuthStore.getState();
      
      const response = await fetch(`${SERVER_API}/subscriptions/initialize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({ tier }),
      });

      const data = await response.json();
      if (data.status === "success") {
        set({ paymentLoading: false });
        return { 
          success: true, 
          data: data.data // Contains authorizationUrl, reference, accessCode
        };
      }
      set({ paymentLoading: false });
      return { success: false, message: data.message };
    } catch (error) {
      console.error("Initialize payment error:", error);
      set({ paymentLoading: false });
      return { success: false, message: "Failed to initialize payment" };
    }
  },

  // Verify Payment
  verifyPayment: async (reference) => {
    try {
      set({ paymentLoading: true });
      const { getAuthHeader } = useAuthStore.getState();
      
      const response = await fetch(`${SERVER_API}/subscriptions/verify/${reference}`, {
        headers: getAuthHeader(),
      });

      const data = await response.json();
      if (data.status === "success") {
        set({ 
          paymentLoading: false,
          currentSubscription: data.data.subscription,
        });
        
        // Update auth store with new tier
        useAuthStore.getState().updateUser({ 
          currentTier: data.data.tier 
        });
        
        return { 
          success: true, 
          data: data.data,
          message: "Payment verified successfully!" 
        };
      }
      set({ paymentLoading: false });
      return { success: false, message: data.message };
    } catch (error) {
      console.error("Verify payment error:", error);
      set({ paymentLoading: false });
      return { success: false, message: "Failed to verify payment" };
    }
  },

  // Get Tier Info
  getTierInfo: (tier) => {
    const { tiers } = get();
    return tiers[tier] || tiers.starter;
  },

  // Check if User Can Access Tier
  canAccessTier: (requiredTier) => {
    const { currentTier } = useAuthStore.getState();
    const tierHierarchy = { starter: 0, pro: 1, elite: 2 };
    return tierHierarchy[currentTier] >= tierHierarchy[requiredTier];
  },

  // Admin: Get All Subscriptions
  getAllSubscriptions: async () => {
    try {
      set({ allSubscriptionsLoading: true });
      const { getAuthHeader } = useAuthStore.getState();
      
      const response = await fetch(`${SERVER_API}/subscriptions-admin/all`, {
        headers: getAuthHeader(),
      });

      const data = await response.json();
      if (data.status === "success") {
        set({
          allSubscriptions: data.data.subscriptions,
          allSubscriptionsLoading: false,
        });
        return { success: true, data: data.data.subscriptions };
      }
      set({ allSubscriptionsLoading: false });
      return { success: false, message: data.message };
    } catch (error) {
      console.error("Get all subscriptions error:", error);
      set({ allSubscriptionsLoading: false });
      return { success: false, message: "Failed to fetch subscriptions" };
    }
  },

  // Admin: Grant Subscription
  grantSubscription: async (userId, tier, duration) => {
    try {
      const { getAuthHeader } = useAuthStore.getState();
      
      const response = await fetch(`${SERVER_API}/subscriptions-admin/grant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({ userId, tier, duration }),
      });

      const data = await response.json();
      if (data.status === "success") {
        get().getAllSubscriptions(); // Refresh subscriptions list
        return { success: true, message: "Subscription granted successfully" };
      }
      return { success: false, message: data.message };
    } catch (error) {
      console.error("Grant subscription error:", error);
      return { success: false, message: "Failed to grant subscription" };
    }
  },
}));
