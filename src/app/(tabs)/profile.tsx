import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useAuthStore } from "../../store/authStore";

export default function ProfileScreen() {
  const router = useRouter();

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  if (!user) {
    return (
      <View className="flex-1 bg-black">
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View className="items-center">
            <View className="w-24 h-24 rounded-full bg-neutral-900 items-center justify-center mb-6">
              <Ionicons name="person-outline" size={42} color="#737373" />
            </View>

            <Text className="text-white text-3xl font-bold">
              Welcome to Raritone
            </Text>

            <Text className="text-neutral-500 text-center mt-3 text-base">
              Sign in to access your profile, orders and Virtual Try-On.
            </Text>

            <Pressable
              onPress={() => router.push("/login")}
              className="bg-white rounded-full py-4 px-12 mt-8"
            >
              <Text className="text-black font-bold text-base">Login</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 24,
          paddingBottom: 100,
        }}
      >
        <Text className="text-white text-3xl font-bold">Profile</Text>

        <View className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 mt-8">
          <View className="w-20 h-20 rounded-full bg-neutral-800 items-center justify-center mb-5">
            {user.profileImage ? (
              <View className="w-20 h-20 rounded-full overflow-hidden">
                <View className="flex-1 bg-neutral-800" />
              </View>
            ) : (
              <Ionicons name="person" size={36} color="#A3A3A3" />
            )}
          </View>

          <Text className="text-white text-2xl font-bold">{user.name}</Text>

          <Text className="text-neutral-500 mt-2">{user.email}</Text>

          <View className="flex-row items-center mt-5">
            <View className="bg-neutral-900 rounded-full px-4 py-2">
              <Text className="text-neutral-300 text-xs font-semibold uppercase">
                {user.role}
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-6">
          <Pressable
            onPress={() => {}}
            className="bg-neutral-950 border border-neutral-900 rounded-2xl p-5 flex-row items-center"
          >
            <Ionicons name="bag-outline" size={23} color="#FFFFFF" />

            <Text className="text-white font-semibold ml-4 flex-1">
              My Orders
            </Text>

            <Ionicons name="chevron-forward" size={20} color="#737373" />
          </Pressable>

          <Pressable
            onPress={() => router.push("/(tabs)/try-on")}
            className="bg-neutral-950 border border-neutral-900 rounded-2xl p-5 flex-row items-center mt-3"
          >
            <Ionicons name="sparkles-outline" size={23} color="#FFFFFF" />

            <Text className="text-white font-semibold ml-4 flex-1">
              Virtual Try-On
            </Text>

            <Ionicons name="chevron-forward" size={20} color="#737373" />
          </Pressable>

          <Pressable
            onPress={() => {
              logout();
              router.replace("/(tabs)");
            }}
            className="bg-neutral-950 border border-neutral-900 rounded-2xl p-5 flex-row items-center mt-3"
          >
            <Ionicons name="log-out-outline" size={23} color="#EF4444" />

            <Text className="text-red-500 font-semibold ml-4">Logout</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
