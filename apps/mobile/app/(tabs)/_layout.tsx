import { Tabs } from 'expo-router';
import { View } from 'react-native';
import TabBar from '../../components/TabBar';
import { useColorScheme } from '../../util/colorScheme';
import { colors } from '../../constants/color';

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const currentColors = colors[colorScheme] ?? colors.dark;

  return (
    <View style={{ flex: 1, backgroundColor: currentColors.background }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: currentColors.background },
        }}
        tabBar={(props) => <TabBar {...props} />}
      >
        <Tabs.Screen name="home" />
        <Tabs.Screen name="player" />
        <Tabs.Screen name="videos" />
        <Tabs.Screen name="live" />
        <Tabs.Screen name="library" />
        <Tabs.Screen name="search" options={{ href: null }} />
        <Tabs.Screen name="settings" options={{ href: null }} />
        <Tabs.Screen name="PlaySection" options={{ href: null }} />
        <Tabs.Screen name="Favourites" options={{ href: null }} />
      </Tabs>
    </View>
  );
}
