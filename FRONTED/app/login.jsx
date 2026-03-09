import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, Button } from 'react-native';
import api from '../services/api'; 
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const router = useRouter(); 
  const [usuarios, setUsuarios] = useState([]);
  const [userSeleccionado, setUserSeleccionado] = useState(null);
  const [pass, setPass] = useState('');

  //Cargar técnicos al abrir la app
  useEffect(() => {
    api.get('/usuarios')
      .then(res => setUsuarios(res.data))
      .catch(err => console.log("Error cargando usuarios:", err));
  }, []);

  const intentarLogin = async () => {
    try {
      const res = await api.post('/auth/login', {
        idUsuarios: userSeleccionado.idUsuarios,
        conUsu: pass
      });

      if (res.data.token) {
        await AsyncStorage.setItem('userToken', res.data.token);
        setUserSeleccionado(null);
        router.replace('/dashboard');
      }
    } catch (err) {
      console.log("ERROR COMPLETO:", err.response?.data || err.message);
      alert("Contraseña incorrecta o error de conexión");
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Selecciona tu Perfil</Text>
      
      <FlatList
        data={usuarios}
        keyExtractor={(item) => item.idUsuarios.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={{ padding: 20, backgroundColor: '#f0f0f0', marginVertical: 5 }}
            onPress={() => setUserSeleccionado(item)}
          >
            <Text>{item.nomUsu}</Text>
            <Text style={{ fontSize: 10 }}>{item.cargoUsu}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Modal para ingresar contraseña */}
      <Modal visible={!!userSeleccionado} transparent={true}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10 }}>
            <Text>Contraseña para {userSeleccionado?.nomUsu}:</Text>
            <TextInput 
              secureTextEntry 
              style={{ borderBottomWidth: 1, marginVertical: 10 }}
              onChangeText={setPass}
            />
            <Button title="Entrar" onPress={intentarLogin} />
            <Button title="Cancelar" color="red" onPress={() => setUserSeleccionado(null)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

