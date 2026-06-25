import React from 'react';
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps, ActivityIndicator } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
}

export function Button({ title, variant = 'primary', loading = false, style, disabled, ...props }: ButtonProps) {
  const colorScheme = useColorScheme() ?? 'light';
  
  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary': return Colors[colorScheme].primary;
      case 'secondary': return Colors[colorScheme].secondary;
      case 'outline': return 'transparent';
    }
  };

  const getTextColor = () => {
    if (variant === 'outline') return Colors[colorScheme].text;
    return '#FFFFFF';
  };

  const getBorderColor = () => {
    if (variant === 'outline') return Colors[colorScheme].border;
    return 'transparent';
  };

  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        { 
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' ? 1 : 0,
          opacity: (disabled || loading) ? 0.7 : 1
        }, 
        style
      ]} 
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.xs,
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
  }
});
