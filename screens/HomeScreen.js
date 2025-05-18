import { SafeAreaView, Text, View, StyleSheet, TouchableOpacity, TextInput, ScrollView } from "react-native";
import { auth, signOut, db } from '../firebase';
import { DangerButton } from "../components/Button.js";
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
  const [filterDate, setFilterDate] = useState(null);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (user) loadRecords();
  }, [user, filterDate]);

  const loadRecords = async () => {
    try {
      const snapshot = await getDocs(
        query(collection(db, 'records'), where('user_id', '==', user.uid))
      );
      let records = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      if (filterDate) {
        const selected = moment(filterDate).format('YYYY-MM-DD');
        records = records.filter((rec) => rec.date === selected);
      }
      const sorted = records.sort((a, b) => b.date.localeCompare(a.date));
      setList(sorted);
    } catch (error) {
      console.error('Erro ao carregar registros:', error);
    }
  };

  const add = async () => {
    if (!description || !value) return;
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
    <SafeAreaView style={styles.container}>
      <Text style={styles.welcomeText}>👋 Olá, {user?.email}!</Text>
      <Text style={styles.title}>Total de Gastos: R$ {totalValue.toFixed(2)}</Text>

      <TouchableOpacity
        style={styles.accountButton}
        onPress={() => navigation.navigate('Profile')}
      >
        <Text style={styles.accountText}>Minha Conta</Text>
      </TouchableOpacity>

      <DangerButton text={'Desconectar'} action={logout} />

      <View style={{ marginTop: 20 }}>
        <CustomTextInput placeholder={'Descrição do gasto'} value={description} setValue={setDescription} />
        <CustomTextInput placeholder={'Valor'} value={value} setValue={setValue} keyboardType="numeric" />
      </View>

      <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.filterButton}>
        <Text style={styles.filterText}>
          {filterDate ? `📅 ${moment(filterDate).format('DD/MM/YYYY')}` : 'Filtrar por data'}
        </Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={filterDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowPicker(false);
            if (selectedDate) setFilterDate(selectedDate);
          }}
        />
      )}

      <ScrollView style={{ marginTop: 10 }}>
        {Object.keys(groupedByDate).map(date => (
          <View key={date}>
            <Text style={styles.dateHeader}>{moment(date).format('DD/MM/YYYY')}</Text>
            {groupedByDate[date].map(item => (
              <View key={item.id} style={styles.card}>
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
                      <Text style={styles.editText}>Salvar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => {
                      setEditingId(null);
                      setEditingDescription('');
                      setEditingValue('');
                    }}>
                      <Text style={styles.cancelText}>Cancelar</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.description}>
                      {item.description} - R$ {item.value.toFixed(2)}
                    </Text>
                    <TouchableOpacity onPress={() => {
                      setEditingId(item.id);
                      setEditingDescription(item.description);
                      setEditingValue(String(item.value));
                    }}>
                      <Text style={styles.editText}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteRecord(item.id)}>
                      <Text style={styles.deleteText}>Excluir</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.floatingButton} onPress={add}>
        <Text style={styles.floatingButtonText}>＋</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 20,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
    color: '#27428f',
  },
  title: {
    textAlign: 'center',
    fontSize: 24,
    marginBottom: 15,
    fontWeight: 'bold',
    color: '#1e2a78',
  },
  accountButton: {
    backgroundColor: '#e6ecf2',
    padding: 10,
    borderRadius: 10,
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  accountText: {
    fontSize: 16,
    color: '#1e2a78',
    fontWeight: 'bold',
  },
  filterButton: {
    alignSelf: 'flex-start',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#d8e1f2',
    marginVertical: 10,
  },
  filterText: {
    color: '#1e2a78',
    fontWeight: '600',
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  description: {
    flex: 1,
    color: '#333',
  },
  input: {
    flex: 1,
    borderBottomWidth: 1,
    marginRight: 10,
  },
  editText: {
    color: '#0066cc',
    marginHorizontal: 6,
  },
  cancelText: {
    color: '#999',
    marginHorizontal: 6,
  },
  deleteText: {
    color: 'red',
    marginLeft: 6,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#27428f',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
  floatingButtonText: {
    color: '#fff',
    fontSize: 32,
    lineHeight: 32,
  },
});
