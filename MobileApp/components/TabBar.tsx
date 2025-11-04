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
  className="flex-row bg-black border-t border-gray-700 rounded-full absolute left-0 right-0 mx-4"
  style={{
    bottom: 8, // Add some bottom margin
    height: 60,
    paddingTop: 5,
  }}
>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const config = (tabConfig as any)[route.name];
        
        if (!config) return null;

        const onPress = () => navigation.navigate(route.name);

        // Center Play Button - Using CustomButton for the play button
        if (config.isCenter) {
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              className="flex-1 items-center justify-center"
              style={{ marginTop: -45 }}
            >
              <View className="w-[65px] h-[65px] rounded-full bg-purple-900 justify-center items-center shadow-2xl shadow-black/50 ">
                <MaterialIcons name="play-arrow" size={34} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          );
        }

        // Regular Tabs - Using CustomText for labels
        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            className="flex-1 items-center justify-center"
            style={{ paddingTop: 2 }}
          >
            <View className="items-center">
              <MaterialIcons 
                name={config.icon} 
                size={24} 
                color={isFocused ? "#FFFFFF" : "#888888"} 
              />
              <CustomText
                variant="caption"
                className={`mt-1 ${
                  isFocused ? "text-white" : "text-gray-300"
                }`}
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