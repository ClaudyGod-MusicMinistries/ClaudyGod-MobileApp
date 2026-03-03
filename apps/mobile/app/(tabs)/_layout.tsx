import { Tabs } from 'expo-router';
import { View } from 'react-native';
import TabBar from '../../components/TabBar';
import { useColorScheme } from '../../util/colorScheme';
import { colors } from '../../constants/color';
import { useRequireMobileSession } from '../../hooks/useRequireMobileSession';

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const currentColors = colors[colorScheme] ?? colors.dark;
  const isAuthorized = useRequireMobileSession();

  if (!isAuthorized) {
    return <View style={{ flex: 1, backgroundColor: currentColors.background }} />;
  }

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
        <Tabs.Screen name="videos" />
        <Tabs.Screen name="PlaySection" />
        <Tabs.Screen name="library" />
        <Tabs.Screen name="search" />
      </Tabs>
    </View>
  );
}
