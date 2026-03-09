import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, ScrollView } from 'react-native';
import api from '../services/api'; 

export default function actaEntregaScreen() {
  //Estados para capturar lo que el técnico escribe
  const [tipo, setTipo] = useState('IT'); 
  const [asunto, setAsunto] = useState('');
  const [items, setItems] = useState(''); 

  const enviarNuevaActa = async () => {
    // Validación simple
    if (!asunto) {
      Alert.alert("Error", "El asunto es obligatorio");
      return;
    }

    try {
      // Definimos el objeto con los datos del formulario
      const datosDelFormulario = {
        tipo: tipo,
        asunto: asunto,
        idEmpleados: [1, 2], // Datos de prueba
        items: [{ desc: items, estado: 'Bueno' }] // Datos de prueba
      };

      // Enviamos la petición
      const response = await api.post('/actas/procesar', datosDelFormulario);

      // Si todo sale bien
      Alert.alert("Guardado", `Acta creada: ${response.data.correlativo}`);
      
      // Limpiar formulario
      setAsunto('');
      setItems('');

    } catch (error) {
      console.log("Error al guardar:", error.response?.data || error.message);
    }
  };

  return (
    <ScrollView style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>Nueva Acta de Entrega</Text>

      <Text>Asunto:</Text>
      <TextInput 
        value={asunto}
        onChangeText={setAsunto}
        style={{ borderBottomWidth: 1, marginBottom: 20, padding: 5 }}
        placeholder="Ej: Entrega de Laptop a Soporte"
      />

      <Text>Descripción del equipo/item:</Text>
      <TextInput 
        value={items}
        onChangeText={setItems}
        style={{ borderBottomWidth: 1, marginBottom: 20, padding: 5 }}
        placeholder="Ej: Mouse Logitech G502"
      />

      <Button title="GENERAR ACTA" onPress={enviarNuevaActa} color="#09528e" />
    </ScrollView>
  );
}