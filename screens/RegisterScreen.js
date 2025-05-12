import { useEffect, useState } from 'react';
import {
    SafeAreaView,
    Text,
    View,
    StyleSheet,
    TextInput
} from "react-native";
import { useNavigation } from '@react-navigation/native';
import {
    auth,
    createUserWithEmailAndPassword
} from '../firebase';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { PrimaryButton, SecondaryButton } from '../components/Button.js';
import { EmailInput, PasswordInput } from '../components/CustomInput.js';

export default function RegisterScreen () {
    const navigation = useNavigation();

    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

    const [ name, setName ] = useState('');
    const [ phone, setPhone ] = useState('');
    const [ email, setEmail ] = useState('');
    const [ password, setPassword ] = useState('');
    const [ errorMessage, setErrorMessage ] = useState('');

    const register = async () => {
        if (!name || !phone || !email || !password) {
            setErrorMessage('Preencha todos os campos.');
            return;
        }

        if (!regexEmail.test(email)) {
            setErrorMessage('E-mail inválido');
            return;
        }

        if (!regexPassword.test(password)) {
            setErrorMessage('A senha deve conter no mínimo 8 caracteres, letra maiúscula, minúscula, número e símbolo');
            return;
        }

        setErrorMessage('');

        createUserWithEmailAndPassword(auth, email, password)
        .then(async (userCredential) => {
            const user = userCredential.user;

            // salva os dados no Firestore
            await setDoc(doc(db, 'users', user.uid), {
                name,
                phone,
                email
            });

            console.log('Usuário registrado:', user.uid);
        })
        .catch((error) => {
            console.error(error);
            setErrorMessage(error.message);
        });
    };

    useEffect(() => {
        setErrorMessage('');
    }, [email, password, name, phone]);

    return (
        <SafeAreaView>
            <View style={styles.container}>
                <Text style={styles.title}>Registrar-se</Text>

                <TextInput
                    placeholder="Nome completo"
                    placeholderTextColor="black"
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                />
                <TextInput
                    placeholder="Telefone"
                    placeholderTextColor="black"
                    style={styles.input}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                />
                <EmailInput value={email} setValue={setEmail} />
                <PasswordInput value={password} setValue={setPassword} />

                {errorMessage &&
                    <Text style={styles.errorMessage}>{errorMessage}</Text>
                }

                <PrimaryButton text={"Registrar-se"} action={register} />

                <Text style={{ textAlign: 'center' }}>Já tem uma conta?</Text>

                <SecondaryButton text={'Voltar para Login'} action={() => {
                    navigation.goBack();
                }} />
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        margin: 25
    },
    title: {
        fontSize: 45,
        textAlign: 'center',
        marginVertical: 40
    },
    input: {
        width: '100%',
        borderColor: 'black',
        borderWidth: 2,
        borderRadius: 15,
        padding: 15,
        fontSize: 20,
        color: 'black',
        marginVertical: 10
    },
    errorMessage: {
        fontSize: 18,
        textAlign: 'center',
        color: 'red'
    }
});
