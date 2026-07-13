import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, View, FlatList, TouchableOpacity, Pressable, ActivityIndicator } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Notification, subscribeToNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '@/services/notifications';
import { Button } from './ui/Button';

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
  onNotificationsUpdated?: (unreadCount: number) => void;
}

export function NotificationsModal({ visible, onClose, onNotificationsUpdated }: NotificationsModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;

    setLoading(true);
    const unsubscribe = subscribeToNotifications((list) => {
      setNotifications(list);
      if (onNotificationsUpdated) {
        onNotificationsUpdated(list.filter(n => !n.read).length);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [visible]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead(notifications);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
    } catch (e) {
      console.error(e);
    }
  };

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return { name: 'check-circle' as const, color: '#10B981' };
      case 'warning':
        return { name: 'exclamation-triangle' as const, color: '#F59E0B' };
      default:
        return { name: 'info-circle' as const, color: Colors[colorScheme].primary };
    }
  };

  const renderItem = ({ item }: { item: Notification }) => {
    const iconDetails = getTypeIcon(item.type);
    
    return (
      <View style={[
        styles.notificationCard,
        { 
          backgroundColor: item.read ? Colors[colorScheme].card : Colors[colorScheme].primary + '08',
          borderColor: item.read ? Colors[colorScheme].border : Colors[colorScheme].primary + '20',
        }
      ]}>
        <View style={styles.iconContainer}>
          <FontAwesome name={iconDetails.name} size={20} color={iconDetails.color} />
        </View>
        <View style={styles.contentContainer}>
          <Text style={[
            styles.notificationTitle, 
            { color: Colors[colorScheme].text, fontWeight: item.read ? '500' : 'bold' }
          ]}>
            {item.title}
          </Text>
          <Text style={[styles.notificationBody, { color: Colors[colorScheme].textMuted }]}>
            {item.body}
          </Text>
          <Text style={[styles.timeText, { color: Colors[colorScheme].textMuted + '80' }]}>
            {new Date(item.createdAt).toLocaleDateString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <View style={styles.actionsContainer}>
          {!item.read && (
            <TouchableOpacity 
              onPress={() => handleMarkAsRead(item.id)}
              style={styles.actionBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <FontAwesome name="check" size={14} color={Colors[colorScheme].primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            onPress={() => handleDelete(item.id)}
            style={[styles.actionBtn, { marginTop: 8 }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <FontAwesome name="trash-o" size={14} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable 
          style={[styles.modalContent, Shadows.lg, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}
          onPress={(e) => e.stopPropagation()} // Prevent closing when clicking inside
        >
          <View style={[styles.header, { borderBottomColor: Colors[colorScheme].border }]}>
            <View style={styles.headerLeft}>
              <FontAwesome name="bell-o" size={18} color={Colors[colorScheme].primary} style={{ marginRight: Spacing.xs }} />
              <Text style={[styles.title, { color: Colors[colorScheme].text }]}>Notificaciones</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <FontAwesome name="close" size={18} color={Colors[colorScheme].textMuted} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors[colorScheme].primary} />
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome name="bell-slash-o" size={36} color={Colors[colorScheme].textMuted + '80'} style={{ marginBottom: Spacing.sm }} />
              <Text style={[styles.emptyText, { color: Colors[colorScheme].textMuted }]}>No tienes notificaciones</Text>
            </View>
          ) : (
            <>
              <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContainer}
              />
              <View style={[styles.footer, { borderTopColor: Colors[colorScheme].border }]}>
                <Button 
                  title="Marcar todas como leídas" 
                  variant="outline"
                  size="sm"
                  onPress={handleMarkAllRead}
                  disabled={notifications.every(n => n.read)}
                />
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
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
  modalContent: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  listContainer: {
    padding: Spacing.md,
  },
  notificationCard: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  contentContainer: {
    flex: 1,
    marginRight: Spacing.xs,
  },
  notificationTitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  notificationBody: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 11,
  },
  actionsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: Spacing.xs,
  },
  actionBtn: {
    padding: 4,
  },
  footer: {
    padding: Spacing.md,
    borderTopWidth: 1,
  },
});
