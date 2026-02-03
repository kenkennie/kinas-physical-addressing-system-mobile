// components/SearchBar.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  FlatList,
  Keyboard,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSearchStore } from "../stores/search.store";
import { useMapStore } from "../stores/map.store";
import { apiService } from "../services/api.service";
import { debounce } from "lodash"; // Install: npm install lodash @types/lodash

interface SearchBarProps {
  showDirections?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  showDirections = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [focusedInput, setFocusedInput] = useState;
  "origin" | "destination" | (null > null);

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

  const { setSearchResults, setLoading, setError, activeRoute } = useMapStore();

  const [originText, setOriginText] = useState("Your location");
  const [destinationText, setDestinationText] = useState("");

  // Debounced search for auto-suggestions
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

  // Trigger suggestions when query changes
  useEffect(() => {
    if (isFocused) {
      fetchSuggestions(query);
    }
    return () => {
      fetchSuggestions.cancel();
    };
  }, [query, isFocused]);

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
      addRecentSearch(searchQuery);
      setIsFocused(false);
      setQuery("");
      setSuggestions([]);
    } catch (error) {
      setError("Failed to search. Please try again.");
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  const handleSelectRecent = (recent: string) => {
    setQuery(recent);
    handleSearch(recent);
  };

  const renderDropdownContent = () => {
    // Show suggestions if user is typing
    if (query.length >= 2 && suggestions.length > 0) {
      return (
        <View style={styles.dropdownSection}>
          <Text style={styles.dropdownHeader}>Suggestions</Text>
          <FlatList
            data={suggestions}
            keyExtractor={(item, index) => `suggestion-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => handleSelectSuggestion(item)}
              >
                <Ionicons
                  name="search"
                  size={20}
                  color="#5F6368"
                />
                <Text style={styles.dropdownText}>{item}</Text>
                <TouchableOpacity
                  style={styles.arrowButton}
                  onPress={() => setQuery(item)}
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

    // Show recent searches
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
            keyExtractor={(item, index) => `recent-${index}`}
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
                    onPress={() => setQuery(item)}
                  >
                    <Ionicons
                      name="arrow-up-outline"
                      size={18}
                      color="#5F6368"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => removeRecentSearch(item)}
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

  // Show directions-style search when navigating
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

  // Regular search bar
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

      {/* Dropdown with suggestions or recent searches */}
      {isFocused && (suggestions.length > 0 || recentSearches.length > 0) && (
        <View style={styles.dropdown}>{renderDropdownContent()}</View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: Platform.OS === "ios" ? 70 : 50,
    left: 12,
    right: 12,
    zIndex: 100,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 3,
  },
  searchBoxFocused: {
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  menuButton: {
    padding: 8,
    marginRight: 4,
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F3F4",
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#202124",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  clearButton: {
    padding: 4,
  },
  micButton: {
    padding: 8,
    marginLeft: 4,
  },
  // Directions
  directionsBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    marginRight: 4,
  },
  inputsContainer: {
    flex: 1,
    paddingVertical: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  originDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1A73E8",
    marginRight: 12,
  },
  destinationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EA4335",
    marginRight: 12,
  },
  directionsInput: {
    flex: 1,
    fontSize: 15,
    color: "#202124",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    paddingVertical: 4,
  },
  dividerLine: {
    height: 1,
    backgroundColor: "#E8EAED",
    marginLeft: 28,
    marginRight: 8,
  },
  moreButton: {
    padding: 8,
    marginLeft: 4,
  },
  // Dropdown
  dropdown: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: 400,
  },
  dropdownSection: {
    paddingVertical: 8,
  },
  dropdownHeader: {
    fontSize: 12,
    fontWeight: "600",
    color: "#5F6368",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  clearText: {
    fontSize: 12,
    color: "#1A73E8",
    fontWeight: "500",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F3F4",
  },
  dropdownText: {
    flex: 1,
    fontSize: 15,
    color: "#202124",
    marginLeft: 12,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  recentActions: {
    flexDirection: "row",
    gap: 8,
  },
  arrowButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
});
