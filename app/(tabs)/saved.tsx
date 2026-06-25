import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, Text, StyleSheet, ActivityIndicator, Linking, RefreshControl } from 'react-native';
import { Event, getSavedEvents, unsaveEvent } from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function SavedScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme() ?? 'light';

  const loadSavedEvents = useCallback(async () => {
    setLoading(true);
    const data = await getSavedEvents();
    setEvents(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSavedEvents();
  }, [loadSavedEvents]);

  const handleUnsave = async (id: string) => {
    await unsaveEvent(id);
    loadSavedEvents();
  }

  const renderEvent = ({ item }: { item: Event }) => (
    <Card>
      <Text style={[styles.eventTitle, { color: Colors[colorScheme].text }]}>{item.title}</Text>
      <View style={styles.row}>
        <FontAwesome name="map-marker" size={16} color={Colors[colorScheme].icon} />
        <Text style={[styles.eventDetail, { color: Colors[colorScheme].textMuted }]}>{item.place}</Text>
      </View>
      <View style={styles.row}>
        <FontAwesome name="clock-o" size={16} color={Colors[colorScheme].icon} />
        <Text style={[styles.eventDetail, { color: Colors[colorScheme].textMuted }]}>
          {new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
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
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadSavedEvents} tintColor={Colors[colorScheme].primary} />}
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
  emptyText: {
    textAlign: 'center',
    marginTop: Spacing.xl,
    fontSize: 16,
  }
});
