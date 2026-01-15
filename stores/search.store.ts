import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

interface SearchState {
  query: string;
  recentSearches: string[];

  setQuery: (query: string) => void;
  addRecentSearch: (search: string) => void;
  clearRecentSearches: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  query: "",
  recentSearches: [],

  setQuery: (query) => set({ query }),
  addRecentSearch: (search) => {
    const recent = get().recentSearches;
    const filtered = recent.filter((s) => s !== search);
    set({ recentSearches: [search, ...filtered].slice(0, 10) });
    AsyncStorage.setItem(
      "recent_searches",
      JSON.stringify([search, ...filtered].slice(0, 10))
    );
  },
  clearRecentSearches: () => {
    set({ recentSearches: [] });
    AsyncStorage.removeItem("recent_searches");
  },
}));
