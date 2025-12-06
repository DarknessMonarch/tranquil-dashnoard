import { create } from "zustand";
import { useAuthStore } from "./AuthStore";

const SERVER_API = process.env.NEXT_PUBLIC_SERVER_API;

export const useTemplateStore = create((set, get) => ({
  templates: [],
  templatesLoading: false,
  previousTemplates: [],
  previousLoading: false,
  bookmarkedTemplates: [],
  bookmarksLoading: false,
  selectedTemplate: null,
  templateLoading: false,

  // Get All Templates
  getAllTemplates: async (filters = {}) => {
    try {
      set({ templatesLoading: true });
      const { getAuthHeader } = useAuthStore.getState();
      
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`${SERVER_API}/templates?${queryParams}`, {
        headers: getAuthHeader(),
      });

      const data = await response.json();
      if (data.status === "success") {
        set({
          templates: data.data.templates,
          templatesLoading: false,
        });
        return { success: true, data: data.data };
      }
      set({ templatesLoading: false });
      return { success: false, message: data.message };
    } catch (error) {
      console.error("Get templates error:", error);
      set({ templatesLoading: false });
      return { success: false, message: "Failed to fetch templates" };
    }
  },

  // Get Single Template
  getTemplate: async (templateId) => {
    try {
      set({ templateLoading: true });
      const { getAuthHeader } = useAuthStore.getState();
      
      const response = await fetch(`${SERVER_API}/templates/${templateId}`, {
        headers: getAuthHeader(),
      });

      const data = await response.json();
      if (data.status === "success") {
        set({
          selectedTemplate: data.data.template,
          templateLoading: false,
        });
        return { success: true, data: data.data.template };
      }
      set({ templateLoading: false });
      
      // Handle tier restriction
      if (data.message.includes("Upgrade")) {
        return { 
          success: false, 
          message: data.message,
          requiresUpgrade: true,
          requiredTier: data.requiredTier
        };
      }
      
      return { success: false, message: data.message };
    } catch (error) {
      console.error("Get template error:", error);
      set({ templateLoading: false });
      return { success: false, message: "Failed to fetch template" };
    }
  },

  // Get Previous Templates
  getPreviousTemplates: async () => {
    try {
      set({ previousLoading: true });
      const { getAuthHeader } = useAuthStore.getState();
      
      const response = await fetch(`${SERVER_API}/templates/previous`, {
        headers: getAuthHeader(),
      });

      const data = await response.json();
      if (data.status === "success") {
        set({
          previousTemplates: data.data.templates,
          previousLoading: false,
        });
        return { success: true, data: data.data.templates };
      }
      set({ previousLoading: false });
      return { success: false, message: data.message };
    } catch (error) {
      console.error("Get previous templates error:", error);
      set({ previousLoading: false });
      return { success: false, message: "Failed to fetch previous templates" };
    }
  },

  // Get Bookmarked Templates
  getBookmarkedTemplates: async () => {
    try {
      set({ bookmarksLoading: true });
      const { getAuthHeader } = useAuthStore.getState();
      
      const response = await fetch(`${SERVER_API}/templates/bookmarks`, {
        headers: getAuthHeader(),
      });

      const data = await response.json();
      if (data.status === "success") {
        set({
          bookmarkedTemplates: data.data.templates,
          bookmarksLoading: false,
        });
        return { success: true, data: data.data.templates };
      }
      set({ bookmarksLoading: false });
      return { success: false, message: data.message };
    } catch (error) {
      console.error("Get bookmarks error:", error);
      set({ bookmarksLoading: false });
      return { success: false, message: "Failed to fetch bookmarks" };
    }
  },

  // Toggle Bookmark
  toggleBookmark: async (templateId) => {
    try {
      const { getAuthHeader } = useAuthStore.getState();
      
      const response = await fetch(`${SERVER_API}/templates/${templateId}/bookmark`, {
        method: "POST",
        headers: getAuthHeader(),
      });

      const data = await response.json();
      if (data.status === "success") {
        // Update local state
        const { templates, previousTemplates, selectedTemplate } = get();
        
        const updateBookmarkStatus = (template) => {
          if (template.id === templateId || template._id === templateId) {
            return { ...template, isBookmarked: data.data.isBookmarked };
          }
          return template;
        };

        set({
          templates: templates.map(updateBookmarkStatus),
          previousTemplates: previousTemplates.map(updateBookmarkStatus),
          selectedTemplate: selectedTemplate?.id === templateId || selectedTemplate?._id === templateId
            ? { ...selectedTemplate, isBookmarked: data.data.isBookmarked }
            : selectedTemplate,
        });

        return { 
          success: true, 
          isBookmarked: data.data.isBookmarked,
          message: data.data.isBookmarked ? "Added to bookmarks" : "Removed from bookmarks"
        };
      }
      return { success: false, message: data.message };
    } catch (error) {
      console.error("Toggle bookmark error:", error);
      return { success: false, message: "Failed to toggle bookmark" };
    }
  },

  // Clear Selected Template
  clearSelectedTemplate: () => {
    set({ selectedTemplate: null });
  },

  // Admin: Create Template
  createTemplate: async (templateData) => {
    try {
      const { getAuthHeader } = useAuthStore.getState();
      
      const response = await fetch(`${SERVER_API}/templates-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(templateData),
      });

      const data = await response.json();
      if (data.status === "success") {
        get().getAllTemplates(); // Refresh templates list
        return { success: true, message: "Template created successfully" };
      }
      return { success: false, message: data.message };
    } catch (error) {
      console.error("Create template error:", error);
      return { success: false, message: "Failed to create template" };
    }
  },

  // Admin: Update Template
  updateTemplate: async (templateId, templateData) => {
    try {
      const { getAuthHeader } = useAuthStore.getState();
      
      const response = await fetch(`${SERVER_API}/templates-admin/${templateId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(templateData),
      });

      const data = await response.json();
      if (data.status === "success") {
        get().getAllTemplates(); // Refresh templates list
        return { success: true, message: "Template updated successfully" };
      }
      return { success: false, message: data.message };
    } catch (error) {
      console.error("Update template error:", error);
      return { success: false, message: "Failed to update template" };
    }
  },

  // Admin: Delete Template
  deleteTemplate: async (templateId) => {
    try {
      const { getAuthHeader } = useAuthStore.getState();
      
      const response = await fetch(`${SERVER_API}/templates-admin/${templateId}`, {
        method: "DELETE",
        headers: getAuthHeader(),
      });

      const data = await response.json();
      if (data.status === "success") {
        get().getAllTemplates(); // Refresh templates list
        return { success: true, message: "Template deleted successfully" };
      }
      return { success: false, message: data.message };
    } catch (error) {
      console.error("Delete template error:", error);
      return { success: false, message: "Failed to delete template" };
    }
  },

  getAllTemplatesAdmin: async () => {
    try {
      const { getAuthHeader } = useAuthStore.getState();
      
      const response = await fetch(`${SERVER_API}/templates-admin/all`, {
        headers: getAuthHeader(),
      });

      const data = await response.json();
      if (data.status === "success") {
        return { success: true, data: data.data.templates };
      }
      return { success: false, message: data.message };
    } catch (error) {
      console.error("Get all templates admin error:", error);
      return { success: false, message: "Failed to fetch templates" };
    }
  },
}));
