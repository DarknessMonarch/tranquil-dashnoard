import { create } from "zustand";
import { useAuthStore } from "./AuthStore";

const SERVER_API = process.env.NEXT_PUBLIC_SERVER_API;

export const useAppVersionStore = create((set, get) => ({
  versions: [],
  currentVersion: null,
  isLoading: false,
  uploadProgress: 0,
  error: null,

  // Fetch all versions
  fetchVersions: async () => {
    try {
      set({ isLoading: true, error: null });
      const { accessToken } = useAuthStore.getState();

      const response = await fetch(`${SERVER_API}/app/versions`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();
      if (data.status === "success") {
        set({ versions: data.data.versions || data.data || [], isLoading: false });
        return { success: true, data: data.data };
      }
      set({ error: data.message, isLoading: false });
      return { success: false, message: data.message };
    } catch (error) {
      console.error("Fetch versions error:", error);
      set({ error: "Failed to fetch versions", isLoading: false });
      return { success: false, message: "Failed to fetch versions" };
    }
  },

  // Fetch current/latest version
  fetchCurrentVersion: async () => {
    try {
      set({ isLoading: true, error: null });
      const { accessToken } = useAuthStore.getState();

      const response = await fetch(`${SERVER_API}/app/version`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();
      if (data.status === "success") {
        set({ currentVersion: data.data, isLoading: false });
        return { success: true, data: data.data };
      }
      set({ error: data.message, isLoading: false });
      return { success: false, message: data.message };
    } catch (error) {
      console.error("Fetch current version error:", error);
      set({ error: "Failed to fetch current version", isLoading: false });
      return { success: false, message: "Failed to fetch current version" };
    }
  },

  // Upload new version with APK files
  uploadVersion: async (formData, onProgress) => {
    const uploadUrl = `${SERVER_API}/app/version/upload`;

    try {
      set({ isLoading: true, uploadProgress: 0, error: null });
      const { accessToken } = useAuthStore.getState();

      if (!SERVER_API) {
        console.error("SERVER_API is not defined!");
        return { success: false, message: "Server URL not configured" };
      }

      if (!accessToken) {
        console.error("No access token!");
        return { success: false, message: "Not authenticated" };
      }

      console.log("=== UPLOAD DEBUG ===");
      console.log("Upload URL:", uploadUrl);
      console.log("Token (first 20 chars):", accessToken.substring(0, 20) + "...");

      // Log FormData contents
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`FormData: ${key} = File(${value.name}, ${value.size} bytes)`);
        } else {
          console.log(`FormData: ${key} = ${value}`);
        }
      }

      console.log("Sending fetch request...");

      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      console.log("Response received:", response.status, response.statusText);

      const data = await response.json();
      console.log("Response data:", data);

      set({ isLoading: false });

      if (response.ok && data.status === "success") {
        set((state) => ({
          versions: [data.data, ...state.versions],
          currentVersion: data.data,
          uploadProgress: 100,
        }));
        return { success: true, data: data.data };
      } else {
        set({ error: data.message, uploadProgress: 0 });
        return { success: false, message: data.message || "Upload failed" };
      }
    } catch (error) {
      console.error("=== UPLOAD ERROR ===");
      console.error("Error:", error);
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      set({ isLoading: false, uploadProgress: 0, error: error.message || "Upload failed" });
      return { success: false, message: error.message || "Upload failed" };
    }
  },

  // Delete a version
  deleteVersion: async (versionId) => {
    try {
      set({ isLoading: true, error: null });
      const { accessToken } = useAuthStore.getState();

      const response = await fetch(`${SERVER_API}/app/version/${versionId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();
      if (data.status === "success") {
        set((state) => ({
          versions: state.versions.filter((v) => v._id !== versionId),
          isLoading: false,
        }));
        return { success: true };
      }
      set({ error: data.message, isLoading: false });
      return { success: false, message: data.message };
    } catch (error) {
      console.error("Delete version error:", error);
      set({ error: "Failed to delete version", isLoading: false });
      return { success: false, message: "Failed to delete version" };
    }
  },

  // Send push notification for a version
  sendNotification: async (versionId) => {
    try {
      set({ isLoading: true, error: null });
      const { accessToken } = useAuthStore.getState();

      const response = await fetch(`${SERVER_API}/app/version/notify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ versionId }),
      });

      const data = await response.json();
      set({ isLoading: false });

      if (data.status === "success") {
        return { success: true, data: data.data };
      }
      return { success: false, message: data.message };
    } catch (error) {
      console.error("Send notification error:", error);
      set({ error: "Failed to send notification", isLoading: false });
      return { success: false, message: "Failed to send notification" };
    }
  },

  // Reset upload progress
  resetUploadProgress: () => {
    set({ uploadProgress: 0 });
  },

  // Clear store
  clearStore: () => {
    set({
      versions: [],
      currentVersion: null,
      isLoading: false,
      uploadProgress: 0,
      error: null,
    });
  },
}));
