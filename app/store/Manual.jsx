import { create } from "zustand";

export const useManualStore = create((set) => ({
  showManual: false,
  toggleManual: () => set((state) => ({ showManual: !state.showManual })),
}));

