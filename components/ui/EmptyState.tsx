import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface EmptyStateProps {
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon = 'inbox', title, subtitle }: EmptyStateProps) {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: `${Colors[colorScheme].primary}12` }]}>
        <FontAwesome name={icon} size={32} color={`${Colors[colorScheme].primary}60`} />
      </View>
      <Text style={[styles.title, { color: Colors[colorScheme].text }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: Colors[colorScheme].textMuted }]}>{subtitle}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
