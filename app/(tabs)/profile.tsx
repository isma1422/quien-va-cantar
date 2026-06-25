import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, RefreshControl, TextInput, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
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

export default function ProfileScreen() {
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
      if (user) {
        loadPending(false);
        loadMyEvents();
      }
    }, [user, loadPending, loadMyEvents])
  );

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
      // Create user doc defaults to basic 'user'
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
      await updateEventStatus(id, 'approved');
      Alert.alert("Aprobado", "El evento ya está en el calendario.");
      loadPending(false);
      loadMyEvents();
    } catch(e) {}
    finally {
      setProcessingEventId(null);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert("Rechazar Evento", "¿Seguro que deseas eliminar este evento pendiente?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: async () => {
          setProcessingEventId(id);
          try {
            await deleteEvent(id);
            Alert.alert("Eliminado", "El evento ha sido descartado.");
            loadPending(false);
          } catch(e) {}
          finally {
            setProcessingEventId(null);
          }
      }}
    ]);
  };

  const handleCreatorDelete = async (id: string) => {
    Alert.alert("Confirmar Eliminación", "¿Estás seguro de que deseas borrar tu evento para siempre?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Borrar", style: "destructive", onPress: async () => {
          setProcessingEventId(id);
          try {
            await deleteEvent(id);
            Alert.alert("Eliminado", "Tu evento ha sido borrado.");
            loadMyEvents();
          } catch(e) {}
          finally {
            setProcessingEventId(null);
          }
      }}
    ]);
  };

  const renderPendingFeature = ({ item }: { item: Event }) => (
    <Card>
      <View style={{ flexDirection: 'row', marginBottom: Spacing.sm }}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={{ width: 80, height: 80, borderRadius: 8, marginRight: Spacing.md }} resizeMode="cover" />
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={[styles.eventTitle, { color: Colors[colorScheme].text, fontSize: 16 }]}>{item.title}</Text>
          <Text style={{ color: Colors[colorScheme].textMuted, fontSize: 12, marginBottom: 2 }}>
            {new Date(item.date).toLocaleDateString()} @ {item.place}
          </Text>
        </View>
      </View>
      <Text style={{ color: Colors[colorScheme].text, marginBottom: Spacing.md, fontSize: 13 }} numberOfLines={2}>{item.description}</Text>
      
      <View style={styles.buttonRow}>
        <Button 
          title="Aprobar" 
          style={{flex: 1, marginRight: Spacing.xs}}
          onPress={() => handleApprove(item.id)} 
          loading={processingEventId === item.id}
        />
        <Button 
          title="Rechazar" 
          variant="outline"
          style={{flex: 1, marginLeft: Spacing.xs}}
          onPress={() => handleDelete(item.id)} 
          loading={processingEventId === item.id}
        />
      </View>
    </Card>
  );

  const renderMyEvent = ({ item }: { item: Event }) => (
    <Card key={item.id} style={{ marginBottom: Spacing.md }}>
      <View style={{ flexDirection: 'row', marginBottom: Spacing.sm }}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={{ width: 80, height: 80, borderRadius: 8, marginRight: Spacing.md }} resizeMode="cover" />
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={[styles.eventTitle, { color: Colors[colorScheme].text, fontSize: 16 }]}>
             {item.title}{' '}
             <Text style={{fontSize: 12, color: item.status === 'approved' ? Colors[colorScheme].primary : '#FF8800', fontWeight: '500'}}>
               ({item.status === 'approved' ? 'Aprobado' : 'Pendiente'})
             </Text>
          </Text>
          <Text style={{ color: Colors[colorScheme].textMuted, fontSize: 12 }}>
            {new Date(item.date).toLocaleDateString()} @ {item.place}
          </Text>
        </View>
      </View>
      <View style={styles.buttonRow}>
        <Button 
          title="Editar" 
          style={{flex: 1, marginRight: Spacing.xs}}
          onPress={() => router.push(`/submit?editId=${item.id}`)} 
        />
        <Button 
          title="Eliminar" 
          variant="outline"
          style={{flex: 1, marginLeft: Spacing.xs}}
          onPress={() => handleCreatorDelete(item.id)} 
          loading={processingEventId === item.id}
        />
      </View>
    </Card>
  );

  if (authLoading) {
     return <View style={styles.centerContainer}><ActivityIndicator size="large" color={Colors[colorScheme].primary}/></View>
  }

  if (!user) {
    return (
       <View style={[styles.container, { padding: Spacing.lg, justifyContent: 'center', backgroundColor: Colors[colorScheme].background }]}>
         <Text style={[styles.title, { color: Colors[colorScheme].text, textAlign: 'center', marginBottom: Spacing.xxl }]}>Iniciar Sesión</Text>
         <TextInput 
           style={[styles.input, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border, color: Colors[colorScheme].text }]} 
           value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={Colors[colorScheme].textMuted} autoCapitalize="none" keyboardType="email-address"
         />
         <TextInput 
           style={[styles.input, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border, color: Colors[colorScheme].text }]} 
           value={password} onChangeText={setPassword} placeholder="Contraseña" placeholderTextColor={Colors[colorScheme].textMuted} secureTextEntry 
         />
         
         {feedbackMsg && (
           <Text style={{
             color: feedbackMsg.type === 'error' ? '#FF4444' : '#00C851', 
             marginBottom: Spacing.md, 
             textAlign: 'center',
             fontWeight: '500'
           }}>
             {feedbackMsg.text}
           </Text>
         )}

          <Button title="Entrar" onPress={handleLogin} loading={authActionLoading} style={{marginTop: Spacing.md}}/>
          
          <TouchableOpacity 
            onPress={handleForgotPassword} 
            disabled={authActionLoading}
            style={{ marginTop: Spacing.md, alignItems: 'center' }}
          >
            <Text style={{ color: Colors[colorScheme].primary, fontWeight: '500' }}>
              ¿Olvidaste tu contraseña?
            </Text>
          </TouchableOpacity>

          <View style={{ height: 1, backgroundColor: Colors[colorScheme].border, marginVertical: Spacing.xl, opacity: 0.3 }} />

          <Text style={{ color: Colors[colorScheme].textMuted, textAlign: 'center', marginBottom: Spacing.md }}>
            ¿No tienes cuenta?
          </Text>
          <Button title="Crear cuenta nueva" variant="outline" onPress={handleRegister} loading={authActionLoading}/>
       </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: Colors[colorScheme].text }]}>Perfil</Text>
        <Text style={{ color: Colors[colorScheme].textMuted, fontSize: 16 }}>
          Sesión: {user.email} 
        </Text>
        <Text style={{ color: Colors[colorScheme].primary, fontSize: 14, fontWeight: 'bold' }}>
          Rol: {role.toUpperCase()}
        </Text>
        <Button 
          title="Cerrar Sessión" 
          variant="outline" 
          style={styles.toggleBtn}
          onPress={handleLogout} 
        />
      </View>

      <ScrollView style={{ flex: 1 }} refreshControl={<RefreshControl refreshing={loading} onRefresh={onProfileRefresh} tintColor={Colors[colorScheme].primary} />}>
        <View style={{ padding: Spacing.md, paddingBottom: 0 }}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md}}>
            <Text style={[styles.subtitle, { color: Colors[colorScheme].text, marginBottom: 0 }]}>Mis Eventos</Text>
            <TouchableOpacity onPress={onProfileRefresh} style={{ padding: Spacing.xs }}>
               <FontAwesome name="refresh" size={20} color={Colors[colorScheme].primary} />
            </TouchableOpacity>
          </View>
          {myEvents.length === 0 ? (
            <Text style={{ color: Colors[colorScheme].textMuted }}>No has propuesto ningún evento aún.</Text>
          ) : (
            myEvents.map(ev => renderMyEvent({ item: ev }))
          )}
        </View>

        {role === 'admin' && (
          <View style={styles.adminSection}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md}}>
              <Text style={[styles.subtitle, { color: Colors[colorScheme].text, marginBottom: 0 }]}>Administración (Pendientes)</Text>
              <TouchableOpacity onPress={onProfileRefresh} style={{ padding: Spacing.xs }}>
                 <FontAwesome name="refresh" size={20} color={Colors[colorScheme].primary} />
              </TouchableOpacity>
            </View>
            {events.length === 0 ? (
                <Text style={{ color: Colors[colorScheme].textMuted }}>No hay eventos pendientes.</Text>
            ) : (
                events.map(ev => renderPendingFeature({ item: ev }))
            )}
          </View>
        )}
      </ScrollView>
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
    alignItems: 'center'
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.sm,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    fontSize: 16,
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
    marginTop: Spacing.md,
  }
});
