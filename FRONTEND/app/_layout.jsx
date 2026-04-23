import { Stack, useRouter } from "expo-router";
import { ThemeProvider } from "../hooks/themeContext";
import { AlertProvider } from "../context/alertContext";

import { useEffect } from "react";
import { Platform } from "react-native";
import { useAlert } from "../context/alertContext";

function SessionWatcher() {
  const router = useRouter();
  const { showAlert } = useAlert();

  useEffect(() => {
    const handleSessionExpired = () => {
      showAlert({
        title: "Sesión expirada",
        message: "Tu sesión ha caducado. Por favor ingresa de nuevo.",
        buttons: [
          {
            text: "Entrar",
            onPress: () => {
              router.replace("/login");
            },
          },
        ],
      });
    };

    if (Platform.OS === "web") {
      window.addEventListener("sessionExpired", handleSessionExpired);
      return () =>
        window.removeEventListener("sessionExpired", handleSessionExpired);
    } else {
      global.__sessionExpiredCallback = handleSessionExpired;
      return () => {
        delete global.__sessionExpiredCallback;
      };
    }
  }, [showAlert, router]);

  return null;
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AlertProvider>
        <SessionWatcher />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
        </Stack>
      </AlertProvider>
    </ThemeProvider>
  );
}
