import { SafeAreaView, Text, StyleSheet, TouchableOpacity } from "react-native";
import { auth, signOut, db } from '../firebase';
import { DangerButton, PrimaryButton } from "../components/Button.js";
import { CustomTextInput } from "../components/CustomInput.js";
import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigation } from "@react-navigation/native";

export default function HomeScreen() {
    const navigation = useNavigation();
    const [user, setUser] = useState(null);
    const [text, setText] = useState('');
    const [list, setList] = useState([]);

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
            setList(records);
        } catch (error) {
            console.error('Erro ao carregar registros:', error);
        }
    };

    const add = async () => {
        if (!text) {
            console.log('Preencha o campo.');
            return;
        }

        try {
            await addDoc(collection(db, 'records'), {
                text: text,
                user_id: user.uid
            });
            setText('');
            loadRecords();
        } catch (error) {
            console.error('Erro ao adicionar registro:', error);
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            navigation.replace('Login'); // ou 'Welcome', conforme sua navegação
        } catch (error) {
            console.error('Erro ao sair:', error);
        }
    };

    return (
        <SafeAreaView style={{ margin: 20 }}>
            <Text style={styles.title}>TO DO LIST</Text>

            {/* Botão de perfil */}
            <TouchableOpacity
                style={styles.accountButton}
                onPress={() => navigation.navigate('Profile')}
            >
                <Text style={styles.accountText}>Minha Conta</Text>
            </TouchableOpacity>

            <DangerButton text={'Desconectar'} action={logout} />

            <CustomTextInput placeholder={'Digite o texto...'} value={text} setValue={setText} />

            <PrimaryButton text="Adicionar Registro" action={add} />

            {list.map((item) => (
                <Text key={item.id}>{item.text}</Text>
            ))}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    title: {
        textAlign: 'center',
        fontSize: 30,
        margin: 40
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
