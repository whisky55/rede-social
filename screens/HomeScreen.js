import { SafeAreaView, Text, View, StyleSheet, TouchableOpacity, TextInput, ScrollView } from "react-native";
import { auth, signOut, db } from '../firebase';
import { DangerButton, PrimaryButton } from "../components/Button.js";
import { CustomTextInput } from "../components/CustomInput.js";
import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigation } from "@react-navigation/native";
import moment from "moment";

export default function HomeScreen() {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [list, setList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingDescription, setEditingDescription] = useState('');
  const [editingValue, setEditingValue] = useState('');

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
        query(collection(db, 'records'), where('user_id', '==', user.uid))
      );
      const records = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      const sorted = records.sort((a, b) => b.date.localeCompare(a.date));
      setList(sorted);
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
        date: moment().format('YYYY-MM-DD'),
        user_id: user.uid,
      });
      setDescription('');
      setValue('');
      loadRecords();
    } catch (error) {
      console.error('Erro ao adicionar registro:', error);
    }
  };

  const updateRecord = async (id) => {
    if (!editingDescription || !editingValue) return;
    try {
      const recordRef = doc(db, "records", id);
      await updateDoc(recordRef, {
        description: editingDescription,
        value: parseFloat(editingValue),
      });
      setEditingId(null);
      setEditingDescription('');
      setEditingValue('');
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

  const logout = async () => {
    try {
      await signOut(auth);
      navigation.replace('Login');
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  const groupedByDate = list.reduce((acc, item) => {
    if (!acc[item.date]) acc[item.date] = [];
    acc[item.date].push(item);
    return acc;
  }, {});

  const totalValue = list.reduce((sum, item) => sum + item.value, 0);

  return (
    <SafeAreaView style={{ flex: 1, margin: 20 }}>
      <Text style={styles.title}>Total de Gastos: R$ {totalValue.toFixed(2)}</Text>

      <TouchableOpacity
        style={styles.accountButton}
        onPress={() => navigation.navigate('Profile')}
      >
        <Text style={styles.accountText}>Minha Conta</Text>
      </TouchableOpacity>

      <DangerButton text={'Desconectar'} action={logout} />

      <CustomTextInput placeholder={'Descrição do gasto'} value={description} setValue={setDescription} />
      <CustomTextInput placeholder={'Valor'} value={value} setValue={setValue} keyboardType="numeric" />
      <PrimaryButton text="Adicionar Gasto" action={add} />

      <ScrollView style={{ marginTop: 20 }}>
        {Object.keys(groupedByDate).map(date => (
          <View key={date}>
            <Text style={styles.dateHeader}>{moment(date).format('DD/MM/YYYY')}</Text>
            {groupedByDate[date].map(item => (
              <View key={item.id} style={styles.row}>
                {editingId === item.id ? (
                  <>
                    <TextInput
                      style={styles.input}
                      value={editingDescription}
                      onChangeText={setEditingDescription}
                      placeholder="Descrição"
                    />
                    <TextInput
                      style={styles.input}
                      value={String(editingValue)}
                      onChangeText={setEditingValue}
                      keyboardType="numeric"
                      placeholder="Valor"
                    />
                    <TouchableOpacity onPress={() => updateRecord(item.id)}>
                      <Text style={{ color: 'green', marginRight: 10 }}>Salvar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => {
                      setEditingId(null);
                      setEditingDescription('');
                      setEditingValue('');
                    }}>
                      <Text style={{ color: 'gray' }}>Cancelar</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={{ flex: 1 }}>{item.description} - R$ {item.value.toFixed(2)}</Text>
                    <TouchableOpacity onPress={() => {
                      setEditingId(item.id);
                      setEditingDescription(item.description);
                      setEditingValue(String(item.value));
                    }}>
                      <Text style={{ color: 'blue', marginRight: 10 }}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteRecord(item.id)}>
                      <Text style={{ color: 'red' }}>Excluir</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: {
    textAlign: 'center',
    fontSize: 24,
    marginVertical: 20,
    fontWeight: 'bold'
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
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderColor: '#ccc'
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10
  },
  input: {
    flex: 1,
    borderBottomWidth: 1,
    marginRight: 10
  }
});
