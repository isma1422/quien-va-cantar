import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export function Card({ children, style, ...props }: CardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  
  return (
    <View 
      style={[
        styles.card, 
        { 
          backgroundColor: Colors[colorScheme].card,
          borderColor: Colors[colorScheme].border
        },
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
    borderRadius: Spacing.md,
    padding: Spacing.md,
    marginVertical: Spacing.sm,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  }
});
