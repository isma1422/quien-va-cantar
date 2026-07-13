import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, Linking, ActivityIndicator, Alert, TextInput, RefreshControl, TouchableOpacity, Image } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Event, getEvents, saveEvent, getSavedEvents, unsaveEvent, deleteEvent } from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAuth } from '@/hooks/useAuth';

LocaleConfig.locales['es'] = {
  monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  today: 'Hoy'
};
import { useHasMounted } from '@/hooks/useHasMounted';

LocaleConfig.defaultLocale = 'es';

export default function EventsScreen() {
  const hasMounted = useHasMounted();
  const { user, role } = useAuth();
  const [selectedDate, setSelectedDate] = useState('');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [savedEventIds, setSavedEventIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [savingEventId, setSavingEventId] = useState<string | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const colorScheme = useColorScheme() ?? 'light';

  useFocusEffect(
    useCallback(() => {
      if (hasMounted) {
        loadEvents(false);
      }
    }, [hasMounted])
  );

  if (!hasMounted) {
    return <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]} />;
  }


  const loadEvents = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    // run both calls manually instead of Promise.all to avoid silent failures
    const data = await getEvents();
    setEvents(data);
    
    try {
      const saved = await getSavedEvents();
      setSavedEventIds(new Set(saved.map(e => e.id)));
    } catch(e) {}
    
    setLoading(false);
  };

  const markedDates = events.reduce((acc, event) => {
    const dateStr = new Date(event.date).toISOString().split('T')[0];
    const isSelected = dateStr === selectedDate;
    
    acc[dateStr] = { 
      customStyles: {
        container: {
          backgroundColor: isSelected ? Colors[colorScheme].primary : Colors[colorScheme].secondary + '80', // semi-transparent secondary
          borderRadius: 8,
          borderWidth: isSelected ? 2 : 0,
          borderColor: Colors[colorScheme].text,
        },
        text: {
          color: isSelected ? '#ffffff' : Colors[colorScheme].text,
          fontWeight: 'bold',
        }
      }
    };
    return acc;
  }, {} as any);

  // If selectedDate isn't in events but is selected
  if (selectedDate && !markedDates[selectedDate]) {
    markedDates[selectedDate] = { 
       customStyles: {
         container: {
           backgroundColor: Colors[colorScheme].primary,
           borderRadius: 8,
         },
         text: {
           color: '#ffffff',
           fontWeight: 'bold',
         }
       }
    };
  }

  const eventsForSelectedDate = selectedDate && !searchQuery
    ? events.filter((e) => new Date(e.date).toISOString().split('T')[0] === selectedDate)
    : (!searchQuery 
        ? events.filter((e) => new Date(e.date).toISOString().startsWith(currentMonth))
        : events);

  const filteredEvents = eventsForSelectedDate.filter(e => 
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.place.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveEvent = async (id: string) => {
    setSavingEventId(id);
    try {
      if (savedEventIds.has(id)) {
        await unsaveEvent(id);
        const newSet = new Set(savedEventIds);
        newSet.delete(id);
        setSavedEventIds(newSet);
      } else {
        await saveEvent(id);
        const newSet = new Set(savedEventIds);
        newSet.add(id);
        setSavedEventIds(newSet);
        Alert.alert("Guardado", "El evento se ha añadido a tu pestaña de Guardados.");
      }
    } catch (e: any) {
      Alert.alert("Aviso", "Inicia sesión para poder guardar eventos.");
    } finally {
      setSavingEventId(null);
    }
  }

  const handleAdminGlobalDelete = (id: string) => {
    Alert.alert("Moderación Local", "¿Estás seguro de que quieres borrar para siempre este evento?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: async () => {
          setDeletingEventId(id);
          try {
            await deleteEvent(id);
            await loadEvents(false);
          } catch(e) {}
          finally {
            setDeletingEventId(null);
          }
      }}
    ])
  }

  const renderEvent = ({ item }: { item: Event }) => {
    const isSaved = savedEventIds.has(item.id);
    return (
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
          title={isSaved ? "Quitar" : "Guardar"} 
          variant={isSaved ? "outline" : "outline"}
          style={{flex: 1, marginLeft: Spacing.xs}}
          onPress={() => handleSaveEvent(item.id)} 
          loading={savingEventId === item.id}
        />
      </View>
      {role === 'admin' && (
          <Button 
            title="Eliminar Evento (Admin)"
            variant="outline"
            style={{marginTop: Spacing.sm, borderColor: '#FF4444'}}
            onPress={() => handleAdminGlobalDelete(item.id)}
            loading={deletingEventId === item.id}
          />
      )}
    </Card>
  )};

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: Spacing.md, paddingBottom: 0 }}>
        <TextInput 
          style={[styles.input, { flex: 1, backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border, color: Colors[colorScheme].text, marginBottom: Spacing.sm, marginRight: Spacing.sm }]}
          placeholder="Buscar evento, artista o lugar..."
          placeholderTextColor={Colors[colorScheme].textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity onPress={() => loadEvents(true)} style={{ padding: Spacing.sm, marginBottom: Spacing.sm }}>
          <FontAwesome name="refresh" size={24} color={Colors[colorScheme].primary} />
        </TouchableOpacity>
      </View>

      {!searchQuery && (
        <Calendar
          markingType={'custom'}
        onDayPress={(day: any) => setSelectedDate(day.dateString)}
        onMonthChange={(month: any) => setCurrentMonth(month.dateString.substring(0, 7))}
        markedDates={markedDates}
        theme={{
          backgroundColor: Colors[colorScheme].card,
          calendarBackground: Colors[colorScheme].card,
          textSectionTitleColor: Colors[colorScheme].primary,
          selectedDayBackgroundColor: Colors[colorScheme].primary,
          selectedDayTextColor: '#ffffff',
          todayTextColor: Colors[colorScheme].secondary,
          dayTextColor: Colors[colorScheme].text,
          textDisabledColor: Colors[colorScheme].textMuted,
          monthTextColor: Colors[colorScheme].text,
          arrowColor: Colors[colorScheme].primary,
        }}
      />
      )}
      
      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        renderItem={renderEvent}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadEvents} tintColor={Colors[colorScheme].primary} />}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={Colors[colorScheme].primary} style={{ marginTop: 20 }} />
          ) : (
            <Text style={[styles.emptyText, { color: Colors[colorScheme].textMuted }]}>
              No se encontraron eventos para {selectedDate || 'estas fechas'}.
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
  input: {
    borderWidth: 1,
    borderRadius: Spacing.sm,
    padding: Spacing.md,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
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
