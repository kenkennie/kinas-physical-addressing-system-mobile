import { Text, View, Switch } from "react-native";
import { useTheme } from "./theme";

export default function Index() {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: theme.background,
      }}
    >
      <Text style={{ color: theme.text }}>
        Edit app/index.tsx to edit this screen.
      </Text>
      <View
        style={{ flexDirection: "row", alignItems: "center", marginTop: 20 }}
      >
        <Text style={{ color: theme.text, marginRight: 10 }}>Dark Mode</Text>
        <Switch
          value={isDark}
          onValueChange={toggleTheme}
        />
      </View>
    </View>
  );
}
