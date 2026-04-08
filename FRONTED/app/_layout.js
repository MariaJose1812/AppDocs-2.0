import { Stack } from 'expo-router';
import { ThemeProvider } from '../hooks/themeContext'; // Ajusta la ruta si es necesario

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Aquí tus pantallas se cargarán automáticamente */}
        <Stack.Screen name="index" />
      </Stack>
    </ThemeProvider>
  );
}