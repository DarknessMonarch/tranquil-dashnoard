import { create } from 'zustand';

export const useDrawerStore = create((set) => ({
    isOpen: false,
    toggleDrawer: () => set((state) => ({ isOpen: !state.isOpen })),
    
}));