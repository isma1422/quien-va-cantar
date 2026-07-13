import React from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { WEB_MAX_WIDTH } from '@/constants/theme';

interface WebContainerProps {
  children: React.ReactNode;
  maxWidth?: number;
}

/**
 * Constrains content to a max width on web for a centered, readable layout.
 * On mobile, simply passes children through with no wrapper overhead.
 */
export function WebContainer({ children, maxWidth = WEB_MAX_WIDTH }: WebContainerProps) {
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  return (
    <View style={[styles.container, { maxWidth }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%' as any,
    alignSelf: 'center',
    flex: 1,
  },
});
