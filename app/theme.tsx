import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";

export interface Theme {
  background: string;
  text: string;
  primary: string;
  secondary: string;
}

const lightTheme: Theme = {
  background: "#ffffff",
  text: "#000000",
  primary: "#007bff",
  secondary: "#6c757d",
};

const darkTheme: Theme = {
  background: "#000000",
  text: "#ffffff",
  primary: "#007bff",
  secondary: "#6c757d",
};

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemScheme === "dark");

  useEffect(() => {
    setIsDark(systemScheme === "dark");
  }, [systemScheme]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};
