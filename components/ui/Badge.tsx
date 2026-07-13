import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

export function Badge({ label, variant = 'info' }: BadgeProps) {
  const colorScheme = useColorScheme() ?? 'light';

  const getColors = () => {
    switch (variant) {
      case 'success':
        return { bg: Colors[colorScheme].successLight, text: Colors[colorScheme].success };
      case 'warning':
        return { bg: Colors[colorScheme].warningLight, text: Colors[colorScheme].warning };
      case 'danger':
        return { bg: Colors[colorScheme].dangerLight, text: Colors[colorScheme].danger };
      case 'info':
        return { bg: `${Colors[colorScheme].primary}18`, text: Colors[colorScheme].primary };
      case 'neutral':
        return { bg: `${Colors[colorScheme].textMuted}18`, text: Colors[colorScheme].textMuted };
      default:
        return { bg: `${Colors[colorScheme].primary}18`, text: Colors[colorScheme].primary };
    }
  };

  const colors = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
