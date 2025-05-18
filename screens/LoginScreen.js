import { useEffect, useState } from 'react';
import {
    SafeAreaView,
    Text,
    View,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from "react-native";
import { useNavigation } from '@react-navigation/native';
import {
    auth,
    signInWithEmailAndPassword
} from '../firebase';
import { PrimaryButton, SecondaryButton } from '../components/Button.js';
import { EmailInput, PasswordInput } from '../components/CustomInput.js';

export default function LoginScreen() {
    const navigation = useNavigation();

    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const login = async () => {
        if (!email || !password) {
            setErrorMessage('Informe o e-mail e senha.');
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

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredentials) => {
                const user = userCredentials.user;
                console.log(user);
            })
            .catch((error) => {
                setErrorMessage(error.message);
            });
    };

    useEffect(() => {
        setErrorMessage('');
    }, [email, password]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollView}>
                    <Text style={styles.title}>Bem-vindo</Text>

                    <EmailInput value={email} setValue={setEmail} />
                    <PasswordInput value={password} setValue={setPassword} />

                    <TouchableOpacity
                        onPress={() => navigation.push('ForgotPassword')}
                        style={styles.forgotPassword}
                    >
                        <Text style={styles.forgotText}>Esqueci a senha</Text>
                    </TouchableOpacity>

                    {errorMessage !== '' && (
                        <Text style={styles.errorMessage}>{errorMessage}</Text>
                    )}

                    <PrimaryButton text="Entrar" action={login} />

                    <View style={styles.registerContainer}>
                        <Text style={styles.registerText}>Ainda não tem uma conta?</Text>
                        <SecondaryButton text="Registrar-se" action={() => navigation.push('Register')} />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    keyboardView: {
        flex: 1,
    },
    scrollView: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        textAlign: 'center',
        color: '#1F2937', // Gray-800
        marginBottom: 32,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginTop: 10,
        marginBottom: 15,
    },
    forgotText: {
        color: '#4F46E5', // Indigo
        fontSize: 14,
        fontWeight: '500',
    },
    errorMessage: {
        color: '#EF4444', // Red
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 10,
    },
    registerContainer: {
        marginTop: 30,
        alignItems: 'center',
    },
    registerText: {
        fontSize: 15,
        marginBottom: 12,
        color: '#6B7280', // Gray-500
    },
});
