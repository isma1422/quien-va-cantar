import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, RefreshControl, TextInput } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Event } from '@/services/api';
import { getPendingEvents, updateEventStatus, deleteEvent } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { auth, db } from '@/services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function ProfileScreen() {
  const { user, role, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authActionLoading, setAuthActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{type: 'error'|'success', text: string} | null>(null);

  const colorScheme = useColorScheme() ?? 'light';

  const loadPending = useCallback(async () => {
    if (role !== 'admin') return;
    setLoading(true);
    const data = await getPendingEvents();
    setEvents(data);
    setLoading(false);
  }, [role]);

  useEffect(() => {
    if (user) {
      loadPending();
    }
  }, [user, loadPending]);

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

         <Button title={authActionLoading ? "Cargando..." : "Entrar"} onPress={handleLogin} disabled={authActionLoading} style={{marginTop: Spacing.md}}/>
         <Button title="Crear cuenta nueva" variant="outline" style={{marginTop: Spacing.sm}} onPress={handleRegister} disabled={authActionLoading}/>
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

      {role === 'admin' && (
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
