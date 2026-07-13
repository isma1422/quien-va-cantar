import React from 'react';
import { View, StyleSheet, ViewProps, Platform } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
}

export function Card({ children, variant = 'default', style, ...props }: CardProps) {
  const colorScheme = useColorScheme() ?? 'light';

  const getCardStyle = () => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: Colors[colorScheme].cardElevated,
          borderWidth: 0,
          ...Shadows?.md,
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: Colors[colorScheme].border,
        };
      default:
        return {
          backgroundColor: Colors[colorScheme].card,
          borderWidth: 1,
          borderColor: Colors[colorScheme].border,
          ...Shadows?.sm,
        };
    }
  };

  return (
    <View 
      style={[
        styles.card, 
        getCardStyle(),
        style
      ]} 
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginVertical: Spacing.sm,
  },
});
