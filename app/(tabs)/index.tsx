import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, Linking, ActivityIndicator, Alert, TextInput, RefreshControl, TouchableOpacity, Image, Platform, ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Event, getEvents, saveEvent, getSavedEvents, unsaveEvent, deleteEvent } from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAuth } from '@/hooks/useAuth';
import { AlertModal } from '@/components/ui/AlertModal';

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
  const [quickFilter, setQuickFilter] = useState<'month' | 'weekend' | 'week' | 'today'>('month');
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
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'warning' | 'danger' | 'info';
    buttons?: Array<{ text: string; style?: 'cancel' | 'destructive' | 'default'; onPress?: () => void | Promise<void> }>;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });
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

  const monthNamesEs = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const getMonthYearLabel = (monthStr: string) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const monthIndex = parseInt(month, 10) - 1;
    return `${monthNamesEs[monthIndex]} ${year}`;
  };

  const isToday = (dateStr: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    return dateStr === todayStr;
  };

  const isThisWeek = (dateStr: string) => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() + distanceToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const checkDate = new Date(dateStr + 'T12:00:00Z');
    return checkDate >= startOfWeek && checkDate <= endOfWeek;
  };

  const isThisWeekend = (dateStr: string) => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    const distanceToFriday = dayOfWeek === 0 ? -2 : 5 - dayOfWeek;
    const friday = new Date(today);
    friday.setDate(today.getDate() + distanceToFriday);
    friday.setHours(0, 0, 0, 0);

    const sunday = new Date(friday);
    sunday.setDate(friday.getDate() + 2);
    sunday.setHours(23, 59, 59, 999);

    const checkDate = new Date(dateStr + 'T12:00:00Z');
    return checkDate >= friday && checkDate <= sunday;
  };

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
        ? events.filter((e) => {
            const eventDateStr = new Date(e.date).toISOString().split('T')[0];
            if (quickFilter === 'today') {
              return isToday(eventDateStr);
            }
            if (quickFilter === 'week') {
              return isThisWeek(eventDateStr);
            }
            if (quickFilter === 'weekend') {
              return isThisWeekend(eventDateStr);
            }
            return new Date(e.date).toISOString().startsWith(currentMonth);
          })
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

        setAlertConfig({
          visible: true,
          title: "Guardado",
          message: "El evento se ha añadido a tu pestaña de Guardados.",
          type: "success"
        });
      }
    } catch (e: any) {
      setAlertConfig({
        visible: true,
        title: "Aviso",
        message: "Inicia sesión para poder guardar eventos.",
        type: "warning"
      });
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
        setAlertConfig({
          visible: true,
          title: "Eliminado",
          message: "El evento ha sido eliminado permanentemente.",
          type: "success"
        });
      } catch(e) {}
      finally {
        setDeletingEventId(null);
      }
    };

    setAlertConfig({
      visible: true,
      title: "Confirmar Eliminación",
      message: "¿Estás seguro de que quieres borrar para siempre este evento?",
      type: "danger",
      buttons: [
        { text: "Cancelar", style: "cancel" },
        { text: "Borrar", style: "destructive", onPress: deleteAction }
      ]
    });
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
        </View>
      </View>
      
      <View style={styles.detailsSectionVertical}>
        <View style={styles.detailItemVertical}>
          <FontAwesome name="calendar-o" size={14} color={Colors[colorScheme].primary} style={styles.detailIcon} />
          <Text style={[styles.eventDetailText, { color: Colors[colorScheme].textMuted }]}>
            {new Date(item.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
        </View>
        <View style={styles.detailItemVertical}>
          <FontAwesome name="clock-o" size={14} color={Colors[colorScheme].primary} style={styles.detailIcon} />
          <Text style={[styles.eventDetailText, { color: Colors[colorScheme].textMuted }]}>
            {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hs
          </Text>
        </View>
        <View style={styles.detailItemVertical}>
          <FontAwesome name="map-marker" size={14} color={Colors[colorScheme].primary} style={styles.detailIcon} />
          <Text style={[styles.eventDetailText, { color: Colors[colorScheme].textMuted, flex: 1 }]}>
            {item.place}
          </Text>
          <TouchableOpacity 
            onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.place)}`).catch(err => console.log(err))}
            style={[styles.mapLinkBadge, { backgroundColor: Colors[colorScheme].border + '40' }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.mapLinkText, { color: Colors[colorScheme].textMuted }]}>Ver en Mapa</Text>
          </TouchableOpacity>
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

        {/* Option B: Quick Filters & Collapsible Calendar Card */}
        {!searchQuery && (
          <View style={[styles.calendarCard, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}>
            {/* Header: Filter Context and Calendar Toggle Button */}
            <View style={styles.calendarCardHeader}>
              <View style={styles.filterStatusContainer}>
                <Text style={[styles.filterStatusTitle, { color: Colors[colorScheme].text }]}>
                  {selectedDate 
                    ? `Filtrando: ${new Date(selectedDate + 'T12:00:00Z').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`
                    : (quickFilter === 'month' 
                        ? getMonthYearLabel(currentMonth)
                        : (quickFilter === 'today' 
                            ? 'Hoy' 
                            : (quickFilter === 'week' 
                                ? 'Esta Semana' 
                                : 'Este Fin de Semana')))}
                </Text>
              </View>

              <View style={styles.calendarHeaderActions}>
                {!!selectedDate && (
                  <TouchableOpacity 
                    onPress={() => {
                      setSelectedDate('');
                      setQuickFilter('month');
                    }}
                    style={styles.clearDateBtn}
                    activeOpacity={0.7}
                  >
                    <FontAwesome name="times-circle" size={18} color={Colors[colorScheme].danger} style={{ marginRight: Spacing.sm }} />
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                  onPress={() => setShowCalendar(!showCalendar)} 
                  style={[
                    styles.calendarToggleBtn, 
                    { backgroundColor: showCalendar ? Colors[colorScheme].primary : Colors[colorScheme].border + '40' }
                  ]}
                  activeOpacity={0.7}
                >
                  <FontAwesome 
                    name="calendar" 
                    size={14} 
                    color={showCalendar ? '#ffffff' : Colors[colorScheme].primary} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Filters Strip */}
            {!showCalendar && (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickFiltersContainer}
              >
                {[
                  { id: 'month', label: 'Todo el Mes' },
                  { id: 'weekend', label: 'Este Finde' },
                  { id: 'week', label: 'Esta Semana' },
                  { id: 'today', label: 'Hoy' }
                ].map((item) => {
                  const isSelected = !selectedDate && quickFilter === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => {
                        setSelectedDate('');
                        setQuickFilter(item.id as any);
                      }}
                      style={[
                        styles.quickFilterPill,
                        { backgroundColor: Colors[colorScheme].border + '30' },
                        isSelected && {
                          backgroundColor: Colors[colorScheme].primary,
                        }
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.quickFilterText, 
                        { color: isSelected ? '#ffffff' : Colors[colorScheme].textMuted }
                      ]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* Collapsible Monthly Grid */}
            {showCalendar && (
              <View style={styles.expandedCalendarWrapper}>
                <Calendar
                  markingType={'custom'}
                  onDayPress={(day: any) => {
                    setSelectedDate(day.dateString);
                    setQuickFilter('month');
                    setShowCalendar(false);
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
          </View>
        )}

        <View style={styles.searchSection}>
          <SearchBar 
            placeholder="Buscar show, artista o lugar..."
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (text) {
                setShowCalendar(false);
              }
            }}
          />
        </View>
        
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

      <AlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
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
  calendarCard: {
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  calendarCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarMonthText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  chevronIcon: {
    marginLeft: Spacing.xs,
    marginTop: 2,
  },
  clearDateBtn: {
    padding: 2,
  },
  quickFiltersContainer: {
    paddingVertical: Spacing.xs,
    marginTop: Spacing.md,
  },
  quickFilterPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
    marginRight: Spacing.sm,
  },
  quickFilterText: {
    fontSize: 13,
    fontWeight: '600',
  },
  filterStatusContainer: {
    flex: 1,
  },
  filterStatusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  calendarHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarToggleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedCalendarWrapper: {
    marginTop: Spacing.sm,
    overflow: 'hidden',
  },
  detailsSectionVertical: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB20',
    paddingVertical: Spacing.xs,
    marginVertical: Spacing.xs,
  },
  detailItemVertical: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  mapLinkBadge: {
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: Spacing.sm,
  },
  mapLinkText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});

