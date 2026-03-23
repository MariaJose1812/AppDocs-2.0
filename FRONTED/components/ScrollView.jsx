import React from "react";
import { ScrollView, StyleSheet, Platform } from "react-native";

export default function CustomScrollView({ children, contentContainerStyle, style }) {
  return (
    <ScrollView
      style={[styles.container, style]}
      contentContainerStyle={contentContainerStyle}
      keyboardShouldPersistTaps="always"
      showsVerticalScrollIndicator={true} 
      persistentScrollbar={true} // Para Android
      indicatorStyle="black" // Para iOS
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...(Platform.OS === 'web' && {
      overflowY: 'auto',
    })
  }
});