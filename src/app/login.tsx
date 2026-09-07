import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";

export default function LoginScreen() {
  const router = useRouter();

  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      Alert.alert(
        "Missing Information",
        "Please enter your email and password.",
      );
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/login", {
        email: cleanEmail,
        password,
      });

      console.log("LOGIN RESPONSE:", response.data);

      const { token, user } = response.data;

      if (!token || !user) {
        throw new Error("Invalid login response from server.");
      }

      setAuth(token, user);

      Alert.alert("Welcome Back", `Welcome, ${user.name}!`, [
        {
          text: "Continue",
          onPress: () => {
            router.replace("/(tabs)");
          },
        },
      ]);
    } catch (error: any) {
      console.log(
        "LOGIN ERROR:",
        error?.response?.data || error?.message || error,
      );

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to login. Please try again.";

      Alert.alert("Login Failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-black"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: 24,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-xl self-center">
          <View className="items-center mb-12">
            <Text className="text-white text-4xl font-bold tracking-[5px]">
              RARITONE
            </Text>

            <Text className="text-neutral-500 mt-4 text-base">
              Fashion, Reimagined.
            </Text>
          </View>

          <View className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6">
            <Text className="text-white text-2xl font-bold">Welcome back</Text>

            <Text className="text-neutral-500 mt-2 mb-8">
              Sign in to continue shopping.
            </Text>

            <Text className="text-neutral-400 text-sm mb-2">Email</Text>

            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor="#525252"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              editable={!loading}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-4 text-white mb-5"
            />

            <Text className="text-neutral-400 text-sm mb-2">Password</Text>

            <View className="relative">
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor="#525252"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!loading}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-4 pr-14 text-white"
              />

              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4"
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#737373"
                />
              </Pressable>
            </View>

            <Pressable
              onPress={handleLogin}
              disabled={loading}
              className={`rounded-full py-4 items-center mt-7 ${
                loading ? "bg-neutral-700" : "bg-white"
              }`}
            >
              {loading ? (
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="#FFFFFF" />

                  <Text className="text-white font-bold ml-2">
                    Signing in...
                  </Text>
                </View>
              ) : (
                <Text className="text-black font-bold">Sign In</Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
