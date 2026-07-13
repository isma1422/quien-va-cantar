import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, TextInputProps } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface SearchBarProps extends Omit<TextInputProps, 'style'> {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
}

export function SearchBar({ value, onChangeText, onClear, ...props }: SearchBarProps) {
  const colorScheme = useColorScheme() ?? 'light';

  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: Colors[colorScheme].inputBackground,
        borderColor: Colors[colorScheme].inputBorder,
      },
      Shadows?.sm,
    ]}>
      <FontAwesome
        name="search"
        size={15}
        color={Colors[colorScheme].textMuted}
        style={styles.searchIcon}
      />
      <TextInput
        style={[styles.input, { color: Colors[colorScheme].text }]}
        placeholderTextColor={Colors[colorScheme].textMuted}
        value={value}
        onChangeText={onChangeText}
        {...props}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <View style={[styles.clearCircle, { backgroundColor: Colors[colorScheme].textMuted + '30' }]}>
            <FontAwesome name="times" size={10} color={Colors[colorScheme].textMuted} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  clearButton: {
    marginLeft: Spacing.sm,
  },
  clearCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
