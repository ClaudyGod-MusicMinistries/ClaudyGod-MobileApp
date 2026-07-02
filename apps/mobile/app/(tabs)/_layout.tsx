import { Tabs } from 'expo-router';
import { View } from 'react-native';

import TabBar from '../../components/TabBar';
import { makeStyles } from '../../styles/makeStyles';

const useStyles = makeStyles((theme) => ({
  root:       { flex: 1, backgroundColor: theme.colors.background },
  sceneStyle: { backgroundColor: theme.colors.background },
}));

export default function TabsLayout() {
  const styles = useStyles();

  return (
    <View style={styles.root}>
      <Tabs
        initialRouteName="home"
        screenOptions={{
          headerShown: false,
          sceneStyle: styles.sceneStyle,
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
