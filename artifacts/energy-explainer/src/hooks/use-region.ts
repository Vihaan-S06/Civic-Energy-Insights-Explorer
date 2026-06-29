import { create } from "zustand";

interface RegionState {
  region: string;
  setRegion: (region: string) => void;
}

export const useRegionStore = create<RegionState>((set) => ({
  region: "US", // Default to national
  setRegion: (region) => set({ region }),
}));
