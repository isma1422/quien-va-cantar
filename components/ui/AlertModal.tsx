import React from 'react';
import { Modal, StyleSheet, View, Text, TouchableOpacity, Dimensions, Platform } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void | Promise<void>;
}

interface AlertModalProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'success' | 'warning' | 'danger' | 'info';
  buttons?: AlertButton[];
  onClose?: () => void;
}

export function AlertModal({
  visible,
  title,
  message,
  type = 'info',
  buttons,
  onClose
}: AlertModalProps) {
  const colorScheme = useColorScheme() ?? 'light';

  // Define default alert button if none provided
  const alertButtons: AlertButton[] = buttons || [
    {
      text: 'Aceptar',
      style: 'default',
      onPress: onClose
    }
  ];

  // Helper for type color
  const getTypeColor = () => {
    switch (type) {
      case 'success':
        return Colors[colorScheme].success;
      case 'warning':
        return Colors[colorScheme].warning;
      case 'danger':
        return Colors[colorScheme].danger;
      case 'info':
      default:
        return Colors[colorScheme].primary;
    }
  };

  // Helper for type icon name
  const getTypeIcon = () => {
    switch (type) {
      case 'success':
        return 'check-circle';
      case 'warning':
        return 'exclamation-triangle';
      case 'danger':
        return 'times-circle';
      case 'info':
      default:
        return 'info-circle';
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View 
          style={[
            styles.card, 
            Shadows.lg,
            { 
              backgroundColor: Colors[colorScheme].card, 
              borderColor: Colors[colorScheme].border 
            }
          ]}
        >
          {/* Header Icon */}
          <View style={[styles.iconContainer, { backgroundColor: getTypeColor() + '15' }]}>
            <FontAwesome name={getTypeIcon() as any} size={28} color={getTypeColor()} />
          </View>

          {/* Title & Message */}
          <Text style={[styles.title, { color: Colors[colorScheme].text }]}>{title}</Text>
          <Text style={[styles.message, { color: Colors[colorScheme].textMuted }]}>{message}</Text>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            {alertButtons.map((btn, idx) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';
              
              let btnBgColor = Colors[colorScheme].primary;
              let textColor = '#FFFFFF';
              let borderColor = 'transparent';
              let borderWidth = 0;

              if (isCancel) {
                btnBgColor = 'transparent';
                textColor = Colors[colorScheme].textMuted;
                borderColor = Colors[colorScheme].border;
                borderWidth = 1;
              } else if (isDestructive) {
                btnBgColor = Colors[colorScheme].danger;
                textColor = '#FFFFFF';
              } else {
                btnBgColor = getTypeColor();
              }

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.button,
                    { 
                      backgroundColor: btnBgColor, 
                      borderColor, 
                      borderWidth,
                      marginLeft: idx > 0 ? Spacing.sm : 0,
                    }
                  ]}
                  onPress={async () => {
                    if (btn.onPress) {
                      await btn.onPress();
                    }
                    if (onClose) {
                      onClose();
                    }
                  }}
                >
                  <Text 
                    style={[
                      styles.btnText, 
                      { 
                        color: textColor, 
                        fontWeight: isCancel ? '400' : '600' 
                      }
                    ]}
                  >
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      }
    } as any),
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  actionsContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  btnText: {
    fontSize: 14,
  },
});
