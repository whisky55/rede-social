import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { PrimaryButton } from '../components/Button';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            Alert.alert('Erro', 'Documento do usuário não encontrado.');
          }
        }
      } catch (error) {
        Alert.alert('Erro', 'Ocorreu um erro ao buscar os dados.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const logout = async () => {
    try {
      await auth.signOut();
     
    } catch (error) {
      Alert.alert('Erro', 'Erro ao sair da conta.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="blue" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Minha Conta</Text>

      <Text style={styles.label}>Nome:</Text>
      <Text style={styles.info}>{userData?.name || '---'}</Text>

      <Text style={styles.label}>Telefone:</Text>
      <Text style={styles.info}>{userData?.phone || '---'}</Text>

      <Text style={styles.label}>E-mail:</Text>
      <Text style={styles.info}>{userData?.email || '---'}</Text>

      <PrimaryButton text="Sair da conta" action={logout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 25,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 30,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 18,
    marginTop: 10,
  },
  info: {
    fontSize: 18,
    marginBottom: 10,
  },
});
