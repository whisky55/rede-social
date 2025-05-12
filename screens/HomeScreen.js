import { SafeAreaView, Text, View, StyleSheet, TouchableOpacity, TextInput, ScrollView } from "react-native";
import { auth, signOut, db } from '../firebase';
import { DangerButton, PrimaryButton } from "../components/Button.js";
import { CustomTextInput } from "../components/CustomInput.js";
import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigation } from "@react-navigation/native";

export default function HomeScreen() {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [list, setList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingDescription, setEditingDescription] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (user) {
      loadRecords();
    }
  }, [user]);

  const loadRecords = async () => {
    try {
      const snapshot = await getDocs(
        query(
          collection(db, 'records'),
          where('user_id', '==', user.uid)
        )
      );
      const records = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      // Ordenar por data (se tiver campo 'date')
      // records.sort((a, b) => b.date?.localeCompare(a.date));
      setList(records);
    } catch (error) {
      console.error('Erro ao carregar registros:', error);
    }
  };

  const add = async () => {
    if (!description || !value) {
      console.log('Preencha todos os campos.');
      return;
    }

    try {
      await addDoc(collection(db, 'records'), {
        description,
        value: parseFloat(value),
        user_id: user.uid,
        date: new Date().toISOString().split('T')[0], // formato YYYY-MM-DD
      });
      setDescription('');
      setValue('');
      loadRecords();
    } catch (error) {
      console.error('Erro ao adicionar registro:', error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      navigation.replace('Login');
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  const updateRecord = async (id, newDescription, oldValue) => {
    if (!newDescription) {
      console.log("Descrição vazia.");
      return;
    }

    try {
      const recordRef = doc(db, "records", id);
      await updateDoc(recordRef, { description: newDescription });
      loadRecords();
    } catch (error) {
      console.error("Erro ao atualizar registro:", error);
    }
  };

  const deleteRecord = async (id) => {
    try {
      const recordRef = doc(db, "records", id);
      await deleteDoc(recordRef);
      loadRecords();
    } catch (error) {
      console.error("Erro ao deletar registro:", error);
    }
  };

  const total = list.reduce((acc, item) => acc + parseFloat(item.value || 0), 0).toFixed(2);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.title}>Controle de Gastos</Text>

        <Text style={styles.total}>Total: R$ {total}</Text>

        <TouchableOpacity
          style={styles.accountButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.accountText}>Minha Conta</Text>
        </TouchableOpacity>

        <DangerButton text={'Desconectar'} action={logout} />

        <CustomTextInput
          placeholder={'Descrição do gasto'}
          value={description}
          setValue={setDescription}
        />

        <CustomTextInput
          placeholder={'Valor'}
          value={value}
          setValue={setValue}
          keyboardType="numeric"
        />

        <PrimaryButton text="Adicionar Gasto" action={add} />

        {list.map((item) => (
          <View
            key={item.id}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 10,
            }}
          >
            {editingId === item.id ? (
              <>
                <TextInput
                  style={{ flex: 1, borderBottomWidth: 1, marginRight: 10 }}
                  value={editingDescription}
                  onChangeText={setEditingDescription}
                />
                <TouchableOpacity
                  onPress={() => {
                    updateRecord(item.id, editingDescription, item.value);
                    setEditingId(null);
                    setEditingDescription('');
                  }}
                >
                  <Text style={{ color: 'green', marginRight: 10 }}>Salvar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setEditingId(null);
                    setEditingDescription('');
                  }}
                >
                  <Text style={{ color: 'gray' }}>Cancelar</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={{ flex: 1 }}>{item.description} - R$ {item.value}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setEditingId(item.id);
                    setEditingDescription(item.description);
                  }}
                >
                  <Text style={{ color: 'blue', marginRight: 10 }}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteRecord(item.id)}>
                  <Text style={{ color: 'red' }}>Excluir</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: {
    textAlign: 'center',
    fontSize: 30,
    marginVertical: 20
  },
  total: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20
  },
  accountButton: {
    backgroundColor: '#ddd',
    padding: 10,
    borderRadius: 10,
    alignSelf: 'flex-end',
    marginBottom: 20
  },
  accountText: {
    fontSize: 16,
    color: 'black',
    fontWeight: 'bold'
  }
});
