import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Event, currentUser, mockUsers } from '@/services/mockData';
import { getPendingEvents, updateEventStatus, deleteEvent } from '@/services/api';

export default function ProfileScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  // Hack to force re-render for role toggle
  const [, setTick] = useState(0); 

  const colorScheme = useColorScheme() ?? 'light';

  const loadPending = useCallback(async () => {
    if (currentUser?.role !== 'admin') return;
    setLoading(true);
    const data = await getPendingEvents();
    setEvents(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  const toggleRole = () => {
    if (currentUser?.role === 'admin') {
      Object.assign(currentUser!, mockUsers[1]); // switch to user
    } else {
      Object.assign(currentUser!, mockUsers[0]); // switch to admin
    }
    setTick(t => t + 1);
    loadPending();
  };

  const handleApprove = async (id: string) => {
    await updateEventStatus(id, 'approved');
    Alert.alert("Aprobado", "El evento ya está en el calendario.");
    loadPending();
  };

  const handleDelete = async (id: string) => {
    await deleteEvent(id);
    Alert.alert("Eliminado", "El evento ha sido descartado.");
    loadPending();
  };

  const renderPendingFeature = ({ item }: { item: Event }) => (
    <Card>
      <Text style={[styles.eventTitle, { color: Colors[colorScheme].text }]}>{item.title}</Text>
      <Text style={{ color: Colors[colorScheme].textMuted, marginBottom: Spacing.xs }}>
        {new Date(item.date).toLocaleDateString()} @ {item.place}
      </Text>
      <Text style={{ color: Colors[colorScheme].text, marginBottom: Spacing.md }}>{item.description}</Text>
      
      <View style={styles.buttonRow}>
        <Button 
          title="Aprobar" 
          style={{flex: 1, marginRight: Spacing.xs}}
          onPress={() => handleApprove(item.id)} 
        />
        <Button 
          title="Rechazar" 
          variant="outline"
          style={{flex: 1, marginLeft: Spacing.xs}}
          onPress={() => handleDelete(item.id)} 
        />
      </View>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: Colors[colorScheme].text }]}>Perfil / Administrador</Text>
        <Text style={{ color: Colors[colorScheme].textMuted, fontSize: 16 }}>
          Sesión iniciada como: {currentUser?.email} ({currentUser?.role})
        </Text>
        <Button 
          title={`Cambiar a ${currentUser?.role === 'admin' ? 'Usuario' : 'Administrador'} (Mock)`} 
          variant="outline" 
          style={styles.toggleBtn}
          onPress={toggleRole} 
        />
      </View>

      {currentUser?.role === 'admin' && (
        <View style={styles.adminSection}>
          <Text style={[styles.subtitle, { color: Colors[colorScheme].text }]}>Eventos Pendientes</Text>
          {loading ? (
             <ActivityIndicator size="large" color={Colors[colorScheme].primary} />
          ) : (
            <FlatList
              data={events}
              keyExtractor={(item) => item.id}
              renderItem={renderPendingFeature}
              refreshControl={<RefreshControl refreshing={loading} onRefresh={loadPending} />}
              ListEmptyComponent={
                <Text style={{ color: Colors[colorScheme].textMuted }}>No hay eventos pendientes.</Text>
              }
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEE',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  toggleBtn: {
    marginTop: Spacing.md,
  },
  adminSection: {
    flex: 1,
    padding: Spacing.md,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  }
});
