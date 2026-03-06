// Para que Expo/Electron se comuniquen con el servidor
import axios from "axios";
import { Platform } from "react-native";


const API_URL = Platform.OS === 'web' ? 'http://localhost:3000' : 'http://192.168.88.115:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;