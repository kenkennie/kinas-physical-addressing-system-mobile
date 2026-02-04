import { SuggestionItem } from "@/types/address.types";
import { create } from "zustand";

interface SearchState {
  query: string;
  setQuery: (query: string) => void;

  recentSearches: string[];
  addRecentSearch: (search: string) => void;
  removeRecentSearch: (search: string) => void;
  clearRecentSearches: () => void;

  suggestions: SuggestionItem[];
  setSuggestions: (suggestions: SuggestionItem[]) => void;

  isSearching: boolean;
  setIsSearching: (isSearching: boolean) => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  query: "",
  setQuery: (query) => set({ query }),

  recentSearches: [],
  addRecentSearch: (search) =>
    set((state) => {
      const filtered = state.recentSearches.filter((s) => s !== search);
      return { recentSearches: [search, ...filtered].slice(0, 10) };
    }),
  removeRecentSearch: (search) =>
    set((state) => ({
      recentSearches: state.recentSearches.filter((s) => s !== search),
    })),
  clearRecentSearches: () => set({ recentSearches: [] }),

  suggestions: [],
  setSuggestions: (suggestions) => set({ suggestions }),

  isSearching: false,
  setIsSearching: (isSearching) => set({ isSearching }),
}));
