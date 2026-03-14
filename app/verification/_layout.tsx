import { Stack } from 'expo-router';

export default function VerificationLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="documents" />
      <Stack.Screen name="identity" />
    </Stack>
  );
}
