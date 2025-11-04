import React, { useState } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const Header = ({ title = "ClaudyGod" }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <View className="bg-black px-4 py-3 border-b border-gray-800">
      {/* Main Header Row */}
      <View className="flex-row justify-between items-center">
        {/* Column 1: Logo and Name */}
        <View className="flex-row items-center">
          <View className="w-10 h-10 bg-yellow-400 rounded-full justify-center items-center mr-3">
            <Text className="text-black font-bold text-lg">CG</Text>
          </View>
          <Text className="text-white text-xl font-bold">{title}</Text>
        </View>

        {/* Column 2: Hamburger Menu */}
        <TouchableOpacity 
          onPress={toggleMenu}
          className="p-2"
        >
          <MaterialIcons 
            name={isMenuOpen ? "close" : "menu"} 
            size={28} 
            color="#FFD700" 
          />
        </TouchableOpacity>
      </View>

      {/* Dropdown Menu (animated) */}
      {isMenuOpen && (
        <Animated.View className="mt-4 bg-gray-900 rounded-lg p-4">
          <TouchableOpacity className="py-3 border-b border-gray-700">
            <Text className="text-white text-lg">Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity className="py-3 border-b border-gray-700">
            <Text className="text-white text-lg">Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity className="py-3 border-b border-gray-700">
            <Text className="text-white text-lg">Help & Support</Text>
          </TouchableOpacity>
          <TouchableOpacity className="py-3">
            <Text className="text-red-500 text-lg">Logout</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

export default Header;