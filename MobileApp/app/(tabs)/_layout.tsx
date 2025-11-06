// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import TabBar from "../../components/TabBar";
import AnimatedHeader from "../../components/AnimatedHeader";
import { View } from "react-native";

export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      {/* Header with built-in safe area handling */}
      <AnimatedHeader />
      
      {/* Tabs content */}
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
          }}
          tabBar={(props) => <TabBar {...props} />}
        >
          <Tabs.Screen name="home" />
          <Tabs.Screen name="search" />
          <Tabs.Screen name="PlaySection" />
          <Tabs.Screen name="Favourites" />
          <Tabs.Screen name="Settings" />
        </Tabs>
      </View>
    </View>
  );
}