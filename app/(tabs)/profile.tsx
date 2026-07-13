import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, RefreshControl, TextInput, TouchableOpacity, Image, ScrollView, Platform } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter, useFocusEffect } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Event, getMyEvents } from '@/services/api';
import { getPendingEvents, updateEventStatus, deleteEvent } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { auth, db } from '@/services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useHasMounted } from '@/hooks/useHasMounted';
import { WebContainer } from '@/components/ui/WebContainer';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { addNotification } from '@/services/notifications';
import { AlertModal } from '@/components/ui/AlertModal';

export default function ProfileScreen() {
  const hasMounted = useHasMounted();
  const router = useRouter();
  const { user, role, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authActionLoading, setAuthActionLoading] = useState(false);
  const [processingEventId, setProcessingEventId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{type: 'error'|'success', text: string} | null>(null);
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

  const colorScheme = useColorScheme() ?? 'light';

  const loadPending = useCallback(async (showSpinner = true) => {
    if (role !== 'admin') return;
    if (showSpinner) setLoading(true);
    const data = await getPendingEvents();
    setEvents(data);
    setLoading(false);
  }, [role]);

  const loadMyEvents = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getMyEvents();
      setMyEvents(data);
    } catch(e) {}
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (user && hasMounted) {
        loadPending(false);
        loadMyEvents();
      }
    }, [user, hasMounted, loadPending, loadMyEvents])
  );

  if (!hasMounted) {
     return <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]} />;
  }

  const onProfileRefresh = () => {
    loadPending();
    loadMyEvents();
  };

  const validateForm = () => {
    setFeedbackMsg(null);
    if (!email || !password) {
      setFeedbackMsg({type: 'error', text: "Por favor completa ambos campos."});
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFeedbackMsg({type: 'error', text: "Por favor ingresa un email válido."});
      return false;
    }
    if (password.length < 6) {
      setFeedbackMsg({type: 'error', text: "La contraseña debe tener al menos 6 caracteres."});
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
     if (!validateForm()) return;
     setAuthActionLoading(true);
     try {
       await signInWithEmailAndPassword(auth, email, password);
     } catch(e: any) {
       setFeedbackMsg({type: 'error', text: `Error al iniciar: ${e.message}`});
     } finally { setAuthActionLoading(false); }
  }

  const handleRegister = async () => {
    if (!validateForm()) return;
    setAuthActionLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', res.user.uid), {
         email, role: 'user'
      });
      setFeedbackMsg({type: 'success', text: "¡Usuario registrado y conectado!"});
    } catch(e: any) {
      setFeedbackMsg({type: 'error', text: `Error al registrar: ${e.message}`});
    } finally { setAuthActionLoading(false); }
  }

  const handleLogout = async () => {
     await signOut(auth);
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setFeedbackMsg({type: 'error', text: "Por favor ingresa tu email primero."});
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFeedbackMsg({type: 'error', text: "Por favor ingresa un email válido."});
      return;
    }

    setAuthActionLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setFeedbackMsg({type: 'success', text: "Se ha enviado un correo para restablecer tu contraseña."});
    } catch (e: any) {
      setFeedbackMsg({type: 'error', text: `Error: ${e.message}`});
    } finally {
      setAuthActionLoading(false);
    }
  }

  const handleApprove = async (id: string) => {
    setProcessingEventId(id);
    try {
      const pendingEvent = events.find(e => e.id === id);
      await updateEventStatus(id, 'approved');

      if (pendingEvent && pendingEvent.created_by) {
        await addNotification(
          '¡Show Aprobado!',
          `Tu propuesta "${pendingEvent.title}" ha sido aprobada por el administrador y ya está visible en la cartelera.`,
          'success',
          id,
          pendingEvent.created_by
        ).catch(err => console.error(err));
      }

      setAlertConfig({
        visible: true,
        title: "Aprobado",
        message: "El evento ya está en el calendario.",
        type: "success"
      });
      loadPending(false);
      loadMyEvents();
    } catch(e) {}
    finally {
      setProcessingEventId(null);
    }
  };

  const handleDelete = async (id: string) => {
    const deleteAction = async () => {
      setProcessingEventId(id);
      try {
        const pendingEvent = events.find(e => e.id === id);
        await deleteEvent(id);

        if (pendingEvent && pendingEvent.created_by) {
          await addNotification(
            'Propuesta Descartada',
            `Tu propuesta "${pendingEvent.title}" no fue aprobada por el moderador.`,
            'warning',
            id,
            pendingEvent.created_by
          ).catch(err => console.error(err));
        }

        setAlertConfig({
          visible: true,
          title: "Eliminado",
          message: "El evento ha sido descartado.",
          type: "success"
        });
        loadPending(false);
      } catch(e) {}
      finally {
        setProcessingEventId(null);
      }
    };

    setAlertConfig({
      visible: true,
      title: "Rechazar Evento",
      message: "¿Seguro que deseas eliminar este evento pendiente?",
      type: "warning",
      buttons: [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: deleteAction }
      ]
    });
  };

  const handleCreatorDelete = async (id: string) => {
    const deleteAction = async () => {
      setProcessingEventId(id);
      try {
        await deleteEvent(id);
        setAlertConfig({
          visible: true,
          title: "Eliminado",
          message: "Tu evento ha sido borrado.",
          type: "success"
        });
        loadMyEvents();
      } catch(e) {}
      finally {
        setProcessingEventId(null);
      }
    };

    setAlertConfig({
      visible: true,
      title: "Confirmar Eliminación",
      message: "¿Estás seguro de que deseas borrar tu evento para siempre?",
      type: "warning",
      buttons: [
        { text: "Cancelar", style: "cancel" },
        { text: "Borrar", style: "destructive", onPress: deleteAction }
      ]
    });
  };

  const renderPendingFeature = ({ item }: { item: Event }) => (
    <Card key={item.id} style={styles.eventCard}>
      <View style={styles.cardHeader}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.eventImage} resizeMode="cover" />
        ) : (
          <View style={[styles.eventImagePlaceholder, { backgroundColor: Colors[colorScheme].secondary + '10' }]}>
            <FontAwesome name="music" size={24} color={Colors[colorScheme].secondary} />
          </View>
        )}
        <View style={styles.titleContainer}>
          <Text style={[styles.eventTitle, { color: Colors[colorScheme].text }]}>{item.title}</Text>
          <Text style={{ color: Colors[colorScheme].textMuted, fontSize: 12, fontWeight: '500' }}>
            {new Date(item.date).toLocaleDateString('es-ES')} @ {item.place}
          </Text>
        </View>
      </View>
      <Text style={{ color: Colors[colorScheme].text, marginBottom: Spacing.md, fontSize: 13, lineHeight: 18 }} numberOfLines={2}>{item.description}</Text>
      
      <View style={styles.buttonRow}>
        <Button 
          title="Aprobar" 
          icon="check"
          size="sm"
          style={{flex: 1, marginRight: Spacing.xs}}
          onPress={() => handleApprove(item.id)} 
          loading={processingEventId === item.id}
        />
        <Button 
          title="Rechazar" 
          icon="times"
          size="sm"
          variant="danger"
          style={{flex: 1, marginLeft: Spacing.xs}}
          onPress={() => handleDelete(item.id)} 
          loading={processingEventId === item.id}
        />
      </View>
    </Card>
  );

  const renderMyEvent = ({ item }: { item: Event }) => {
    const isApproved = item.status === 'approved';
    return (
      <Card key={item.id} style={styles.eventCard}>
        <View style={styles.cardHeader}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.eventImage} resizeMode="cover" />
          ) : (
            <View style={[styles.eventImagePlaceholder, { backgroundColor: Colors[colorScheme].secondary + '10' }]}>
              <FontAwesome name="music" size={24} color={Colors[colorScheme].secondary} />
            </View>
          )}
          <View style={styles.titleContainer}>
            <Text style={[styles.eventTitle, { color: Colors[colorScheme].text }]}>
               {item.title}
            </Text>
            <View style={styles.badgeRow}>
              <Badge 
                label={isApproved ? 'Aprobado' : 'Pendiente'} 
                variant={isApproved ? 'success' : 'warning'} 
              />
            </View>
          </View>
        </View>
        <View style={styles.buttonRow}>
          <Button 
            title="Editar" 
            icon="edit"
            size="sm"
            style={{flex: 1, marginRight: Spacing.xs}}
            onPress={() => router.push(`/submit?editId=${item.id}`)} 
          />
          <Button 
            title="Eliminar" 
            icon="trash"
            size="sm"
            variant="outline"
            style={{flex: 1, marginLeft: Spacing.xs}}
            onPress={() => handleCreatorDelete(item.id)} 
            loading={processingEventId === item.id}
          />
        </View>
      </Card>
    );
  };

  if (authLoading) {
     return (
       <View style={[styles.centerContainer, { backgroundColor: Colors[colorScheme].background }]}>
         <ActivityIndicator size="large" color={Colors[colorScheme].primary}/>
       </View>
     );
  }

  if (!user) {
    return (
       <View style={[styles.container, { justifyContent: 'center', backgroundColor: Colors[colorScheme].background }]}>
         <WebContainer maxWidth={480}>
           <Card style={styles.authCard}>
             <View style={styles.authHeader}>
               <View style={[styles.logoIconCircle, { backgroundColor: Colors[colorScheme].primary + '15' }]}>
                 <FontAwesome name="user-circle" size={40} color={Colors[colorScheme].primary} />
               </View>
               <Text style={[styles.title, { color: Colors[colorScheme].text, textAlign: 'center' }]}>Ingresar</Text>
               <Text style={{ color: Colors[colorScheme].textMuted, textAlign: 'center', fontSize: 14, marginTop: 4 }}>
                 Publicá y guardá tus shows favoritos
               </Text>
             </View>

             <TextInput 
               style={[styles.input, { backgroundColor: Colors[colorScheme].inputBackground, borderColor: Colors[colorScheme].inputBorder, color: Colors[colorScheme].text }]} 
               value={email} 
               onChangeText={setEmail} 
               placeholder="Email" 
               placeholderTextColor={Colors[colorScheme].textMuted} 
               autoCapitalize="none" 
               keyboardType="email-address"
             />
             <TextInput 
               style={[styles.input, { backgroundColor: Colors[colorScheme].inputBackground, borderColor: Colors[colorScheme].inputBorder, color: Colors[colorScheme].text }]} 
               value={password} 
               onChangeText={setPassword} 
               placeholder="Contraseña" 
               placeholderTextColor={Colors[colorScheme].textMuted} 
               secureTextEntry 
             />
             
             {feedbackMsg && (
               <View style={[styles.feedbackWrapper, { backgroundColor: feedbackMsg.type === 'error' ? Colors[colorScheme].dangerLight : Colors[colorScheme].successLight }]}>
                 <Text style={[styles.feedbackText, { color: feedbackMsg.type === 'error' ? Colors[colorScheme].danger : Colors[colorScheme].success }]}>
                   {feedbackMsg.text}
                 </Text>
               </View>
             )}

             <Button title="Entrar" icon="sign-in" onPress={handleLogin} loading={authActionLoading} style={{marginTop: Spacing.sm}}/>
             
             <TouchableOpacity 
               onPress={handleForgotPassword} 
               disabled={authActionLoading}
               style={styles.forgotBtn}
             >
               <Text style={{ color: Colors[colorScheme].primary, fontWeight: '600', fontSize: 14 }}>
                 ¿Olvidaste tu contraseña?
               </Text>
             </TouchableOpacity>

             <View style={[styles.divider, { backgroundColor: Colors[colorScheme].border }]} />

             <Text style={[styles.registerPrompt, { color: Colors[colorScheme].textMuted }]}>
               ¿No tenés cuenta todavía?
             </Text>
             <Button title="Registrarse" icon="user-plus" variant="outline" onPress={handleRegister} loading={authActionLoading}/>
           </Card>
         </WebContainer>
       </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <WebContainer style={{ flex: 1 }}>
        {/* Profile Card Header */}
        <View style={styles.header}>
          <View style={styles.profileMeta}>
            <View style={[styles.avatar, { backgroundColor: Colors[colorScheme].primary }]}>
              <Text style={styles.avatarText}>{email.charAt(0).toUpperCase() || 'U'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.profileTitle, { color: Colors[colorScheme].text }]}>Hola,</Text>
              <Text style={[styles.profileEmail, { color: Colors[colorScheme].textMuted }]} numberOfLines={1}>
                {user.email} 
              </Text>
              <View style={styles.roleBadgeRow}>
                <Badge label={`Rol: ${role}`} variant={role === 'admin' ? 'danger' : 'info'} />
              </View>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutIconBtn}>
              <FontAwesome name="sign-out" size={22} color={Colors[colorScheme].textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          style={{ flex: 1 }} 
          contentContainerStyle={{ paddingBottom: Spacing.xxl }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={onProfileRefresh} tintColor={Colors[colorScheme].primary} />}
        >
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.subtitle, { color: Colors[colorScheme].text }]}>Mis Eventos Propuestos</Text>
              <TouchableOpacity onPress={onProfileRefresh} style={{ padding: Spacing.xs }}>
                 <FontAwesome name="refresh" size={16} color={Colors[colorScheme].primary} />
              </TouchableOpacity>
            </View>
            {myEvents.length === 0 ? (
              <EmptyState 
                icon="plus-circle" 
                title="Sin eventos propuestos" 
                subtitle="Todos los eventos que publiques aparecerán en esta sección." 
              />
            ) : (
              myEvents.map(ev => renderMyEvent({ item: ev }))
            )}
          </View>

          {role === 'admin' && (
            <View style={[styles.section, styles.adminSection, { borderTopColor: Colors[colorScheme].border }]}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.subtitle, { color: Colors[colorScheme].text }]}>Moderación (Pendientes)</Text>
                <TouchableOpacity onPress={onProfileRefresh} style={{ padding: Spacing.xs }}>
                   <FontAwesome name="refresh" size={16} color={Colors[colorScheme].primary} />
                </TouchableOpacity>
              </View>
              {events.length === 0 ? (
                  <EmptyState 
                    icon="thumbs-up" 
                    title="Al día" 
                    subtitle="No hay eventos pendientes de aprobación." 
                  />
              ) : (
                  events.map(ev => renderPendingFeature({ item: ev }))
              )}
            </View>
          )}
        </ScrollView>
      </WebContainer>

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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authCard: {
    marginHorizontal: Spacing.md,
    padding: Spacing.lg,
  },
  authHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: Spacing.md,
  },
  feedbackWrapper: {
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  feedbackText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  forgotBtn: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  divider: {
    height: 1,
    marginVertical: Spacing.lg,
    opacity: 0.2,
  },
  registerPrompt: {
    textAlign: 'center',
    marginBottom: Spacing.sm,
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB20',
  },
  profileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: 'bold',
  },
  profileTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  profileEmail: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  roleBadgeRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  logoutIconBtn: {
    padding: Spacing.sm,
  },
  section: {
    padding: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  adminSection: {
    borderTopWidth: 1,
    marginTop: Spacing.md,
    paddingTop: Spacing.lg,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  eventCard: {
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  eventImage: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
  },
  eventImagePlaceholder: {
    width: 64,
    height: 64,
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
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
});
