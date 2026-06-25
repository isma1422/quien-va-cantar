import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert } from 'react-native';
import { createEvent } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import { Calendar } from 'react-native-calendars';

export default function SubmitScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('20:00');
  const [showCalendar, setShowCalendar] = useState(false);
  const [place, setPlace] = useState('');
  const [ticket_link, setTicketLink] = useState('');
  const [loading, setLoading] = useState(false);
  
  const colorScheme = useColorScheme() ?? 'light';
  const router = useRouter();

  const handleSubmit = async () => {
    if (!title || !description || !date || !time || !place) {
      Alert.alert("Error", "Por favor completa todos los campos requeridos");
      return;
    }
    
    // basic time validation
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      Alert.alert("Error", "La hora debe tener el formato HH:MM (ej. 20:30)");
      return;
    }

    const isoDate = `${date}T${time}:00Z`;

    setLoading(true);
    try {
      await createEvent({
        title,
        description,
        date: isoDate,
        place,
        ticket_link,
      });
      Alert.alert("Éxito", "¡Evento enviado para su aprobación!");
      setTitle('');
      setDescription('');
      setDate('');
      setTime('20:00');
      setShowCalendar(false);
      setPlace('');
      setTicketLink('');
      router.push('/');
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.header, { color: Colors[colorScheme].text }]}>Publicar un Evento</Text>
      
      <Text style={[styles.label, { color: Colors[colorScheme].text }]}>Módulo / Título *</Text>
      <TextInput 
        style={[styles.input, { borderColor: Colors[colorScheme].border, color: Colors[colorScheme].text }]} 
        value={title} onChangeText={setTitle} placeholder="Nombre del evento" placeholderTextColor={Colors[colorScheme].textMuted} 
      />

      <Text style={[styles.label, { color: Colors[colorScheme].text }]}>Descripción *</Text>
      <TextInput 
        style={[styles.input, styles.textArea, { borderColor: Colors[colorScheme].border, color: Colors[colorScheme].text }]} 
        value={description} onChangeText={setDescription} placeholder="Descripción" placeholderTextColor={Colors[colorScheme].textMuted} multiline
      />

      <Text style={[styles.label, { color: Colors[colorScheme].text }]}>Fecha *</Text>
      <Button 
        title={date ? new Date(date + 'T12:00:00Z').toLocaleDateString('es-ES') : "📅 Seleccionar fecha"} 
        onPress={() => setShowCalendar(!showCalendar)} 
        variant="outline" 
        style={{ marginBottom: showCalendar ? Spacing.sm : Spacing.lg, borderColor: Colors[colorScheme].border }}
      />
      
      {showCalendar && (
        <View style={{ marginBottom: Spacing.lg, borderRadius: Spacing.md, overflow: 'hidden', borderWidth: 1, borderColor: Colors[colorScheme].border }}>
          <Calendar 
            current={date || undefined}
            onDayPress={(day: any) => { setDate(day.dateString); setShowCalendar(false); }}
            markedDates={date ? { [date]: { selected: true, selectedColor: Colors[colorScheme].primary } } : {}}
            theme={{
              backgroundColor: Colors[colorScheme].card,
              calendarBackground: Colors[colorScheme].card,
              textSectionTitleColor: Colors[colorScheme].primary,
              selectedDayBackgroundColor: Colors[colorScheme].primary,
              selectedDayTextColor: '#ffffff',
              todayTextColor: Colors[colorScheme].secondary,
              dayTextColor: Colors[colorScheme].text,
              monthTextColor: Colors[colorScheme].text,
              arrowColor: Colors[colorScheme].primary,
            }}
          />
        </View>
      )}

      <Text style={[styles.label, { color: Colors[colorScheme].text }]}>Hora (HH:MM) *</Text>
      <TextInput 
        style={[styles.input, { borderColor: Colors[colorScheme].border, color: Colors[colorScheme].text }]} 
        value={time} onChangeText={setTime} placeholder="20:00" placeholderTextColor={Colors[colorScheme].textMuted} 
        keyboardType="numbers-and-punctuation"
      />

      <Text style={[styles.label, { color: Colors[colorScheme].text }]}>Lugar *</Text>
      <TextInput 
        style={[styles.input, { borderColor: Colors[colorScheme].border, color: Colors[colorScheme].text }]} 
        value={place} onChangeText={setPlace} placeholder="Locación o recinto" placeholderTextColor={Colors[colorScheme].textMuted} 
      />

      <Text style={[styles.label, { color: Colors[colorScheme].text }]}>Link de Entradas / Contacto</Text>
      <TextInput 
        style={[styles.input, { borderColor: Colors[colorScheme].border, color: Colors[colorScheme].text }]} 
        value={ticket_link} onChangeText={setTicketLink} placeholder="https://..." placeholderTextColor={Colors[colorScheme].textMuted} 
      />

      <Button title={loading ? "Enviando..." : "Publicar Evento"} onPress={handleSubmit} disabled={loading} style={styles.submitBtn} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: 16,
    marginBottom: Spacing.xs,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.sm,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitBtn: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xxl,
  }
});
