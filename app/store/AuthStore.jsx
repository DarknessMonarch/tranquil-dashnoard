import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const SERVER_API = process.env.NEXT_PUBLIC_SERVER_API;

const getProfileImageUrl = (profileImage) => {
  if (!profileImage) return null;
  return profileImage.startsWith('http') ? profileImage : `${SERVER_API}${profileImage}`;
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      isAuth: false,
      userId: "",
      username: "",
      email: "",
      phone: "",
      profileImage: "",
      isAdmin: false,
      isSuperAdmin: false,
      isManager: false,
      isSpecialist: false,
      role: "",
      specialistPermissions: [],
      assignedProperties: [],
      currentTier: "starter",
      accessToken: "",
      refreshToken: "",
      emailVerified: false,
      tokenExpirationTime: null,
      refreshTimeoutId: null,
      isInitialized: false,
      fcmToken: "",

      initializeAuth: async () => {
        const state = get();
        if (state.isInitialized) return;
        set({ isInitialized: true });

        if (!state.isAuth || !state.accessToken || !state.refreshToken) {
          return;
        }

        const now = Date.now();
        const tokenExpired = !state.tokenExpirationTime || state.tokenExpirationTime <= now;
        const tokenExpiringSoon = state.tokenExpirationTime && state.tokenExpirationTime - now < 300000;

        if (tokenExpired || tokenExpiringSoon) {
          const refreshSuccess = await get().refreshAccessToken();
          if (!refreshSuccess) {
            get().clearUser();
            return;
          }
        }

        get().scheduleTokenRefresh();
      },

      setUser: (userData) => {
        const tokenExpirationTime = Date.now() + 60 * 60 * 1000;
        set({
          isAuth: true,
          userId: userData.id,
          username: userData.username,
          email: userData.email,
          phone: userData.phone || "",
          profileImage: userData.profileImage || "",
          isAdmin: userData.role === 'admin',
          isSuperAdmin: userData.isSuperAdmin || false,
          isManager: userData.role === 'manager',
          isSpecialist: userData.role === 'specialist',
          role: userData.role || "tenant",
          specialistPermissions: userData.specialistPermissions || [],
          assignedProperties: userData.assignedProperties || [],
          currentTier: userData.currentTier || "starter",
          emailVerified: userData.emailVerified || false,
          accessToken: userData.tokens.accessToken,
          refreshToken: userData.tokens.refreshToken,
          tokenExpirationTime,
          isInitialized: true,
        });
        get().scheduleTokenRefresh();
      },

      updateUser: (userData) => {
        set((state) => ({ ...state, ...userData }));
      },

      clearUser: () => {
        get().cancelTokenRefresh();
        set({
          isAuth: false,
          userId: "",
          username: "",
          email: "",
          phone: "",
          profileImage: "",
          isAdmin: false,
          isSuperAdmin: false,
          isManager: false,
          isSpecialist: false,
          role: "",
          specialistPermissions: [],
          assignedProperties: [],
          currentTier: "starter",
          accessToken: "",
          refreshToken: "",
          emailVerified: false,
          tokenExpirationTime: null,
          isInitialized: false,
          fcmToken: "",
        });
      },

      setFcmToken: (token) => {
        set({ fcmToken: token });
      },

      register: async (userData) => {
        try {
          const response = await fetch(`${SERVER_API}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
          });

          const data = await response.json();
          if (data.status === "success") {
            const userWithTokens = { ...data.data.user, tokens: data.data.tokens };
            get().setUser(userWithTokens);
            return { success: true, message: data.message };
          }
          return { success: false, message: data.message };
        } catch (error) {
          console.error("Register error:", error);
          return { success: false, message: "Registration failed" };
        }
      },

      verifyEmail: async (email, verificationCode) => {
        try {
          const response = await fetch(`${SERVER_API}/auth/verify-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, verificationCode }),
          });

          const data = await response.json();
          if (data.status === "success") {
            set({ emailVerified: true });
            return { success: true, message: data.message };
          }
          return { success: false, message: data.message };
        } catch (error) {
          console.error("Verify email error:", error);
          return { success: false, message: "Email verification failed" };
        }
      },

      resendVerificationCode: async (email) => {
        try {
          const response = await fetch(`${SERVER_API}/auth/resend-verification`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });

          const data = await response.json();
          return { 
            success: data.status === "success", 
            message: data.message 
          };
        } catch (error) {
          console.error("Resend verification error:", error);
          return { 
            success: false, 
            message: "Failed to resend verification code" 
          };
        }
      },

      login: async (email, password) => {
        try {
          const response = await fetch(`${SERVER_API}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

          const data = await response.json();

          if (data.data?.user?.emailVerified === false) {
            return {
              success: false,
              message: "Please verify your email to log in.",
              requiresVerification: true,
              email: data.data.user.email,
            };
          }

          if (data.status === "success" && data.data?.user && data.data?.tokens) {
            const userWithTokens = { ...data.data.user, tokens: data.data.tokens };
            get().setUser(userWithTokens);
            return { success: true, message: data.message };
          }

          return { success: false, message: data.message || "Login failed" };
        } catch (error) {
          console.error("Login error:", error);
          return { success: false, message: "Login failed" };
        }
      },

      logout: async () => {
        get().clearUser();
        return { success: true, message: "Logout successful" };
      },

      refreshAccessToken: async () => {
        try {
          const { refreshToken } = get();
          if (!refreshToken) {
            get().clearUser();
            return false;
          }

          const response = await fetch(`${SERVER_API}/auth/refresh-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
          });

          const data = await response.json();
          if (data.status === "success") {
            const newTokenExpirationTime = Date.now() + 60 * 60 * 1000;
            set({
              accessToken: data.data.accessToken,
              refreshToken: data.data.refreshToken,
              tokenExpirationTime: newTokenExpirationTime,
            });
            get().scheduleTokenRefresh();
            return true;
          } else {
            get().clearUser();
            return false;
          }
        } catch (error) {
          console.error("Refresh token error:", error);
          get().clearUser();
          return false;
        }
      },

      scheduleTokenRefresh: () => {
        const { tokenExpirationTime, refreshTimeoutId, isAuth, accessToken } = get();
        
        if (refreshTimeoutId) {
          clearTimeout(refreshTimeoutId);
          set({ refreshTimeoutId: null });
        }

        if (!isAuth || !accessToken) return;

        const now = Date.now();
        const timeUntilExpiration = tokenExpirationTime - now;

        if (timeUntilExpiration <= 300000) {
          get().refreshAccessToken();
          return;
        }

        const timeUntilRefresh = timeUntilExpiration - 300000;
        const newTimeoutId = setTimeout(() => {
          get().refreshAccessToken();
        }, timeUntilRefresh);

        set({ refreshTimeoutId: newTimeoutId });
      },

      cancelTokenRefresh: () => {
        const { refreshTimeoutId } = get();
        if (refreshTimeoutId) {
          clearTimeout(refreshTimeoutId);
          set({ refreshTimeoutId: null });
        }
      },

      requestPasswordReset: async (email) => {
        try {
          const response = await fetch(`${SERVER_API}/auth/reset-password-request`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });

          const data = await response.json();
          return { success: data.status === "success", message: data.message };
        } catch (error) {
          console.error("Password reset request error:", error);
          return { success: false, message: "Password reset request failed" };
        }
      },

      resetPassword: async (token, newPassword) => {
        try {
          const response = await fetch(`${SERVER_API}/auth/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, newPassword }),
          });

          const data = await response.json();
          return { success: data.status === "success", message: data.message };
        } catch (error) {
          console.error("Reset password error:", error);
          return { success: false, message: "Password reset failed" };
        }
      },

      updateProfile: async (updateData) => {
        try {
          const { accessToken } = get();
          const response = await fetch(`${SERVER_API}/auth/profile`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(updateData),
          });

          const data = await response.json();
          if (data.status === "success") {
            get().updateUser(data.data.user);
            return { success: true, message: "Profile updated successfully" };
          }
          return { success: false, message: data.message };
        } catch (error) {
          console.error("Update profile error:", error);
          return { success: false, message: "Profile update failed" };
        }
      },

      deleteAccount: async () => {
        try {
          const { accessToken } = get();
          const response = await fetch(`${SERVER_API}/auth/account`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          const data = await response.json();
          if (data.status === "success") {
            get().clearUser();
            return { success: true, message: data.message };
          }
          return { success: false, message: data.message };
        } catch (error) {
          console.error("Delete account error:", error);
          return { success: false, message: "Account deletion failed" };
        }
      },

      submitContactForm: async (email, name, subject, message) => {
        try {
          const response = await fetch(`${SERVER_API}/auth/contact`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, name, subject, message }),
          });

          const data = await response.json();
          return { success: data.status === "success", message: data.message };
        } catch (error) {
          console.error("Contact form error:", error);
          return { success: false, message: "Failed to submit contact form" };
        }
      },

      uploadProfilePicture: async (file) => {
        try {
          const { accessToken } = get();
          
          if (!file.type.startsWith('image/')) {
            return { success: false, message: 'Please select an image file' };
          }

          if (file.size > 5 * 1024 * 1024) {
            return { success: false, message: 'Image size must be less than 5MB' };
          }

          const formData = new FormData();
          formData.append('profilePicture', file);

          const response = await fetch(`${SERVER_API}/auth/upload-profile-picture`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            body: formData,
          });

          const data = await response.json();
          if (data.status === "success") {
            set({ profileImage: data.data.profileImage });
            return { success: true, message: data.message || "Profile picture updated successfully" };
          }
          return { success: false, message: data.message };
        } catch (error) {
          console.error("Upload profile picture error:", error);
          return { success: false, message: "Failed to upload profile picture" };
        }
      },

      getProfileImageUrl: () => {
        const { profileImage } = get();
        return getProfileImageUrl(profileImage);
      },

      getAuthHeader: () => {
        const { accessToken } = get();
        return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      },
    }),
    {
      name: "tranquil-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isAuth: state.isAuth,
        userId: state.userId,
        username: state.username,
        email: state.email,
        phone: state.phone,
        profileImage: state.profileImage,
        isAdmin: state.isAdmin,
        isSuperAdmin: state.isSuperAdmin,
        isManager: state.isManager,
        isSpecialist: state.isSpecialist,
        role: state.role,
        specialistPermissions: state.specialistPermissions,
        assignedProperties: state.assignedProperties,
        currentTier: state.currentTier,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        emailVerified: state.emailVerified,
        tokenExpirationTime: state.tokenExpirationTime,
      }),
    }
  )
);