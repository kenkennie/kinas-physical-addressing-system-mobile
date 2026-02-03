// stores/search.store.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface SearchState {
  query: string;
  recentSearches: string[];
  suggestions: string[];
  isSearching: boolean;

  setQuery: (query: string) => void;
  addRecentSearch: (search: string) => void;
  clearRecentSearches: () => void;
  removeRecentSearch: (search: string) => void;
  setSuggestions: (suggestions: string[]) => void;
  setIsSearching: (isSearching: boolean) => void;
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      query: "",
      recentSearches: [],
      suggestions: [],
      isSearching: false,

      setQuery: (query) => set({ query }),

      addRecentSearch: (search) => {
        const { recentSearches } = get();
        // Remove if already exists
        const filtered = recentSearches.filter((s) => s !== search);
        // Add to beginning and keep only last 10
        set({ recentSearches: [search, ...filtered].slice(0, 10) });
      },

      clearRecentSearches: () => set({ recentSearches: [] }),

      removeRecentSearch: (search) => {
        const { recentSearches } = get();
        set({ recentSearches: recentSearches.filter((s) => s !== search) });
      },

      setSuggestions: (suggestions) => set({ suggestions }),

      setIsSearching: (isSearching) => set({ isSearching }),
    }),
    {
      name: "search-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ recentSearches: state.recentSearches }),
    },
  ),
);
