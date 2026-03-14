import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import '@/i18n';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="parking" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="listing" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="verification" options={{ headerShown: false, presentation: 'modal' }} />
      </Stack>
    </>
  );
}
