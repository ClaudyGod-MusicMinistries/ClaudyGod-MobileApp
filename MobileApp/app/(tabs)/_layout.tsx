import { Tabs } from "expo-router";
import TabBar from "../../components/TabBar";
import AnimatedHeader from "../../components/AnimatedHeader";
import { useState } from "react";

export default function TabsLayout() {
  const [,setIsMenuOpen] = useState(false);

  const getHeaderTitle = (routeName: string): string => {
    const titles: Record<string, string> = {
      home: "Home",
      search: "Search",
      PlaySection: "Play",
      Favourites: "My Favorites",
      Settings: "Settings"
    };
    return titles[routeName] || "ClaudyGod";
  };

  const handleMenuToggle = (open: boolean) => {
    setIsMenuOpen(open);
  };

  return (
    <Tabs
      screenOptions={{
        header: ({ route }) => (
          <AnimatedHeader 
            title={getHeaderTitle(route.name)} 
            onMenuToggle={handleMenuToggle}
          />
        ),
      }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="PlaySection" />
      <Tabs.Screen name="Favourites" />
      <Tabs.Screen name="Settings" />
    </Tabs>
  );
}