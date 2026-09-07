import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function TryOnResultScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  return (
    <View className="flex-1 bg-black items-center justify-center px-6">
      <Text className="text-white text-2xl font-bold">Try-On Result</Text>

      <Text className="text-neutral-500 mt-3 text-center">
        Session ID: {String(id)}
      </Text>
    </View>
  );
}
