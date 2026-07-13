import React from 'react';
import { View, Platform, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { WEB_MAX_WIDTH } from '@/constants/theme';

interface WebContainerProps {
  children: React.ReactNode;
  maxWidth?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Constrains content to a max width on web for a centered, readable layout.
 * On mobile, simply passes children through with no wrapper overhead.
 */
export function WebContainer({ children, maxWidth = WEB_MAX_WIDTH, style }: WebContainerProps) {
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  return (
    <View style={[styles.container, { maxWidth }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%' as any,
    alignSelf: 'center',
  },
});
