import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, Text, StyleSheet, ActivityIndicator, Linking, RefreshControl, Image } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Event, getSavedEvents, unsaveEvent } from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { useHasMounted } from '@/hooks/useHasMounted';
import { WebContainer } from '@/components/ui/WebContainer';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { BorderRadius } from '@/constants/theme';

export default function SavedScreen() {
  const hasMounted = useHasMounted();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [unsavingEventId, setUnsavingEventId] = useState<string | null>(null);
  const colorScheme = useColorScheme() ?? 'light';

  const loadSavedEvents = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    const data = await getSavedEvents();
    setEvents(data);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (hasMounted) {
        loadSavedEvents(false);
      }
    }, [hasMounted, loadSavedEvents])
  );

  if (!hasMounted) {
    return <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]} />;
  }

  const handleUnsave = async (id: string) => {
    setUnsavingEventId(id);
    try {
      await unsaveEvent(id);
      loadSavedEvents(false);
    } catch(e) {}
    finally {
      setUnsavingEventId(null);
    }
  }

  const renderEvent = ({ item }: { item: Event }) => (
    <Card style={styles.eventCard}>
      <View style={styles.cardHeader}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.eventImage} resizeMode="cover" />
        ) : (
          <View style={[styles.eventImagePlaceholder, { backgroundColor: Colors[colorScheme].secondary + '10' }]}>
            <FontAwesome name="music" size={32} color={Colors[colorScheme].secondary} />
          </View>
        )}
        <View style={styles.titleContainer}>
          <Text style={[styles.eventTitle, { color: Colors[colorScheme].text }]}>{item.title}</Text>
          <View style={styles.badgeRow}>
            <Badge label={item.place} variant="neutral" />
          </View>
        </View>
      </View>

      <View style={styles.detailsSection}>
        <View style={styles.detailItem}>
          <FontAwesome name="calendar-o" size={14} color={Colors[colorScheme].primary} style={styles.detailIcon} />
          <Text style={[styles.eventDetailText, { color: Colors[colorScheme].textMuted }]}>
            {new Date(item.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <FontAwesome name="clock-o" size={14} color={Colors[colorScheme].primary} style={styles.detailIcon} />
          <Text style={[styles.eventDetailText, { color: Colors[colorScheme].textMuted }]}>
            {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hs
          </Text>
        </View>
      </View>

      <Text style={[styles.eventDescription, { color: Colors[colorScheme].text }]} numberOfLines={3}>{item.description}</Text>
      
      <View style={styles.buttonRow}>
        <Button 
          title="Entradas" 
          icon="ticket"
          style={{flex: 1.2, marginRight: Spacing.xs}}
          onPress={() => Linking.openURL(item.ticket_link).catch(err => console.log(err))} 
        />
        <Button 
          title="Quitar" 
          icon="bookmark"
          variant="outline"
          style={{flex: 1, marginLeft: Spacing.xs}}
          onPress={() => handleUnsave(item.id)} 
          loading={unsavingEventId === item.id}
        />
      </View>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <WebContainer style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={[styles.headerTitle, { color: Colors[colorScheme].text }]}>Favoritos</Text>
          <Text style={[styles.headerSubtitle, { color: Colors[colorScheme].textMuted }]}>Tus shows guardados para no perderte nada</Text>
        </View>

        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={renderEvent}
          style={{ flex: 1 }}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => loadSavedEvents(true)} tintColor={Colors[colorScheme].primary} />}
          ListEmptyComponent={
            loading && events.length === 0 ? (
              <ActivityIndicator size="large" color={Colors[colorScheme].primary} style={{ marginTop: 40 }} />
            ) : (
              <EmptyState 
                icon="bookmark-o" 
                title="Sin favoritos guardados" 
                subtitle="Presioná el botón de guardar en los shows de la pantalla principal." 
              />
            )
          }
        />
      </WebContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  listContainer: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  eventCard: {
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  eventImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
  },
  eventImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: Spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  detailsSection: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB20',
    paddingVertical: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  detailIcon: {
    marginRight: 6,
  },
  eventDetailText: {
    fontSize: 13,
    fontWeight: '500',
  },
  eventDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginVertical: Spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
});

