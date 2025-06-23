// navigation/AuthNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Importar do caminho correto agora
import { auth } from '../services/firebaseConfig';

// Screens
import LoginScreen from '../screens/LoginScreen';
import ForgotPassword from '../screens/ForgotPasswordScreen';
// Adicione outras telas de autenticação se necessário

const Stack = createStackNavigator();

const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // ou true se quiser mostrar header
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;