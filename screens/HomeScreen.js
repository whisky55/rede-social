import {
  SafeAreaView,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SectionList,
} from "react-native";
import { auth, signOut, db } from "../firebase";
import { DangerButton, PrimaryButton } from "../components/Button.js";
import { CustomTextInput } from "../components/CustomInput.js";
import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigation } from "@react-navigation/native";

export default function HomeScreen() {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");
  const [list, setList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingDescription, setEditingDescription] = useState("");
  const [editingValue, setEditingValue] = useState("");

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
        query(collection(db, "records"), where("user_id", "==", user.uid))
      );
      const records = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Ordenar por data decrescente
      records.sort((a, b) => b.date?.localeCompare(a.date));

      // Agrupar por data
      const grouped = records.reduce((acc, item) => {
        const date = item.date || "Sem data";
        if (!acc[date]) acc[date] = [];
        acc[date].push(item);
        return acc;
      }, {});

      const sectionData = Object.entries(grouped).map(([date, data]) => ({
        title: date,
        data,
      }));

      setList(sectionData);
    } catch (error) {
      console.error("Erro ao carregar registros:", error);
    }
  };

  const add = async () => {
    if (!description || !value) {
      console.log("Preencha todos os campos.");
      return;
    }

    try {
      await addDoc(collection(db, "records"), {
        description,
        value: parseFloat(value),
        date: new Date().toISOString().split("T")[0], // YYYY-MM-DD
        user_id: user.uid,
      });
      setDescription("");
      setValue("");
      loadRecords();
    } catch (error) {
      console.error("Erro ao adicionar gasto:", error);
    }
  };

  const updateRecord = async (id, newDescription, newValue) => {
    try {
      const recordRef = doc(db, "records", id);
      await updateDoc(recordRef, {
        description: newDescription,
        value: parseFloat(newValue),
      });
      setEditingId(null);
      setEditingDescription("");
      setEditingValue("");
      loadRecords();
    } catch (error) {
      console.error("Erro ao atualizar gasto:", error);
    }
  };

  const deleteRecord = async (id) => {
    try {
      const recordRef = doc(db, "records", id);
      await deleteDoc(recordRef);
      loadRecords();
    } catch (error) {
      console.error("Erro ao deletar gasto:", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      navigation.replace("Login");
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  // Calcular total de gastos
  const total = list
    .flatMap((section) => section.data)
    .reduce((sum, item) => sum + (parseFloat(item.value) || 0), 0);

  return (
    <SafeAreaView style={{ margin: 20 }}>
      <Text style={styles.title}>Controle de Gastos</Text>
      <Text style={styles.total}>Total: R$ {total.toFixed(2)}</Text>

      <TouchableOpacity
        style={styles.accountButton}
        onPress={() => navigation.navigate("Profile")}
      >
        <Text style={styles.accountText}>Minha Conta</Text>
      </TouchableOpacity>

      <DangerButton text="Desconectar" action={logout} />

      <CustomTextInput
        placeholder="Descrição do gasto"
        value={description}
        setValue={setDescription}
      />
      <CustomTextInput
        placeholder="Valor"
        value={value}
        setValue={setValue}
        keyboardType="numeric"
      />

      <PrimaryButton text="Adicionar Gasto" action={add} />

      <SectionList
        sections={list}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        renderItem={({ item }) =>
          editingId === item.id ? (
            <View style={styles.row}>
              <TextInput
                style={styles.input}
                value={editingDescription}
                onChangeText={setEditingDescription}
                placeholder="Descrição"
              />
              <TextInput
                style={styles.input}
                value={editingValue}
                onChangeText={setEditingValue}
                placeholder="Valor"
                keyboardType="numeric"
              />
              <TouchableOpacity
                onPress={() =>
                  updateRecord(item.id, editingDescription, editingValue)
                }
              >
                <Text style={{ color: "green", marginRight: 10 }}>Salvar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setEditingId(null);
                  setEditingDescription("");
                  setEditingValue("");
                }}
              >
                <Text style={{ color: "gray" }}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.row}>
              <Text style={{ flex: 1 }}>
                {item.description} — R$ {item.value}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setEditingId(item.id);
                  setEditingDescription(item.description);
                  setEditingValue(String(item.value));
                }}
              >
                <Text style={{ color: "blue", marginRight: 10 }}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteRecord(item.id)}>
                <Text style={{ color: "red" }}>Excluir</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: {
    textAlign: "center",
    fontSize: 30,
    marginBottom: 10,
  },
  total: {
    textAlign: "center",
    fontSize: 20,
    marginBottom: 20,
    color: "green",
    fontWeight: "bold",
  },
  accountButton: {
    backgroundColor: "#ddd",
    padding: 10,
    borderRadius: 10,
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  accountText: {
    fontSize: 16,
    color: "black",
    fontWeight: "bold",
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    borderBottomWidth: 1,
    marginRight: 10,
  },
});
