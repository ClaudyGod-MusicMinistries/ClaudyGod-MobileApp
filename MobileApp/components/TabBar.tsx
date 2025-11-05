/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { View, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { CustomText } from "../components/CustomText";

const TabBar = ({ state, navigation }: BottomTabBarProps) => {
  
  const tabConfig = {
    home: { icon: "home" as const, label: "Home" },
    search: { icon: "search" as const, label: "Search" },
    Settings: { icon: "settings" as const, label: "Settings" },
    Favourites: { icon: "favorite" as const, label: "Library" },
    PlaySection: { icon: "play-arrow" as const, label: "Play", isCenter: true },
  };

  return (
    <View
      className="flex-row bg-black border-t border-gray-800 rounded-full absolute left-0 right-0 mx-4"
      style={{
        bottom: 8,
        height: 56, // Slightly reduced height
        paddingTop: 4,
      }}
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const config = (tabConfig as any)[route.name];
        
        if (!config) return null;

        const onPress = () => navigation.navigate(route.name);

        // Center Play Button
        if (config.isCenter) {
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              className="flex-1 items-center justify-center"
              style={{ marginTop: -40 }} // Reduced negative margin
            >
              <View className="w-[58px] h-[58px] rounded-full bg-purple-700 justify-center items-center shadow-lg shadow-black/40 border border-purple-500">
                <MaterialIcons name="play-arrow" size={26} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          );
        }

        // Regular Tabs
        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            className="flex-1 items-center justify-center"
            style={{ paddingTop: 4 }}
          >
            <View className="items-center">
              <MaterialIcons 
                name={config.icon} 
                size={22} // Reduced from 24 to 22
                color={isFocused ? "#FFFFFF" : "#9CA3AF"} // Better gray color
              />
              <CustomText
                variant="caption"
                className={`mt-1 ${
                  isFocused ? "text-white font-medium" : "text-gray-400"
                }`}
                style={{ fontSize: 11 }} // Smaller, more refined font size
              >
                {config.label}
              </CustomText>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default TabBar;