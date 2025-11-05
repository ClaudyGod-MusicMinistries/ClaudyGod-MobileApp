/* eslint-disable @typescript-eslint/no-require-imports */
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Pressable,
  Image,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { CustomText } from "./CustomText";

interface AnimatedHeaderProps {
  title?: string;
  onMenuToggle?: (isOpen: boolean) => void;
  onPressHome?: () => void;
}

const AnimatedHeader = ({

  onMenuToggle,
  onPressHome,
}: AnimatedHeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-200)).current;

  const toggleMenu = () => {
    if (isMenuOpen) {
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setIsMenuOpen(false);
        onMenuToggle?.(false);
      });
    } else {
      setIsMenuOpen(true);
      onMenuToggle?.(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const menuItems = [
    { label: "Profile", icon: "person", action: () => console.log("Profile") },
    { label: "Settings", icon: "settings", action: () => console.log("Settings") },
    { label: "Favorites", icon: "favorite", action: () => console.log("Favorites") },
    { label: "Help", icon: "help", action: () => console.log("Help") },
    { label: "Logout", icon: "logout", color: "text-red-500", action: () => console.log("Logout") },
  ];

  return (
   <View className="bg-transparent border-b border-gray-300">


      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-3">

        {/* ✅ Logo + Home button only */}
        <Pressable
          onPress={onPressHome}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="flex-row items-center"
        >
  <View className="flex-row items-center">
  <View className="w-8 h-8 rounded-full justify-center items-center border border-gray-100">
    <Image 
      source={require("../assets/images/ClaudyGoLogo.webp")}
      className="w-7 h-7 rounded-full"
      resizeMode="cover"
    />
  </View>
  
  {/* Very thin vertical green line placed close to logo */}
  <View className="h-6 w-[0.5px] bg-gray-700 mx-2" />
  
  <View className="flex-col">
    <CustomText className="text-black">ClaudyGod</CustomText>
    <Text className="text-purple-800 text-sm">Music & Ministries</Text>
  </View>
</View>
        </Pressable>

        {/* ✅ Menu button only toggles menu */}
        <TouchableOpacity
          onPress={toggleMenu}
          className="w-10 h-10 justify-center items-center"
        >
        <MaterialIcons
  name={isMenuOpen ? "close" : "menu"}
  size={20}
  color="#8B5CF6" // Purple color
/>
        </TouchableOpacity>
      </View>

      {/* ✅ Dropdown Menu */}
      <Animated.View
        pointerEvents={isMenuOpen ? "auto" : "none"} // stop touches passing through!
        style={{
          transform: [{ translateY: slideAnim }],
          opacity: slideAnim.interpolate({
            inputRange: [-200, 0],
            outputRange: [0, 1],
          }),
        }}
        className="absolute top-full left-0 right-0 bg-gray-900 z-50"
      >
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => {
              item.action();
              toggleMenu();
            }}
            className="flex-row items-center px-6 py-4 border-b border-gray-800 active:bg-gray-800"
          >
            <MaterialIcons name={item.icon} size={22} color="#fff" />
            <Text className={`ml-4 text-white text-lg ${item.color || ""}`}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </View>
  );
};

export default AnimatedHeader;
