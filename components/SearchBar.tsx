import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  FlatList,
  Keyboard,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSearchStore } from "../stores/search.store";
import { useMapStore } from "../stores/map.store";
import { apiService } from "../services/api.service";

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
  const { query, setQuery, recentSearches, addRecentSearch } = useSearchStore();
  const { setSearchResults, setLoading, setError, activeRoute, userLocation } =
    useMapStore();

  const [originText, setOriginText] = useState("Your location");
  const [destinationText, setDestinationText] = useState("");

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const results = await apiService.searchAddress({
        lr_no: searchQuery,
        physical_address: searchQuery,
      });

      setSearchResults(results);
      addRecentSearch(searchQuery);
      Keyboard.dismiss();
      setIsFocused(false);
    } catch (error) {
      setError("Failed to search. Please try again.");
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Show directions-style search when navigating
  if (showDirections || activeRoute) {
    return (
      <View style={styles.container}>
        <View style={styles.directionsBox}>
          {/* Back button */}
          <TouchableOpacity style={styles.backButton}>
            <Ionicons
              name="arrow-back"
              size={24}
              color="#5F6368"
            />
          </TouchableOpacity>

          <View style={styles.inputsContainer}>
            {/* Origin input */}
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

            {/* Destination input */}
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

        {/* Recent searches dropdown */}
        {focusedInput && recentSearches.length > 0 && (
          <View style={styles.dropdown}>
            <FlatList
              data={recentSearches.slice(0, 5)}
              keyExtractor={(item, index) => `${item}-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.recentItem}
                  onPress={() => {
                    if (focusedInput === "destination") {
                      setDestinationText(item);
                      handleSearch(item);
                    }
                  }}
                >
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color="#5F6368"
                  />
                  <Text style={styles.recentText}>{item}</Text>
                  <TouchableOpacity style={styles.arrowButton}>
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
        )}
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
            placeholder="Search parcels"
            placeholderTextColor="#80868B"
            value={query}
            onChangeText={setQuery}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            onSubmitEditing={() => handleSearch(query)}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => setQuery("")}
              style={styles.clearButton}
            >
              <Ionicons
                name="close"
                size={20}
                color="#5F6368"
              />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.micButton}>
          <Ionicons
            name="mic"
            size={20}
            color="#5F6368"
          />
        </TouchableOpacity>
      </View>

      {/* Recent searches dropdown */}
      {isFocused && recentSearches.length > 0 && (
        <View style={styles.dropdown}>
          <FlatList
            data={recentSearches.slice(0, 5)}
            keyExtractor={(item, index) => `${item}-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.recentItem}
                onPress={() => {
                  setQuery(item);
                  handleSearch(item);
                }}
              >
                <Ionicons
                  name="time-outline"
                  size={20}
                  color="#5F6368"
                />
                <Text style={styles.recentText}>{item}</Text>
                <TouchableOpacity style={styles.arrowButton}>
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
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: Platform.OS === "ios" ? 70 : 50, // More space from status bar
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
  // Directions-style search
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
  dropdown: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: 300,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E8EAED",
  },
  recentText: {
    flex: 1,
    fontSize: 16,
    color: "#202124",
    marginLeft: 16,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  arrowButton: {
    padding: 4,
  },
});
