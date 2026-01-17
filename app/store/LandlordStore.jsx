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
      notices: [],
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

          const response = await fetch(`${SERVER_API}/manager/properties`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          const data = await response.json();
          if (data.status === "success") {
            const properties = Array.isArray(data.data)
              ? data.data
              : data.data.properties || [];
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

          const response = await fetch(`${SERVER_API}/manager/properties`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(propertyData),
          });

          const data = await response.json();

          if (data.status === "success") {
            set({ isLoading: false });
            return { success: true };
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

          const response = await fetch(
            `${SERVER_API}/manager/properties/${propertyId}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify(propertyData),
            }
          );

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

          const response = await fetch(
            `${SERVER_API}/manager/properties/${propertyId}`,
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

      fetchPropertyById: async (propertyId) => {
        try {
          set({ isLoading: true, error: null });
          const { accessToken } = useAuthStore.getState();

          const response = await fetch(
            `${SERVER_API}/manager/properties/${propertyId}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          const data = await response.json();
          if (data.status === "success") {
            const property = data.data.property || data.data;
            set({ isLoading: false });
            return property;
          }
          set({ error: data.message, isLoading: false });
          throw new Error(data.message);
        } catch (error) {
          console.error("Fetch property by ID error:", error);
          set({ error: "Failed to fetch property", isLoading: false });
          throw error;
        }
      },

      // Wrapper methods for property detail page
      fetchPropertyUnits: async (propertyId) => {
        const result = await get().fetchUnits(propertyId);
        return result.success ? result.data : [];
      },

      fetchPropertyTenants: async (propertyId) => {
        const result = await get().fetchTenants(propertyId);
        return result.success ? result.data : [];
      },

      fetchPropertyBills: async (propertyId) => {
        const result = await get().fetchBills(propertyId);
        return result.success ? result.data : [];
      },

      // Units Management
      fetchUnits: async (propertyId) => {
        try {
          set({ isLoading: true, error: null });
          const { accessToken } = useAuthStore.getState();

          const response = await fetch(
            `${SERVER_API}/manager/properties/${propertyId}/units`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          const data = await response.json();
          if (data.status === "success") {
            const units = data.data.units || [];
            set({ units, isLoading: false });
            return { success: true, data: units };
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
            `${SERVER_API}/manager/properties/${propertyId}/units`,
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
            const unit = data.data.unit || data.data;
            set((state) => ({
              units: [...state.units, unit],
              isLoading: false,
            }));
            return { success: true, data: unit };
          }
          set({ error: data.message, isLoading: false });
          return { success: false, message: data.message };
        } catch (error) {
          console.error("Create unit error:", error);
          set({ error: "Failed to create unit", isLoading: false });
          return { success: false, message: "Failed to create unit" };
        }
      },

      updateUnit: async (propertyId, unitId, unitData) => {
        try {
          set({ isLoading: true, error: null });
          const { accessToken } = useAuthStore.getState();

          const response = await fetch(
            `${SERVER_API}/manager/properties/${propertyId}/units/${unitId}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify(unitData),
            }
          );

          const data = await response.json();
          if (data.status === "success") {
            const unit = data.data.unit || data.data;
            set((state) => ({
              units: state.units.map((u) => (u._id === unitId ? unit : u)),
              isLoading: false,
            }));
            return { success: true, data: unit };
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

          const response = await fetch(
            `${SERVER_API}/manager/units/${unitId}`,
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
            `${SERVER_API}/manager/properties/${propertyId}/tenants`,
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

          const response = await fetch(`${SERVER_API}/manager/tenants`, {
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

          const response = await fetch(
            `${SERVER_API}/manager/tenants/${tenantId}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify(tenantData),
            }
          );

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

          const response = await fetch(
            `${SERVER_API}/manager/tenants/${tenantId}`,
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
            `${SERVER_API}/manager/properties/${propertyId}/maintenance`,
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
          set({
            error: "Failed to fetch maintenance requests",
            isLoading: false,
          });
          return {
            success: false,
            message: "Failed to fetch maintenance requests",
          };
        }
      },

      updateMaintenanceStatus: async (requestId, status) => {
        try {
          set({ isLoading: true, error: null });
          const { accessToken } = useAuthStore.getState();

          const response = await fetch(
            `${SERVER_API}/manager/maintenance/${requestId}/status`,
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
          set({
            error: "Failed to update maintenance status",
            isLoading: false,
          });
          return {
            success: false,
            message: "Failed to update maintenance status",
          };
        }
      },

      // Notices
      fetchNotices: async (propertyId) => {
        try {
          set({ isLoading: true, error: null });
          const { accessToken } = useAuthStore.getState();

          const response = await fetch(
            `${SERVER_API}/manager/properties/${propertyId}/notices`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          const data = await response.json();
          if (data.status === "success") {
            set({ notices: data.data.notices, isLoading: false });
            return { success: true, data: data.data.notices };
          }
          set({ error: data.message, isLoading: false });
          return { success: false, message: data.message };
        } catch (error) {
          console.error("Fetch notices error:", error);
          set({ error: "Failed to fetch notices", isLoading: false });
          return { success: false, message: "Failed to fetch notices" };
        }
      },

      createNotice: async (propertyId, noticeData) => {
        try {
          set({ isLoading: true, error: null });
          const { accessToken } = useAuthStore.getState();

          const response = await fetch(
            `${SERVER_API}/manager/properties/${propertyId}/notices`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify(noticeData),
            }
          );

          const data = await response.json();
          if (data.status === "success") {
            set((state) => ({
              notices: [...state.notices, data.data.notice],
              isLoading: false,
            }));
            return { success: true, data: data.data.notice };
          }
          set({ error: data.message, isLoading: false });
          return { success: false, message: data.message };
        } catch (error) {
          console.error("Create notice error:", error);
          set({ error: "Failed to create notice", isLoading: false });
          return { success: false, message: "Failed to create notice" };
        }
      },

      deleteNotice: async (noticeId) => {
        try {
          set({ isLoading: true, error: null });
          const { accessToken } = useAuthStore.getState();

          const response = await fetch(
            `${SERVER_API}/manager/notices/${noticeId}`,
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
              notices: state.notices.filter((n) => n._id !== noticeId),
              isLoading: false,
            }));
            return { success: true };
          }
          set({ error: data.message, isLoading: false });
          return { success: false, message: data.message };
        } catch (error) {
          console.error("Delete notice error:", error);
          set({ error: "Failed to delete notice", isLoading: false });
          return { success: false, message: "Failed to delete notice" };
        }
      },

      // Bills Management
      fetchBills: async (propertyId) => {
        try {
          set({ isLoading: true, error: null });
          const { accessToken } = useAuthStore.getState();

          const response = await fetch(
            `${SERVER_API}/manager/properties/${propertyId}/bills`,
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

          const response = await fetch(`${SERVER_API}/manager/bills`, {
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

          const response = await fetch(
            `${SERVER_API}/manager/bills/${billId}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify(billData),
            }
          );

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

          const response = await fetch(
            `${SERVER_API}/manager/bills/${billId}`,
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

      addBillAdjustment: async (billId, adjustmentData) => {
        try {
          set({ isLoading: true, error: null });
          const { accessToken } = useAuthStore.getState();

          const response = await fetch(
            `${SERVER_API}/manager/bills/${billId}/adjustment`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify(adjustmentData),
            }
          );

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
          console.error("Add bill adjustment error:", error);
          set({ error: "Failed to add adjustment", isLoading: false });
          return { success: false, message: "Failed to add adjustment" };
        }
      },

      // Payments Management
      fetchPayments: async (propertyId) => {
        try {
          set({ isLoading: true, error: null });
          const { accessToken } = useAuthStore.getState();

          const response = await fetch(
            `${SERVER_API}/manager/properties/${propertyId}/payments`,
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

          const response = await fetch(`${SERVER_API}/manager/payments`, {
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

          const response = await fetch(
            `${SERVER_API}/manager/payments/${paymentId}`,
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

      // Get tenant by ID
      getTenantById: async (tenantId) => {
        try {
          set({ isLoading: true, error: null });
          const { accessToken } = useAuthStore.getState();

          const response = await fetch(
            `${SERVER_API}/manager/tenants/${tenantId}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          const data = await response.json();
          if (data.status === "success") {
            set({ isLoading: false });
            return { success: true, data: data.data };
          }
          set({ error: data.message, isLoading: false });
          return { success: false, message: data.message };
        } catch (error) {
          console.error("Get tenant error:", error);
          set({ error: "Failed to fetch tenant", isLoading: false });
          return { success: false, message: "Failed to fetch tenant" };
        }
      },

      // Fetch tenant bills
      fetchTenantBills: async (tenantId) => {
        try {
          const { accessToken } = useAuthStore.getState();

          const response = await fetch(
            `${SERVER_API}/manager/tenants/${tenantId}/bills`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          const data = await response.json();
          if (data.status === "success") {
            return { success: true, data: data.data.bills || data.data || [] };
          }
          return { success: false, message: data.message, data: [] };
        } catch (error) {
          console.error("Fetch tenant bills error:", error);
          return { success: false, message: "Failed to fetch bills", data: [] };
        }
      },

      // Fetch tenant payments
      fetchTenantPayments: async (tenantId) => {
        try {
          const { accessToken } = useAuthStore.getState();

          const response = await fetch(
            `${SERVER_API}/manager/tenants/${tenantId}/payments`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          const data = await response.json();
          if (data.status === "success") {
            return {
              success: true,
              data: data.data.payments || data.data || [],
            };
          }
          return { success: false, message: data.message, data: [] };
        } catch (error) {
          console.error("Fetch tenant payments error:", error);
          return {
            success: false,
            message: "Failed to fetch payments",
            data: [],
          };
        }
      },

      // Fetch tenant maintenance
      fetchTenantMaintenance: async (tenantId) => {
        try {
          const { accessToken } = useAuthStore.getState();

          const response = await fetch(
            `${SERVER_API}/manager/tenants/${tenantId}/maintenance`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          const data = await response.json();
          if (data.status === "success") {
            return {
              success: true,
              data: data.data.requests || data.data || [],
            };
          }
          return { success: false, message: data.message, data: [] };
        } catch (error) {
          console.error("Fetch tenant maintenance error:", error);
          return {
            success: false,
            message: "Failed to fetch maintenance",
            data: [],
          };
        }
      },

      // Add water expense to bill
      addWaterExpense: async (billId, expenseData) => {
        try {
          set({ isLoading: true, error: null });
          const { accessToken } = useAuthStore.getState();

          const response = await fetch(
            `${SERVER_API}/manager/bills/${billId}/water-expense`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify(expenseData),
            }
          );

          const data = await response.json();
          if (data.status === "success") {
            set({ isLoading: false });
            return { success: true, data: data.data };
          }
          set({ error: data.message, isLoading: false });
          return { success: false, message: data.message };
        } catch (error) {
          console.error("Add water expense error:", error);
          set({ error: "Failed to add water expense", isLoading: false });
          return { success: false, message: "Failed to add water expense" };
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
          notices: [],
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
