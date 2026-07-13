import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { WebContainer } from '@/components/ui/WebContainer';
import { BorderRadius, Colors, Shadows, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/useAuth';
import { useHasMounted } from '@/hooks/useHasMounted';
import { createEvent, getEventById, updateEventData } from '@/services/api';
import { notifyAdminsOfNewEvent } from '@/services/notifications';
import { AlertModal } from '@/components/ui/AlertModal';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

export default function SubmitScreen() {
  const hasMounted = useHasMounted();
  const { user, loading: authLoading } = useAuth();
  const { editId } = useLocalSearchParams();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('20:00');
  const [showCalendar, setShowCalendar] = useState(false);
  const [place, setPlace] = useState('');
  const [ticket_link, setTicketLink] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'warning' | 'danger' | 'info';
    onClose?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const colorScheme = useColorScheme() ?? 'light';
  const router = useRouter();

  useEffect(() => {
    if (editId && typeof editId === 'string') {
      const loadStoredData = async () => {
        try {
          const ev = await getEventById(editId);
          setTitle(ev.title);
          setDescription(ev.description);
          setPlace(ev.place);
          setTicketLink(ev.ticket_link);
          if (ev.image_url) setImageUrl(ev.image_url);

          const d = new Date(ev.date);
          setDate(d.toISOString().split('T')[0]);
          setTime(`${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`);
        } catch (e: any) {
          setAlertConfig({
            visible: true,
            title: "Error",
            message: "No se pudo cargar el evento original.",
            type: "danger"
          });
        }
      };
      loadStoredData();
    } else {
      setTitle('');
      setDescription('');
      setDate('');
      setTime('20:00');
      setPlace('');
      setTicketLink('');
      setImageUrl('');
    }
  }, [editId]);

  if (!hasMounted) {
    return <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]} />;
  }

  if (authLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: Colors[colorScheme].background }]}>
        <ActivityIndicator size="large" color={Colors[colorScheme].primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, { justifyContent: 'center', backgroundColor: Colors[colorScheme].background }]}>
        <WebContainer>
          <View style={styles.restrictedContainer}>
            <View style={[styles.lockIconCircle, { backgroundColor: Colors[colorScheme].primary + '15' }]}>
              <FontAwesome name="lock" size={40} color={Colors[colorScheme].primary} />
            </View>
            <Text style={[styles.restrictedTitle, { color: Colors[colorScheme].text }]}>Acceso Restringido</Text>
            <Text style={[styles.restrictedSubtitle, { color: Colors[colorScheme].textMuted }]}>
              Iniciá sesión para proponer y publicar nuevos eventos en la agenda.
            </Text>
            <Button title="Iniciar Sesión" icon="user" onPress={() => router.push('/profile')} style={styles.restrictedBtn} />
          </View>
        </WebContainer>
      </View>
    );
  }

  const handleSubmit = async () => {
    const newErrors: { [key: string]: string } = {};

    if (!title.trim()) newErrors.title = "El nombre del show es obligatorio";
    if (!description.trim()) newErrors.description = "La descripción es obligatoria";
    if (!date) newErrors.date = "La fecha es obligatoria";
    
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!time.trim()) {
      newErrors.time = "La hora es obligatoria";
    } else if (!timeRegex.test(time)) {
      newErrors.time = "Formato de hora inválido (HH:MM)";
    }

    if (!place.trim()) newErrors.place = "El lugar del show es obligatorio";

    if (ticket_link.trim()) {
      const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
      if (!urlRegex.test(ticket_link)) {
        newErrors.ticket_link = "Ingresa una URL válida (ej. https://...)";
      }
    }

    if (imageUrl.trim()) {
      const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
      if (!urlRegex.test(imageUrl)) {
        newErrors.imageUrl = "Ingresa una URL de imagen válida (ej. https://...)";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setAlertConfig({
        visible: true,
        title: "Campos Inválidos",
        message: "Por favor revisá los campos marcados en rojo en el formulario.",
        type: "danger"
      });
      return;
    }

    setErrors({});
    const isoDate = `${date}T${time}:00Z`;
    const handleSuccessRedirect = () => {
      router.push('/');
    };

    setLoading(true);
    try {
      if (editId && typeof editId === 'string') {
        await updateEventData(editId, {
          title, description, date: isoDate, place, ticket_link, image_url: imageUrl
        });
        await notifyAdminsOfNewEvent(editId, title, place).catch(err => console.error(err));
        setAlertConfig({
          visible: true,
          title: "Actualizado",
          message: "¡Evento editado exitosamente! Ha regresado al estado pendiente para revisión.",
          type: "success",
          onClose: handleSuccessRedirect
        });
      } else {
        const newEvent = await createEvent({
          title,
          description,
          date: isoDate,
          place,
          ticket_link,
          image_url: imageUrl,
        });
        await notifyAdminsOfNewEvent(newEvent.id, newEvent.title, newEvent.place).catch(err => console.error(err));
        setAlertConfig({
          visible: true,
          title: "Éxito",
          message: "¡Evento enviado para su aprobación!",
          type: "success",
          onClose: handleSuccessRedirect
        });
      }

      setTitle('');
      setDescription('');
      setDate('');
      setTime('20:00');
      setShowCalendar(false);
      setPlace('');
      setTicketLink('');
      setImageUrl('');
    } catch (e: any) {
      setAlertConfig({
        visible: true,
        title: "Error",
        message: e.message || "Ocurrió un error al enviar el evento.",
        type: "danger"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]} contentContainerStyle={styles.scrollContent}>
      <WebContainer>
        <View style={styles.headerContainer}>
          <Text style={[styles.headerTitle, { color: Colors[colorScheme].text }]}>Publicar Evento</Text>
          <Text style={[styles.headerSubtitle, { color: Colors[colorScheme].textMuted }]}>Proponé un show para sumar a la cartelera</Text>
        </View>

        <Card style={styles.formCard}>
          <Text style={[styles.label, { color: Colors[colorScheme].text }]}>Nombre del Show / Artista *</Text>
          <TextInput
            style={[
              styles.input, 
              { 
                backgroundColor: Colors[colorScheme].inputBackground, 
                borderColor: errors.title ? '#EF4444' : Colors[colorScheme].inputBorder, 
                color: Colors[colorScheme].text 
              }
            ]}
            value={title}
            onChangeText={(val) => {
              setTitle(val);
              if (errors.title) setErrors(prev => { const c = {...prev}; delete c.title; return c; });
            }}
            placeholder="Ej. Noche de Jazz & Blues"
            placeholderTextColor={Colors[colorScheme].textMuted}
          />
          {!!errors.title && <Text style={styles.errorText}>{errors.title}</Text>}

          <Text style={[styles.label, { color: Colors[colorScheme].text }]}>Descripción *</Text>
          <TextInput
            style={[
              styles.input, 
              styles.textArea, 
              { 
                backgroundColor: Colors[colorScheme].inputBackground, 
                borderColor: errors.description ? '#EF4444' : Colors[colorScheme].inputBorder, 
                color: Colors[colorScheme].text 
              }
            ]}
            value={description}
            onChangeText={(val) => {
              setDescription(val);
              if (errors.description) setErrors(prev => { const c = {...prev}; delete c.description; return c; });
            }}
            placeholder="Contanos de qué trata el show, quiénes tocan..."
            placeholderTextColor={Colors[colorScheme].textMuted}
            multiline
          />
          {!!errors.description && <Text style={styles.errorText}>{errors.description}</Text>}

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: Spacing.sm }}>
              <Text style={[styles.label, { color: Colors[colorScheme].text }]}>Fecha *</Text>
              <Button
                title={date ? new Date(date + 'T12:00:00Z').toLocaleDateString('es-ES') : "📅 Elegir fecha"}
                onPress={() => setShowCalendar(!showCalendar)}
                variant="outline"
                style={{ 
                  height: 46, 
                  borderColor: errors.date ? '#EF4444' : Colors[colorScheme].inputBorder 
                }}
              />
              {!!errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.sm }}>
              <Text style={[styles.label, { color: Colors[colorScheme].text }]}>Hora (HH:MM) *</Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: Colors[colorScheme].inputBackground, 
                    borderColor: errors.time ? '#EF4444' : Colors[colorScheme].inputBorder, 
                    color: Colors[colorScheme].text, 
                    height: 46 
                  }
                ]}
                value={time}
                onChangeText={(val) => {
                  setTime(val);
                  if (errors.time) setErrors(prev => { const c = {...prev}; delete c.time; return c; });
                }}
                placeholder="21:00"
                placeholderTextColor={Colors[colorScheme].textMuted}
                keyboardType="numbers-and-punctuation"
              />
              {!!errors.time && <Text style={styles.errorText}>{errors.time}</Text>}
            </View>
          </View>

          {showCalendar && (
            <View style={[styles.calendarWrapper, Shadows.sm, { borderColor: Colors[colorScheme].border, backgroundColor: Colors[colorScheme].card }]}>
              <Calendar
                current={date || undefined}
                onDayPress={(day: any) => { 
                  setDate(day.dateString); 
                  setShowCalendar(false); 
                  if (errors.date) setErrors(prev => { const c = {...prev}; delete c.date; return c; });
                }}
                markedDates={date ? { [date]: { selected: true, selectedColor: Colors[colorScheme].primary } } : {}}
                theme={{
                  backgroundColor: 'transparent',
                  calendarBackground: 'transparent',
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

          <Text style={[styles.label, { color: Colors[colorScheme].text }]}>Lugar *</Text>
          <TextInput
            style={[
              styles.input, 
              { 
                backgroundColor: Colors[colorScheme].inputBackground, 
                borderColor: errors.place ? '#EF4444' : Colors[colorScheme].inputBorder, 
                color: Colors[colorScheme].text 
              }
            ]}
            value={place}
            onChangeText={(val) => {
              setPlace(val);
              if (errors.place) setErrors(prev => { const c = {...prev}; delete c.place; return c; });
            }}
            placeholder="Lugar, bar o teatro (ej. Club de Música)"
            placeholderTextColor={Colors[colorScheme].textMuted}
          />
          {!!errors.place && <Text style={styles.errorText}>{errors.place}</Text>}

          <Text style={[styles.label, { color: Colors[colorScheme].text }]}>Link de Entradas o Contacto</Text>
          <TextInput
            style={[
              styles.input, 
              { 
                backgroundColor: Colors[colorScheme].inputBackground, 
                borderColor: errors.ticket_link ? '#EF4444' : Colors[colorScheme].inputBorder, 
                color: Colors[colorScheme].text 
              }
            ]}
            value={ticket_link}
            onChangeText={(val) => {
              setTicketLink(val);
              if (errors.ticket_link) setErrors(prev => { const c = {...prev}; delete c.ticket_link; return c; });
            }}
            placeholder="https://entradas..."
            placeholderTextColor={Colors[colorScheme].textMuted}
            autoCapitalize="none"
            keyboardType="url"
          />
          {!!errors.ticket_link && <Text style={styles.errorText}>{errors.ticket_link}</Text>}

          <Text style={[styles.label, { color: Colors[colorScheme].text }]}>URL de Foto Portada (opcional)</Text>
          <TextInput
            style={[
              styles.input, 
              { 
                backgroundColor: Colors[colorScheme].inputBackground, 
                borderColor: errors.imageUrl ? '#EF4444' : Colors[colorScheme].inputBorder, 
                color: Colors[colorScheme].text 
              }
            ]}
            value={imageUrl}
            onChangeText={(val) => {
              setImageUrl(val);
              if (errors.imageUrl) setErrors(prev => { const c = {...prev}; delete c.imageUrl; return c; });
            }}
            placeholder="https://..."
            placeholderTextColor={Colors[colorScheme].textMuted}
            autoCapitalize="none"
            keyboardType="url"
          />
          {!!errors.imageUrl && <Text style={styles.errorText}>{errors.imageUrl}</Text>}

          <Button
            title={editId ? "Guardar Cambios" : "Publicar Show"}
            icon={editId ? "save" : "paper-plane-o"}
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitBtn}
          />
        </Card>
      </WebContainer>

      <AlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => {
          setAlertConfig(prev => ({ ...prev, visible: false }));
          if (alertConfig.onClose) {
            alertConfig.onClose();
          }
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
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
  restrictedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    marginHorizontal: Spacing.md,
    marginTop: 40,
  },
  lockIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  restrictedTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  restrictedSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  restrictedBtn: {
    minWidth: 180,
  },
  formCard: {
    marginHorizontal: Spacing.md,
    padding: Spacing.lg,
    marginTop: Spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: Spacing.md,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  calendarWrapper: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  submitBtn: {
    marginTop: Spacing.md,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: -8,
    marginBottom: Spacing.md,
    fontWeight: '500',
  },
});
