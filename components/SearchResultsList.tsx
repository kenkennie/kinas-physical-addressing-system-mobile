import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Platform,
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
      <FlatList
        data={searchResults}
        keyExtractor={(item) => `result-${item.parcel.gid}`}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.resultItem}
            onPress={() => handleSelectParcel(item.parcel.lr_no)}
            activeOpacity={0.7}
          >
            <View style={styles.resultIcon}>
              <Ionicons
                name="location"
                size={20}
                color="#5F6368"
              />
            </View>

            <View style={styles.resultContent}>
              <Text
                style={styles.resultTitle}
                numberOfLines={1}
              >
                {item.parcel.lr_no}
              </Text>
              <Text
                style={styles.resultSubtitle}
                numberOfLines={1}
              >
                {item.administrative_block?.name || "Nairobi"}
                {item.administrative_block?.constituen &&
                  `, ${item.administrative_block.constituen}`}
              </Text>

              <View style={styles.metaRow}>
                <View style={styles.metaChip}>
                  <Ionicons
                    name="resize-outline"
                    size={12}
                    color="#5F6368"
                  />
                  <Text style={styles.metaText}>
                    {item.parcel.area.toFixed(2)} Ha
                  </Text>
                </View>

                {item.entry_points.length > 0 && (
                  <View style={styles.metaChip}>
                    <Ionicons
                      name="enter-outline"
                      size={12}
                      color="#5F6368"
                    />
                    <Text style={styles.metaText}>
                      {item.entry_points.length} access point
                      {item.entry_points.length > 1 ? "s" : ""}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color="#DADCE0"
            />
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: Platform.OS === "ios" ? 128 : 88,
    left: 12,
    right: 12,
    maxHeight: height * 0.5,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 5,
    overflow: "hidden",
  },
  list: {
    flex: 1,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F3F4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  resultContent: {
    flex: 1,
    gap: 4,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#202124",
    marginBottom: 2,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  resultSubtitle: {
    fontSize: 13,
    color: "#5F6368",
    marginBottom: 4,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F3F4",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: "#5F6368",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  separator: {
    height: 1,
    backgroundColor: "#E8EAED",
    marginLeft: 68,
  },
});
