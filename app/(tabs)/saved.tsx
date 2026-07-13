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
    <Card>
      <View style={{ flexDirection: 'row', marginBottom: Spacing.sm }}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={{ width: 100, height: 100, borderRadius: 8, marginRight: Spacing.md }} resizeMode="cover" />
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={[styles.eventTitle, { color: Colors[colorScheme].text, fontSize: 18 }]}>{item.title}</Text>
          <View style={styles.row}>
            <FontAwesome name="map-marker" size={14} color={Colors[colorScheme].icon} />
            <Text style={[styles.eventDetail, { color: Colors[colorScheme].textMuted, fontSize: 13 }]}>{item.place}</Text>
          </View>
          <View style={styles.row}>
            <FontAwesome name="clock-o" size={14} color={Colors[colorScheme].icon} />
            <Text style={[styles.eventDetail, { color: Colors[colorScheme].textMuted, fontSize: 13 }]}>
              {new Date(item.date).toLocaleDateString('es-ES')} - {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      </View>
      <Text style={[styles.eventDescription, { color: Colors[colorScheme].text }]} numberOfLines={2}>{item.description}</Text>
      <View style={styles.buttonRow}>
        <Button 
          title="Comprar Entradas" 
          style={{flex: 1, marginRight: Spacing.xs}}
          onPress={() => Linking.openURL(item.ticket_link).catch(err => console.log(err))} 
        />
        <Button 
          title="Eliminar" 
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
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={renderEvent}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => loadSavedEvents(true)} tintColor={Colors[colorScheme].primary} />}
        ListEmptyComponent={
          loading && events.length === 0 ? (
            <ActivityIndicator size="large" color={Colors[colorScheme].primary} style={{ marginTop: 20 }} />
          ) : (
          <Text style={[styles.emptyText, { color: Colors[colorScheme].textMuted }]}>
            Aún no has guardado ningún evento.
          </Text>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: Spacing.md,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  eventDetail: {
    fontSize: 14,
    marginLeft: Spacing.sm,
  },
  eventDescription: {
    fontSize: 14,
    marginVertical: Spacing.sm,
    lineHeight: 20,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: Spacing.xl,
    fontSize: 16,
  }
});
