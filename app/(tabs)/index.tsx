import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, Linking, ActivityIndicator, Alert, TextInput, RefreshControl, TouchableOpacity, Image, Platform } from 'react-native';
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

import { WebContainer } from '@/components/ui/WebContainer';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { BorderRadius, Shadows } from '@/constants/theme';
import { NotificationsModal } from '@/components/NotificationsModal';
import { subscribeToNotifications, addNotification } from '@/services/notifications';

LocaleConfig.defaultLocale = 'es';

export default function EventsScreen() {
  const hasMounted = useHasMounted();
  const { user, role } = useAuth();
  const [selectedDate, setSelectedDate] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
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
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const colorScheme = useColorScheme() ?? 'light';

  useFocusEffect(
    useCallback(() => {
      if (hasMounted) {
        loadEvents(false);
        const unsubscribe = subscribeToNotifications((list) => {
          setUnreadNotificationsCount(list.filter(n => !n.read).length);
        });
        return unsubscribe;
      }
    }, [hasMounted])
  );

  if (!hasMounted) {
    return <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]} />;
  }

  const loadEvents = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
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
          backgroundColor: isSelected ? Colors[colorScheme].primary : Colors[colorScheme].secondary + '25',
          borderRadius: BorderRadius.md,
          borderWidth: isSelected ? 2 : 0,
          borderColor: Colors[colorScheme].primary,
        },
        text: {
          color: isSelected ? '#ffffff' : Colors[colorScheme].text,
          fontWeight: 'bold',
        }
      }
    };
    return acc;
  }, {} as any);

  if (selectedDate && !markedDates[selectedDate]) {
    markedDates[selectedDate] = { 
       customStyles: {
         container: {
           backgroundColor: Colors[colorScheme].primary,
           borderRadius: BorderRadius.md,
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
        
        // Trigger a mock notification for the saved event
        const ev = events.find(e => e.id === id);
        if (ev) {
          await addNotification(
            'Show Guardado',
            `Has guardado el show "${ev.title}". Te avisaremos ante cualquier novedad o cambio de horario.`,
            'info',
            id
          );
        }

        Alert.alert("Guardado", "El evento se ha añadido a tu pestaña de Guardados.");
      }
    } catch (e: any) {
      Alert.alert("Aviso", "Inicia sesión para poder guardar eventos.");
    } finally {
      setSavingEventId(null);
    }
  }

  const handleAdminGlobalDelete = (id: string) => {
    const deleteAction = async () => {
      setDeletingEventId(id);
      try {
        await deleteEvent(id);
        await loadEvents(false);
      } catch(e) {}
      finally {
        setDeletingEventId(null);
      }
    };

    if (Platform.OS === 'web') {
      const confirmDelete = window.confirm("¿Estás seguro de que quieres borrar para siempre este evento?");
      if (confirmDelete) {
        deleteAction();
      }
    } else {
      Alert.alert("Moderación Local", "¿Estás seguro de que quieres borrar para siempre este evento?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: deleteAction }
      ])
    }
  }

  const renderEvent = ({ item }: { item: Event }) => {
    const isSaved = savedEventIds.has(item.id);
    return (
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
          title={isSaved ? "Guardado" : "Guardar"} 
          icon={isSaved ? "bookmark" : "bookmark-o"}
          variant="outline"
          style={{flex: 1, marginLeft: Spacing.xs}}
          onPress={() => handleSaveEvent(item.id)} 
          loading={savingEventId === item.id}
        />
      </View>
      {role === 'admin' && (
          <Button 
            title="Eliminar (Admin)"
            icon="trash-o"
            variant="danger"
            style={{marginTop: Spacing.sm}}
            onPress={() => handleAdminGlobalDelete(item.id)}
            loading={deletingEventId === item.id}
          />
      )}
    </Card>
  )};

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <WebContainer style={{ flex: 1 }}>
        {/* App Title Header */}
        <View style={styles.appHeader}>
          <View>
            <Text style={[styles.logoText, { color: Colors[colorScheme].text }]}>Quién Va Cantar</Text>
            <Text style={[styles.logoSubtitle, { color: Colors[colorScheme].textMuted }]}>Descubrí shows y cantores en vivo</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              onPress={() => setNotificationsVisible(true)} 
              style={[styles.refreshBtn, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border, marginRight: Spacing.sm }]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <FontAwesome name="bell-o" size={16} color={Colors[colorScheme].primary} />
              {unreadNotificationsCount > 0 && (
                <View style={[styles.badgeContainer, { backgroundColor: '#EF4444' }]}>
                  <Text style={styles.badgeText}>{unreadNotificationsCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => loadEvents(true)} 
              style={[styles.refreshBtn, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <FontAwesome name="refresh" size={16} color={Colors[colorScheme].primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchSection}>
          <SearchBar 
            placeholder="Buscar show, artista o lugar..."
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (text) {
                setShowCalendar(false); // auto-close calendar on search
              }
            }}
          />
          
          {!searchQuery && (
            <View style={styles.filterControls}>
              <Button
                title={selectedDate ? `Fecha: ${new Date(selectedDate + 'T12:00:00Z').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}` : "Filtrar por fecha"}
                icon="calendar"
                variant={selectedDate ? "primary" : "outline"}
                size="sm"
                onPress={() => setShowCalendar(!showCalendar)}
                style={{ flex: 1, marginRight: selectedDate ? Spacing.sm : 0 }}
              />
              {!!selectedDate && (
                <Button
                  title="Limpiar"
                  icon="times"
                  variant="outline"
                  size="sm"
                  onPress={() => {
                    setSelectedDate('');
                    setShowCalendar(false);
                  }}
                  style={{ flex: 0.4 }}
                />
              )}
            </View>
          )}
        </View>

        {!searchQuery && showCalendar && (
          <View style={[styles.calendarContainer, Shadows.sm, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}>
            <Calendar
              markingType={'custom'}
              onDayPress={(day: any) => {
                if (selectedDate === day.dateString) {
                  setSelectedDate(''); // toggle filter off if clicked again
                } else {
                  setSelectedDate(day.dateString);
                  setShowCalendar(false); // auto-close calendar on selection
                }
              }}
              onMonthChange={(month: any) => setCurrentMonth(month.dateString.substring(0, 7))}
              markedDates={markedDates}
              theme={{
                backgroundColor: 'transparent',
                calendarBackground: 'transparent',
                textSectionTitleColor: Colors[colorScheme].primary,
                selectedDayBackgroundColor: Colors[colorScheme].primary,
                selectedDayTextColor: '#ffffff',
                todayTextColor: Colors[colorScheme].secondary,
                dayTextColor: Colors[colorScheme].text,
                textDisabledColor: Colors[colorScheme].textMuted + '60',
                monthTextColor: Colors[colorScheme].text,
                arrowColor: Colors[colorScheme].primary,
                textDayFontWeight: '500',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '600',
              }}
            />
          </View>
        )}
        
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          renderItem={renderEvent}
          style={{ flex: 1 }}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadEvents} tintColor={Colors[colorScheme].primary} />}
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator size="large" color={Colors[colorScheme].primary} style={{ marginTop: 40 }} />
            ) : (
              <EmptyState 
                icon="calendar-times-o" 
                title="Sin eventos" 
                subtitle={selectedDate ? `No hay shows programados para el ${new Date(selectedDate + 'T12:00:00Z').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}` : "No encontramos shows en este mes."} 
              />
            )
          }
        />
      </WebContainer>

      <NotificationsModal
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
        onNotificationsUpdated={(count) => setUnreadNotificationsCount(count)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeContainer: {
    position: 'absolute',
    top: -4,
    right: -4,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  logoSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchSection: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  filterControls: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
  },
  calendarContainer: {
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
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

