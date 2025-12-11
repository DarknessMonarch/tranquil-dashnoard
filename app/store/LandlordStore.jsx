import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useAuthStore } from "./AuthStore";

const SERVER_API = process.env.NEXT_PUBLIC_SERVER_API;

export const useLandlordStore = create(
  persist(
    (set, get) => ({
      selectedProperty: null,
      properties: [],
      units: [],
      tenants: [],
      maintenanceRequests: [],
      announcements: [],
      bills: [],
      payments: [],
      analytics: null,
      isLoading: false,
      error: null,

      // Property Management
      setSelectedProperty: (property) => {
        set({ selectedProperty: property });
        if (property) {
          localStorage.setItem("selectedPropertyId", property._id);
        }
      },

      fetchProperties: async () => {
        try {
          set({ isLoading: true, error: null });
          const { accessToken } = useAuthStore.getState();

          const response = await fetch(`${SERVER_API}/landlord/properties`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          const data = await response.json();
          if (data.status === "success") {
            const properties = Array.isArray(data.data) ? data.data : data.data.properties || [];
            set({ properties, isLoading: false });

            // Auto-select first property if none selected
            if (!get().selectedProperty && properties.length > 0) {
              get().setSelectedProperty(properties[0]);
            }

            return { success: true, data: properties };
          }
          set({ error: data.message, isLoading: false });
          return { success: false, message: data.message };
        } catch (error) {
          console.error("Fetch properties error:", error);
          set({ error: "Failed to fetch properties", isLoading: false });
          return { success: false, message: "Failed to fetch properties" };
        }
      },

      createProperty: async (propertyData) => {
        try {
          set({ isLoading: true, error: null });
          const { accessToken } = useAuthStore.getState();

          const response = await fetch(`${SERVER_API}/landlord/properties`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(propertyData),
          });

          const data = await response.json();
          if (data.status === "success") {
            set((state) => ({
              properties: [...state.properties, data.data.property],
              isLoading: false,
            }));
            return { success: true, data: data.data.property };
          }
          set({ error: data.message, isLoading: false });
          return { success: false, message: data.message };
        } catch (error) {
          console.error("Create property error:", error);
          set({ error: "Failed to create property", isLoading: false });
          return { success: false, message: "Failed to create property" };
        }
      },

      updateProperty: async (propertyId, propertyData) => {
        try {
          set({ isLoading: true, error: null });
          const { accessToken } = useAuthStore.getState();

          const response = await fetch(`${SERVER_API}/landlord/properties/${propertyId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(propertyData),
          });

          const data = await response.json();
          if (data.status === "success") {
            set((state) => ({
              properties: state.properties.map((p) =>
                p._id === propertyId ? data.data.property : p
              ),
              selectedProperty:
                state.selectedProperty?._id === propertyId
                  ? data.data.property
                  : state.selectedProperty,
              isLoading: false,
            }));
            return { success: true, data: data.data.property };
          }
          set({ error: data.message, isLoading: false });
          return { success: false, message: data.message };
        } catch (error) {
          console.error("Update property error:", error);
          set({ error: "Failed to update property", isLoading: false });
          return { success: false, message: "Failed to update property" };
        }
      },

      deleteProperty: async (propertyId) => {
        try {
          set({ isLoading: true, error: null });
          const { accessToken } = useAuthStore.getState();

          const response = await fetch(`${SERVER_API}/landlord/properties/${propertyId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          const data = await response.json();
          if (data.status === "success") {
            set((state) => ({
              properties: state.properties.filter((p) => p._id !== propertyId),
              selectedProperty:
                state.selectedProperty?._id === propertyId
                  ? null
                  : state.selectedProperty,
              isLoading: false,
            }));
            return { success: true };
          }
          set({ error: data.message, isLoading: false });
          return { success: false, message: data.message };
        } catch (error) {
          console.error("Delete property error:", error);
          set({ error: "Failed to delete property", isLoading: false });
          return { success: false, message: "Failed to delete property" };
        }
      },

      // Units Management
      fetchUnits: async (propertyId) => {
        try {
          set({ isLoading: true, error: null });
          const { accessToken } = useAuthStore.getState();

          const response = await fetch(
            `${SERVER_API}/landlord/properties/${propertyId}/units`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          const data = await response.json();
          if (data.status === "success") {
            set({ units: data.data.units, isLoading: false });
            return { success: true, data: data.data.units };
          }
          set({ error: data.message, isLoading: false });
          return { success: false, message: data.message };
        } catch (error) {
          console.error("Fetch units error:", error);
          set({ error: "Failed to fetch units", isLoading: false });
          return { success: false, message: "Failed to fetch units" };
        }
      },

      createUnit: async (propertyId, unitData) => {
        try {
          set({ isLoading: true, error: null });
          const { accessToken } = useAuthStore.getState();

          const response = await fetch(
            `${SERVER_API}/landlord/properties/${propertyId}/units`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify(unitData),
            }
          );

          const data = await response.json();
          if (data.status === "success") {
            set((state) => ({
              units: [...state.units, data.data.unit],
              isLoading: false,
            }));
            return { success: true, data: data.data.unit };
          }
          set({ error: data.message, isLoading: false });
          return { success: false, message: data.message };
        } catch (error) {
          console.error("Create unit error:", error);
          set({ error: "Failed to create unit", isLoading: false });
          return { success: false, message: "Failed to create unit" };
        }
      },

      updateUnit: async (unitId, unitData) => {
        try {
          set({ isLoading: true, error: null });
          const { accessToken } = useAuthStore.getState();

          const response = await fetch(`${SERVER_API}/landlord/units/${unitId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(unitData),
          });

          const data = await response.json();
          if (data.status === "success") {
            set((state) => ({
              units: state.units.map((u) =>
                u._id === unitId ? data.data.unit : u
              ),
              isLoading: false,
            }));
            return { success: true, data: data.data.unit };
          }
          set({ error: data.message, isLoading: false });
          return { success: false, message: data.message };
        } catch (error) {
          console.error("Update unit error:", error);
          set({ error: "Failed to update unit", isLoading: false });
          return { success: false, message: "Failed to update unit" };
        }
      },

      deleteUnit: async (unitId) => {
        try {
          set({ isLoading: true, error: null });
          const { accessToken } = useAuthStore.getState();

          const response = await fetch(`${SERVER_API}/landlord/units/${unitId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          const data = await response.json();
          if (data.status === "success") {
            set((state) => ({
              units: state.units.filter((u) => u._id !== unitId),
              isLoading: false,
            }));
            return { success: true };
          }
          set({ error: data.message, isLoading: false });
          return { success: false, message: data.message };
        } catch (error) {
          console.error("Delete unit error:", error);
          set({ error: "Failed to delete unit", isLoading: false });
          return { success: false, message: "Failed to delete unit" };
        }
      },

      // Tenants Management
      fetchTenants: async (propertyId) => {
        try {
          set({ isLoading: true, error: null });
          const { accessToken } = useAuthStore.getState();

          const response = await fetch(
            `${SERVER_API}/landlord/properties/${propertyId}/tenants`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          const data = await response.json();
          if (data.status === "success") {
            set({ tenants: data.data.tenants, isLoading: false });
            return { success: true, data: data.data.tenants };
          }
          set({ error: data.message, isLoading: false });
          return { success: false, message: data.message };
        } catch (error) {
          console.error("Fetch tenants error:", error);
          set({ error: "Failed to fetch tenants", isLoading: false });
          return { success: false, message: "Failed to fetch tenants" };
        }
      },

      createTenant: async (tenantData) => {
        try {
          set({ isLoading: true, error: null });
          const { accessToken } = useAuthStore.getState();

          const response = await fetch(`${SERVER_API}/landlord/tenants`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(tenantData),
          });

          const data = await response.json();
          if (data.status === "success") {
            set((state) => ({
              tenants: [...state.tenants, data.data.tenant],
              isLoading: false,
            }));
            return { success: true, data: data.data.tenant };
          }
          set({ error: data.message, isLoading: false });
          return { success: false, message: data.message };
        } catch (error) {
          console.error("Create tenant error:", error);
          set({ error: "Failed to create tenant", isLoading: false });
          return { success: false, message: "Failed to create tenant" };
        }
      },

      updateTenant: async (tenantId, tenantData) => {
        try {
          set({ isLoading: true, error: null });
          const { accessToken } = useAuthStore.getState();

          const response = await fetch(`${SERVER_API}/landlord/tenants/${tenantId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(tenantData),
          });

          const data = await response.json();
          if (data.status === "success") {
            set((state) => ({
              tenants: state.tenants.map((t) =>
                t._id === tenantId ? data.data.tenant : t
              ),
              isLoading: false,
            }));
            return { success: true, data: data.data.tenant };
          }
          set({ error: data.message, isLoading: false });
          return { success: false, message: data.message };
        } catch (error) {
          console.error("Update tenant error:", error);
          set({ error: "Failed to update tenant", isLoading: false });
          return { success: false, message: "Failed to update tenant" };
        }
      },

      deleteTenant: async (tenantId) => {
        try {
          set({ isLoading: true, error: null });
          const { accessToken } = useAuthStore.getState();

          const response = await fetch(`${SERVER_API}/landlord/tenants/${tenantId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          const data = await response.json();
          if (data.status === "success") {
            set((state) => ({
              tenants: state.tenants.filter((t) => t._id !== tenantId),
              isLoading: false,
            }));
            return { success: true };
          }
          set({ error: data.message, isLoading: false });
          return { success: false, message: data.message };
        } catch (error) {
          console.error("Delete tenant error:", error);
          set({ error: "Failed to delete tenant", isLoading: false });
          return { success: false, message: "Failed to delete tenant" };
        }
      },

      // Maintenance Requests
      fetchMaintenanceRequests: async (propertyId) => {
        try {
          set({ isLoading: true, error: null });
          const { accessToken } = useAuthStore.getState();

          const response = await fetch(
            `${SERVER_API}/landlord/properties/${propertyId}/maintenance`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          const data = await response.json();
          if (data.status === "success") {
            set({ maintenanceRequests: data.data.requests, isLoading: false });
            return { success: true, data: data.data.requests };
          }
          set({ error: data.message, isLoading: false });
          return { success: false, message: data.message };
        } catch (error) {
          console.error("Fetch maintenance requests error:", error);
          set({ error: "Failed to fetch maintenance requests", isLoading: false });
          return { success: false, message: "Failed to fetch maintenance requests" };
        }
      },

      updateMaintenanceStatus: async (requestId, status) => {
        try {
          set({ isLoading: true, error: null });
          const { accessToken } = useAuthStore.getState();

          const response = await fetch(
            `${SERVER_API}/landlord/maintenance/${requestId}/status`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({ status }),
            }
          );

          const data = await response.json();
          if (data.status === "success") {
            set((state) => ({
              maintenanceRequests: state.maintenanceRequests.map((r) =>
                r._id === requestId ? { ...r, status } : r
              ),
              isLoading: false,
            }));
            return { success: true };
          }
          set({ error: data.message, isLoading: false });
          return { success: false, message: data.message };
        } catch (error) {
          console.error("Update maintenance status error:", error);
          set({ error: "Failed to update maintenance status", isLoading: false });
          return { success: false, message: "Failed to update maintenance status" };
        }
      },

      // Announcements
      fetchAnnouncements: async (propertyId) => {
        try {
          set({ isLoading: true, error: null });
          const { accessToken } = useAuthStore.getState();

          const response = await fetch(
            `${SERVER_API}/landlord/properties/${propertyId}/announcements`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          const data = await response.json();
          if (data.status === "success") {
            set({ announcements: data.data.announcements, isLoading: false });
            return { success: true, data: data.data.announcements };
          }
          set({ error: data.message, isLoading: false });
          return { success: false, message: data.message };
        } catch (error) {
          console.error("Fetch announcements error:", error);
          set({ error: "Failed to fetch announcements", isLoading: false });
          return { success: false, message: "Failed to fetch announcements" };
        }
      },

      createAnnouncement: async (propertyId, announcementData) => {
        try {
          set({ isLoading: true, error: null });
          const { accessToken } = useAuthStore.getState();

          const response = await fetch(
            `${SERVER_API}/landlord/properties/${propertyId}/announcements`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify(announcementData),
            }
          );

          const data = await response.json();
          if (data.status === "success") {
            set((state) => ({
              announcements: [...state.announcements, data.data.announcement],
              isLoading: false,
            }));
            return { success: true, data: data.data.announcement };
          }
          set({ error: data.message, isLoading: false });
          return { success: false, message: data.message };
        } catch (error) {
          console.error("Create announcement error:", error);
          set({ error: "Failed to create announcement", isLoading: false });
          return { success: false, message: "Failed to create announcement" };
        }
      },

      deleteAnnouncement: async (announcementId) => {
        try {
          set({ isLoading: true, error: null });
          const { accessToken } = useAuthStore.getState();

          const response = await fetch(
            `${SERVER_API}/landlord/announcements/${announcementId}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          const data = await response.json();
          if (data.status === "success") {
            set((state) => ({
              announcements: state.announcements.filter(
                (a) => a._id !== announcementId
              ),
              isLoading: false,
            }));
            return { success: true };
          }
          set({ error: data.message, isLoading: false });
          return { success: false, message: data.message };
        } catch (error) {
          console.error("Delete announcement error:", error);
          set({ error: "Failed to delete announcement", isLoading: false });
          return { success: false, message: "Failed to delete announcement" };
        }
      },

      // Bills Management
      fetchBills: async (propertyId) => {
        try {
          set({ isLoading: true, error: null });
          const { accessToken } = useAuthStore.getState();

          const response = await fetch(
            `${SERVER_API}/landlord/properties/${propertyId}/bills`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          const data = await response.json();
          if (data.status === "success") {
            set({ bills: data.data.bills, isLoading: false });
            return { success: true, data: data.data.bills };
          }
          set({ error: data.message, isLoading: false });
          return { success: false, message: data.message };
        } catch (error) {
          console.error("Fetch bills error:", error);
          set({ error: "Failed to fetch bills", isLoading: false });
          return { success: false, message: "Failed to fetch bills" };
        }
      },

      createBill: async (billData) => {
        try {
          set({ isLoading: true, error: null });
          const { accessToken } = useAuthStore.getState();

          const response = await fetch(`${SERVER_API}/landlord/bills`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(billData),
          });

          const data = await response.json();
          if (data.status === "success") {
            set((state) => ({
              bills: [...state.bills, data.data.bill],
              isLoading: false,
            }));
            return { success: true, data: data.data.bill };
          }
          set({ error: data.message, isLoading: false });
          return { success: false, message: data.message };
        } catch (error) {
          console.error("Create bill error:", error);
          set({ error: "Failed to create bill", isLoading: false });
          return { success: false, message: "Failed to create bill" };
        }
      },

      updateBill: async (billId, billData) => {
        try {
          set({ isLoading: true, error: null });
          const { accessToken } = useAuthStore.getState();

          const response = await fetch(`${SERVER_API}/landlord/bills/${billId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(billData),
          });

          const data = await response.json();
          if (data.status === "success") {
            set((state) => ({
              bills: state.bills.map((b) =>
                b._id === billId ? data.data.bill : b
              ),
              isLoading: false,
            }));
            return { success: true, data: data.data.bill };
          }
          set({ error: data.message, isLoading: false });
          return { success: false, message: data.message };
        } catch (error) {
          console.error("Update bill error:", error);
          set({ error: "Failed to update bill", isLoading: false });
          return { success: false, message: "Failed to update bill" };
        }
      },

      deleteBill: async (billId) => {
        try {
          set({ isLoading: true, error: null });
          const { accessToken } = useAuthStore.getState();

          const response = await fetch(`${SERVER_API}/landlord/bills/${billId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          const data = await response.json();
          if (data.status === "success") {
            set((state) => ({
              bills: state.bills.filter((b) => b._id !== billId),
              isLoading: false,
            }));
            return { success: true };
          }
          set({ error: data.message, isLoading: false });
          return { success: false, message: data.message };
        } catch (error) {
          console.error("Delete bill error:", error);
          set({ error: "Failed to delete bill", isLoading: false });
          return { success: false, message: "Failed to delete bill" };
        }
      },

      // Payments Management
      fetchPayments: async (propertyId) => {
        try {
          set({ isLoading: true, error: null });
          const { accessToken } = useAuthStore.getState();

          const response = await fetch(
            `${SERVER_API}/landlord/properties/${propertyId}/payments`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          const data = await response.json();
          if (data.status === "success") {
            set({ payments: data.data.payments, isLoading: false });
            return { success: true, data: data.data.payments };
          }
          set({ error: data.message, isLoading: false });
          return { success: false, message: data.message };
        } catch (error) {
          console.error("Fetch payments error:", error);
          set({ error: "Failed to fetch payments", isLoading: false });
          return { success: false, message: "Failed to fetch payments" };
        }
      },

      recordPayment: async (paymentData) => {
        try {
          set({ isLoading: true, error: null });
          const { accessToken } = useAuthStore.getState();

          const response = await fetch(`${SERVER_API}/landlord/payments`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(paymentData),
          });

          const data = await response.json();
          if (data.status === "success") {
            set((state) => ({
              payments: [...state.payments, data.data.payment],
              isLoading: false,
            }));
            return { success: true, data: data.data.payment };
          }
          set({ error: data.message, isLoading: false });
          return { success: false, message: data.message };
        } catch (error) {
          console.error("Record payment error:", error);
          set({ error: "Failed to record payment", isLoading: false });
          return { success: false, message: "Failed to record payment" };
        }
      },

      deletePayment: async (paymentId) => {
        try {
          set({ isLoading: true, error: null });
          const { accessToken } = useAuthStore.getState();

          const response = await fetch(`${SERVER_API}/landlord/payments/${paymentId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          const data = await response.json();
          if (data.status === "success") {
            set((state) => ({
              payments: state.payments.filter((p) => p._id !== paymentId),
              isLoading: false,
            }));
            return { success: true };
          }
          set({ error: data.message, isLoading: false });
          return { success: false, message: data.message };
        } catch (error) {
          console.error("Delete payment error:", error);
          set({ error: "Failed to delete payment", isLoading: false });
          return { success: false, message: "Failed to delete payment" };
        }
      },

      // Analytics
      fetchAnalytics: async (propertyId) => {
        try {
          set({ isLoading: true, error: null });
          const { accessToken } = useAuthStore.getState();

          const url = propertyId
            ? `${SERVER_API}/admin/analytics?propertyId=${propertyId}`
            : `${SERVER_API}/admin/analytics`;

          const response = await fetch(url, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          const data = await response.json();
          if (data.status === "success") {
            set({ analytics: data.data, isLoading: false });
            return { success: true, data: data.data };
          }
          set({ error: data.message, isLoading: false });
          return { success: false, message: data.message };
        } catch (error) {
          console.error("Fetch analytics error:", error);
          set({ error: "Failed to fetch analytics", isLoading: false });
          return { success: false, message: "Failed to fetch analytics" };
        }
      },

      // Clear store
      clearStore: () => {
        set({
          selectedProperty: null,
          properties: [],
          units: [],
          tenants: [],
          maintenanceRequests: [],
          announcements: [],
          bills: [],
          payments: [],
          analytics: null,
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: "tranquil-landlord",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedProperty: state.selectedProperty,
        properties: state.properties,
      }),
    }
  )
);
