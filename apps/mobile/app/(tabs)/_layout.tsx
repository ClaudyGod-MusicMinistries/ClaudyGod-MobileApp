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
        initialRouteName="home"
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: currentColors.background },
        }}
        tabBar={(props) => <TabBar {...props} />}
      >
        <Tabs.Screen name="home" options={{ tabBarLabel: 'Home' }} />
        <Tabs.Screen name="player" options={{ tabBarLabel: 'Music' }} />
        <Tabs.Screen name="videos" options={{ tabBarLabel: 'Videos' }} />
        <Tabs.Screen name="live" options={{ tabBarLabel: 'Live' }} />
        <Tabs.Screen name="library" options={{ tabBarLabel: 'Library' }} />
        <Tabs.Screen name="search" options={{ href: null }} />
        <Tabs.Screen name="settings" options={{ href: null }} />
        <Tabs.Screen name="PlaySection" options={{ href: null }} />
        <Tabs.Screen name="Favourites" options={{ href: null }} />
      </Tabs>
    </View>
  );
}
