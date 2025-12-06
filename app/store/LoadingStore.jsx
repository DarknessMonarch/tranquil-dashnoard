"use client";

import { create } from "zustand";

export const useLoadingStore = create((set) => ({
  isLoading: false,

  startLoading: () => set({ isLoading: true }),

  stopLoading: () => set({ isLoading: false }),
}));
