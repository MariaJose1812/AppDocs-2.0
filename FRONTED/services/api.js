//Para que Expo/Electron se comuniquen con el servidor
import axios from 'axios';
import {Platform} from 'react-native';

const API_URL = Platform.OS === 'web' ? 'http://localhost:3000' : 'http://192.168.88.115:3000';

const api = axios.create({
  baseURL: API_URL,
});

export default api;