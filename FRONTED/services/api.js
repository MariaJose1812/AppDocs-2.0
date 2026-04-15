import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, Platform } from "react-native";
import { router } from "expo-router";

const API_URL =
  Platform.OS === "web"
    ? "http://localhost:3000/api"
    : "http://192.168.0.4:3000/api"; /*"http://192.168.88.115:3000/api";*/

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

//Le pegamos el Token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("userToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const originalRequestUrl = error.config.url;

      if (!originalRequestUrl.includes("/login")) {
        await AsyncStorage.removeItem("userToken");

        if (Platform.OS === "web") {
          window.dispatchEvent(new CustomEvent("sessionExpired"));
        } else {
          if (global.__sessionExpiredCallback) {
            global.__sessionExpiredCallback();
          }
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;
