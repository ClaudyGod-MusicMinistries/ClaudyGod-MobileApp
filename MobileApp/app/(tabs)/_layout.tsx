// app/(tabs)/_layout.tsx
import { Tabs, useRouter } from "expo-router";
import TabBar from "../../components/TabBar";
import AnimatedHeader from "../../components/AnimatedHeader";
import { View } from "react-native";
import { useColorScheme } from "../../util/colorScheme";
import { colors } from "../../constants/color";

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const currentColors = colors[colorScheme];
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: currentColors.background }}>
      {/* Header with built-in safe area handling */}
      <AnimatedHeader
        onPressHome={() => router.push('/home')}
        onPressSearch={() => router.push('/(tabs)/search')}
        onPressProfile={() => router.push('/profile')}
      />
      
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
