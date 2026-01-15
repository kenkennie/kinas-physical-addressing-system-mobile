import React from "react";
import MapboxGL from "@rnmapbox/maps";
import { MAPBOX_CONFIG } from "./config/mapbox.config";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ThemeProvider } from "./app/theme";
import { HomeScreen } from "./app/screens/HomeScreen";

const Stack = createNativeStackNavigator();
MapboxGL.setAccessToken(MAPBOX_CONFIG.ACCESS_TOKEN);
export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Home">
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
          <StatusBar style="dark" />
        </NavigationContainer>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
