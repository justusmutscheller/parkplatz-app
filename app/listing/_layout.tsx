import { Stack } from 'expo-router';

export default function ListingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="create" />
      <Stack.Screen name="verify-ownership" />
      <Stack.Screen name="manage" />
      <Stack.Screen name="dashboard" />
    </Stack>
  );
}
