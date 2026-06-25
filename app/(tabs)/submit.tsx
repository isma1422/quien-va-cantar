import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert } from 'react-native';
import { createEvent } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';

export default function SubmitScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [place, setPlace] = useState('');
  const [ticket_link, setTicketLink] = useState('');
  const [loading, setLoading] = useState(false);
  
  const colorScheme = useColorScheme() ?? 'light';
  const router = useRouter();

  const handleSubmit = async () => {
    if (!title || !description || !date || !place) {
      Alert.alert("Error", "Por favor completa todos los campos requeridos");
      return;
    }
    
    // basic date validation (ISO)
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
    if (!dateRegex.test(date)) {
      Alert.alert("Error", "La fecha debe tener formato ISO: YYYY-MM-DDTHH:mm:ssZ");
      return;
    }

    setLoading(true);
    try {
      await createEvent({
        title,
        description,
        date,
        place,
        ticket_link,
      });
      Alert.alert("Éxito", "¡Evento enviado para su aprobación!");
      setTitle('');
      setDescription('');
      setDate('');
      setPlace('');
      setTicketLink('');
      router.push('/(tabs)/');
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

      <Text style={[styles.label, { color: Colors[colorScheme].text }]}>Fecha (formato ISO) *</Text>
      <TextInput 
        style={[styles.input, { borderColor: Colors[colorScheme].border, color: Colors[colorScheme].text }]} 
        value={date} onChangeText={setDate} placeholder="2026-05-20T20:00:00Z" placeholderTextColor={Colors[colorScheme].textMuted} 
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
