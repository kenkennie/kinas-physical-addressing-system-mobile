import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMapStore } from "../stores/map.store";
import { apiService } from "../services/api.service";

const { height } = Dimensions.get("window");

export const SearchResultsList: React.FC = () => {
  const { searchResults, setSelectedParcel, setSearchResults } = useMapStore();

  if (searchResults.length === 0) return null;

  const handleSelectParcel = async (lr_no: string) => {
    try {
      const details = await apiService.getParcelDetails(lr_no);
      setSelectedParcel(details);
      setSearchResults([]);
    } catch (error) {
      console.error("Error fetching parcel details:", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Search Results ({searchResults.length})
        </Text>
        <TouchableOpacity onPress={() => setSearchResults([])}>
          <Ionicons
            name="close"
            size={24}
            color="#6B7280"
          />
        </TouchableOpacity>
      </View>

      <FlatList
        data={searchResults}
        keyExtractor={(item) => `result-${item.parcel.gid}`}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.resultItem}
            onPress={() => handleSelectParcel(item.parcel.lr_no)}
          >
            <View style={styles.resultIcon}>
              <Ionicons
                name="location"
                size={24}
                color="#3B82F6"
              />
            </View>
            <View style={styles.resultInfo}>
              <Text style={styles.resultTitle}>{item.parcel.lr_no}</Text>
              <Text style={styles.resultSubtitle}>
                {item.administrative_block?.name},{" "}
                {item.administrative_block?.constituen}
              </Text>
              <View style={styles.resultMeta}>
                <View style={styles.metaItem}>
                  <Ionicons
                    name="resize"
                    size={12}
                    color="#6B7280"
                  />
                  <Text style={styles.metaText}>
                    {item.parcel.area.toFixed(2)} Ha
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons
                    name="enter"
                    size={12}
                    color="#6B7280"
                  />
                  <Text style={styles.metaText}>
                    {item.entry_points.length} Entry Points
                  </Text>
                </View>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 140,
    left: 16,
    right: 16,
    maxHeight: height * 0.5,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  resultIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  resultSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 6,
  },
  resultMeta: {
    flexDirection: "row",
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: "#6B7280",
  },
});
