import React from "react";
import { ScrollView, View, StyleSheet } from "react-native";

type ColorListProps = {
  color: string; // ✅ define prop type
};

export default function ColorList({ color }: ColorListProps) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {[1, 0.8, 0.5].map((opacity) => (
        <View
          key={opacity}
          style={[styles.colorBox, { backgroundColor: color, opacity }]}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  colorBox: {
    height: 100,
    marginVertical: 8,
    borderRadius: 10,
  },
});
