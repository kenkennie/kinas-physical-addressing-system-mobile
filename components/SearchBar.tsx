// FILE PATH: components/SearchBar.tsx

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  FlatList,
  Keyboard,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSearchStore, SuggestionItem } from "../stores/search.store";
import { useMapStore } from "../stores/map.store";
import { apiService } from "../services/api.service";
import { debounce } from "lodash";

interface SearchBarProps {
  showDirections?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  showDirections = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [focusedInput, setFocusedInput] = useState<
    "origin" | "destination" | null
  >(null);

  const {
    query,
    setQuery,
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
    suggestions,
    setSuggestions,
    isSearching,
    setIsSearching,
  } = useSearchStore();

  const {
    setSelectedParcel,
    setSearchResults,
    setLoading,
    setError,
    activeRoute,
  } = useMapStore();

  const [originText, setOriginText] = useState("Your location");
  const [destinationText, setDestinationText] = useState("");

  // ──────────────────────────────────────────────────────────────────────────
  // Debounced auto-suggestions — now returns rich objects
  // ──────────────────────────────────────────────────────────────────────────
  const fetchSuggestions = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim() || searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        setIsSearching(true);
        const results = await apiService.getSuggestions(searchQuery);

        setSuggestions(results);
      } catch (error) {
        console.error("Suggestions error:", error);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [],
  );

  useEffect(() => {
    if (isFocused) {
      fetchSuggestions(query);
    }
    return () => {
      fetchSuggestions.cancel();
    };
  }, [query, isFocused]);

  // ──────────────────────────────────────────────────────────────────────────
  // Search execution — keyboard enter or suggestion tap
  // ──────────────────────────────────────────────────────────────────────────
  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setError(null);
      Keyboard.dismiss();

      const results = await apiService.searchAddress({
        lr_no: searchQuery,
      });

      setSearchResults(results);

      if (results && results.length > 0) {
        setSelectedParcel(results[0]);
        addRecentSearch(searchQuery);
      } else {
        Alert.alert(
          "No Results",
          `No parcel found for "${searchQuery}". Please check the LR number and try again.`,
        );
      }

      setIsFocused(false);
      setQuery("");
      setSuggestions([]);
    } catch (error) {
      setError("Failed to search. Please try again.");
      console.error("Search error:", error);
      Alert.alert(
        "Search Error",
        "Could not complete the search. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Suggestion selected → populate search box, then search
  // ──────────────────────────────────────────────────────────────────────────
  const handleSelectSuggestion = (suggestion: SuggestionItem) => {
    setQuery(suggestion.lr_no);
    handleSearch(suggestion.lr_no);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Recent search selected
  // ──────────────────────────────────────────────────────────────────────────
  const handleSelectRecent = (recent: string) => {
    console.log("===============handleSelectRecent=====================");
    console.log(recent);
    console.log("==============handleSelectRecent======================");
    setQuery(recent);
    handleSearch(recent);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Dropdown rendering — rich suggestion cards
  // ──────────────────────────────────────────────────────────────────────────
  const renderDropdownContent = () => {
    // Rich suggestions
    if (query.length >= 2 && suggestions.length > 0) {
      return (
        <View style={styles.dropdownSection}>
          <Text style={styles.dropdownHeader}>Suggestions</Text>
          <FlatList
            data={suggestions}
            keyExtractor={(item, index) => `suggestion-${index}-${item.lr_no}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionCard}
                onPress={() => handleSelectSuggestion(item)}
              >
                <View style={styles.suggestionLeft}>
                  <View style={styles.suggestionIconContainer}>
                    <Ionicons
                      name="location"
                      size={20}
                      color="#1A73E8"
                    />
                  </View>

                  <View style={styles.suggestionContent}>
                    <Text style={styles.suggestionLrNo}>
                      {item.short_name || "N/A"}/
                      {item.lr_no.split("/")[1] || item.lr_no}
                    </Text>

                    <View style={styles.suggestionMeta}>
                      {item.constituency && (
                        <>
                          <Ionicons
                            name="business-outline"
                            size={13}
                            color="#5F6368"
                          />
                          <Text style={styles.suggestionMetaText}>
                            {item.constituency}
                          </Text>
                        </>
                      )}
                      <Text style={styles.suggestionMetaText}>•</Text>
                      <Text style={styles.suggestionMetaText}></Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.arrowButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    setQuery(item.lr_no);
                  }}
                >
                  <Ionicons
                    name="arrow-up-outline"
                    size={18}
                    color="#5F6368"
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            )}
          />
        </View>
      );
    }

    // Recent searches
    if (recentSearches.length > 0) {
      return (
        <View style={styles.dropdownSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.dropdownHeader}>Recent searches</Text>
            <TouchableOpacity onPress={clearRecentSearches}>
              <Text style={styles.clearText}>Clear all</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={recentSearches}
            keyExtractor={(item, index) => `recent-${index}-${item}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => handleSelectRecent(item)}
              >
                <Ionicons
                  name="time-outline"
                  size={20}
                  color="#5F6368"
                />
                <Text style={styles.dropdownText}>{item}</Text>
                <View style={styles.recentActions}>
                  <TouchableOpacity
                    style={styles.arrowButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      setQuery(item);
                    }}
                  >
                    <Ionicons
                      name="arrow-up-outline"
                      size={18}
                      color="#5F6368"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      removeRecentSearch(item);
                    }}
                  >
                    <Ionicons
                      name="close"
                      size={18}
                      color="#5F6368"
                    />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      );
    }

    return null;
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Directions mode
  // ──────────────────────────────────────────────────────────────────────────
  if (showDirections || activeRoute) {
    return (
      <View style={styles.container}>
        <View style={styles.directionsBox}>
          <TouchableOpacity style={styles.backButton}>
            <Ionicons
              name="arrow-back"
              size={24}
              color="#5F6368"
            />
          </TouchableOpacity>

          <View style={styles.inputsContainer}>
            <View style={styles.inputRow}>
              <View style={styles.originDot} />
              <TextInput
                style={styles.directionsInput}
                placeholder="Your location"
                placeholderTextColor="#80868B"
                value={originText}
                onChangeText={setOriginText}
                onFocus={() => setFocusedInput("origin")}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

            <View style={styles.dividerLine} />

            <View style={styles.inputRow}>
              <View style={styles.destinationDot} />
              <TextInput
                style={styles.directionsInput}
                placeholder="Choose destination"
                placeholderTextColor="#80868B"
                value={destinationText}
                onChangeText={setDestinationText}
                onFocus={() => setFocusedInput("destination")}
                onBlur={() => setFocusedInput(null)}
                onSubmitEditing={() => handleSearch(destinationText)}
                returnKeyType="search"
              />
              {destinationText.length > 0 && (
                <TouchableOpacity onPress={() => setDestinationText("")}>
                  <Ionicons
                    name="close"
                    size={20}
                    color="#5F6368"
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <TouchableOpacity style={styles.moreButton}>
            <Ionicons
              name="ellipsis-vertical"
              size={20}
              color="#5F6368"
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Regular search bar
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={[styles.searchBox, isFocused && styles.searchBoxFocused]}>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons
            name="menu"
            size={24}
            color="#5F6368"
          />
        </TouchableOpacity>

        <View style={styles.inputContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#5F6368"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Search by LR number (e.g., 209/12345)"
            placeholderTextColor="#80868B"
            value={query}
            onChangeText={setQuery}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            onSubmitEditing={() => handleSearch(query)}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {isSearching ? (
            <ActivityIndicator
              size="small"
              color="#5F6368"
            />
          ) : query.length > 0 ? (
            <TouchableOpacity
              onPress={() => {
                setQuery("");
                setSuggestions([]);
              }}
              style={styles.clearButton}
            >
              <Ionicons
                name="close"
                size={20}
                color="#5F6368"
              />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity style={styles.micButton}>
          <Ionicons
            name="mic"
            size={20}
            color="#5F6368"
          />
        </TouchableOpacity>
      </View>

      {isFocused && (suggestions.length > 0 || recentSearches.length > 0) && (
        <View style={styles.dropdown}>{renderDropdownContent()}</View>
      )}
    </View>
  );
};

// ──────────────────────────────────────────────────────────────────────────
// Styles
// ──────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    padding: 12,
    paddingTop: 56,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingHorizontal: 12,
    height: 52,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  searchBoxFocused: { shadowOpacity: 0.2 },
  menuButton: { padding: 6 },
  inputContainer: { flex: 1, flexDirection: "row", alignItems: "center" },
  searchIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: "#202124" },
  clearButton: { padding: 4 },
  micButton: { padding: 6 },

  dropdown: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 5,
    overflow: "hidden",
  },
  dropdownSection: { paddingVertical: 8 },
  dropdownHeader: {
    fontSize: 12,
    fontWeight: "600",
    color: "#5F6368",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },

  // Rich suggestion card
  suggestionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F3F4",
  },
  suggestionLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  suggestionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8F0FE",
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionContent: {
    flex: 1,
    gap: 4,
  },
  suggestionLrNo: {
    fontSize: 15,
    fontWeight: "600",
    color: "#202124",
  },
  suggestionMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  suggestionMetaText: {
    fontSize: 13,
    color: "#5F6368",
  },

  // Simple dropdown item (recent searches)
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownText: { flex: 1, fontSize: 14, color: "#202124" },
  arrowButton: { padding: 4 },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  clearText: { fontSize: 13, color: "#1A73E8", fontWeight: "500" },
  recentActions: { flexDirection: "row", gap: 4 },
  deleteButton: { padding: 4 },

  // Directions mode
  directionsBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 5,
  },
  backButton: { padding: 4 },
  inputsContainer: { flex: 1 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  originDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#34A853",
  },
  destinationDot: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: "#EA4335",
  },
  directionsInput: {
    flex: 1,
    fontSize: 14,
    color: "#202124",
    paddingVertical: 6,
  },
  dividerLine: { height: 1, backgroundColor: "#E8EAED", marginLeft: 22 },
  moreButton: { padding: 4 },
});
