import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, Linking, ActivityIndicator } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Event } from '@/services/mockData';
import { getEvents } from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';

LocaleConfig.locales['es'] = {
  monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  today: 'Hoy'
};
LocaleConfig.defaultLocale = 'es';

export default function EventsScreen() {
  const [selectedDate, setSelectedDate] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme() ?? 'light';

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    const data = await getEvents();
    setEvents(data);
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

  const eventsForSelectedDate = selectedDate
    ? events.filter((e) => new Date(e.date).toISOString().split('T')[0] === selectedDate)
    : events;

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
          {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      <Text style={[styles.eventDescription, { color: Colors[colorScheme].text }]}>{item.description}</Text>
      
      <Button 
        title="Comprar Entradas" 
        onPress={() => Linking.openURL(item.ticket_link).catch(err => console.log(err))} 
      />
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <Calendar
        markingType={'custom'}
        onDayPress={(day: any) => setSelectedDate(day.dateString)}
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
      
      {loading ? (
        <ActivityIndicator size="large" color={Colors[colorScheme].primary} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={eventsForSelectedDate}
          keyExtractor={(item) => item.id}
          renderItem={renderEvent}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: Colors[colorScheme].textMuted }]}>
              No se encontraron eventos para {selectedDate || 'estas fechas'}.
            </Text>
          }
        />
      )}
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
