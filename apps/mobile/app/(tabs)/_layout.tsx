import { Tabs } from 'expo-router';
import { View } from 'react-native';

import TabBar from '../../components/TabBar';
import { useAppTheme } from '../../util/colorScheme';

export default function TabsLayout() {
  const theme = useAppTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Tabs
        initialRouteName="home"
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: theme.colors.background },
        }}
        tabBar={(props) => <TabBar {...props} />}
      >
        <Tabs.Screen name="home" />
        <Tabs.Screen name="player" />
        <Tabs.Screen name="videos" />
        <Tabs.Screen name="library" />
        <Tabs.Screen name="settings" />
        <Tabs.Screen name="live" options={{ href: null }} />
        <Tabs.Screen name="search" options={{ href: null }} />
        <Tabs.Screen name="Favourites" options={{ href: null }} />
        <Tabs.Screen name="PlaySection" options={{ href: null }} />
      </Tabs>
    </View>
  );
}
