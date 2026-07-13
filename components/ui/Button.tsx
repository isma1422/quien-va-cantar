import React, { useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps, ActivityIndicator, Animated, View } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  loading?: boolean;
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
  size?: 'sm' | 'md';
}

export function Button({ title, variant = 'primary', loading = false, icon, size = 'md', style, disabled, ...props }: ButtonProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary': return Colors[colorScheme].primary;
      case 'secondary': return Colors[colorScheme].secondary;
      case 'outline': return 'transparent';
      case 'danger': return Colors[colorScheme].danger;
      case 'ghost': return 'transparent';
    }
  };

  const getTextColor = () => {
    if (variant === 'outline') return Colors[colorScheme].primary;
    if (variant === 'ghost') return Colors[colorScheme].primary;
    return '#FFFFFF';
  };

  const getBorderColor = () => {
    if (variant === 'outline') return Colors[colorScheme].primary + '40';
    return 'transparent';
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const isSmall = size === 'sm';

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity 
        style={[
          styles.button,
          isSmall && styles.buttonSm,
          { 
            backgroundColor: getBackgroundColor(),
            borderColor: getBorderColor(),
            borderWidth: variant === 'outline' ? 1.5 : 0,
            opacity: (disabled || loading) ? 0.6 : 1,
          }, 
          style
        ]} 
        disabled={disabled || loading}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
        {...props}
      >
        {loading ? (
          <ActivityIndicator color={getTextColor()} size="small" />
        ) : (
          <View style={styles.content}>
            {icon && (
              <FontAwesome 
                name={icon} 
                size={isSmall ? 13 : 15} 
                color={getTextColor()} 
                style={styles.icon} 
              />
            )}
            <Text style={[
              styles.text, 
              isSmall && styles.textSm,
              { color: getTextColor() }
            ]}>
              {title}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 13,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.xs,
  },
  buttonSm: {
    paddingVertical: 9,
    paddingHorizontal: Spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: Spacing.sm,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  textSm: {
    fontSize: 13,
  },
});
