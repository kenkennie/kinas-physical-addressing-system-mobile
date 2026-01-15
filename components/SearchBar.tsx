import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  FlatList,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSearchStore } from "../stores/search.store";
import { useMapStore } from "../stores/map.store";
import { apiService } from "../services/api.service";

export const SearchBar: React.FC = () => {
  const [isFocused, setIsFocused] = useState(false);
  const { query, setQuery, recentSearches, addRecentSearch } = useSearchStore();
  const { setSearchResults, setLoading, setError } = useMapStore();

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

  return (
    <View style={styles.container}>
      <View style={[styles.searchBox, isFocused && styles.searchBoxFocused]}>
        <Ionicons
          name="search"
          size={20}
          color="#9CA3AF"
          style={styles.icon}
        />
        <TextInput
          style={styles.input}
          placeholder="Search by LR No, FR No, or Address"
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={setQuery}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onSubmitEditing={() => handleSearch(query)}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")}>
            <Ionicons
              name="close-circle"
              size={20}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        )}
      </View>

      {isFocused && recentSearches.length > 0 && (
        <View style={styles.recentSearches}>
          <Text style={styles.recentTitle}>Recent Searches</Text>
          <FlatList
            data={recentSearches}
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
                  size={18}
                  color="#6B7280"
                />
                <Text style={styles.recentText}>{item}</Text>
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
    top: 60,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  searchBoxFocused: {
    shadowOpacity: 0.2,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },
  recentSearches: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginTop: 8,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    maxHeight: 300,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  recentText: {
    fontSize: 15,
    color: "#111827",
    marginLeft: 12,
  },
});
