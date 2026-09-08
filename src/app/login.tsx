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
  StatusBar,
  Text,
  TextInput,
  View,
} from "react-native";

import { loginWithEmail, loginWithGoogle } from "../services/firebaseAuth";

export default function LoginScreen() {
  const router = useRouter();

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

      const { backendUser } = await loginWithEmail(cleanEmail, password);

      Alert.alert("Welcome Back", `Welcome, ${backendUser.name}!`, [
        {
          text: "Continue",
          onPress: () => {
            router.replace("/(tabs)");
          },
        },
      ]);
    } catch (error: any) {
      console.log(
        "FIREBASE LOGIN ERROR:",
        error?.code || error?.message || error,
      );

      let message = "Unable to login. Please try again.";

      switch (error?.code) {
        case "auth/invalid-credential":
          message = "Invalid email or password.";
          break;

        case "auth/user-not-found":
          message = "No account found with this email.";
          break;

        case "auth/wrong-password":
          message = "Incorrect password.";
          break;

        case "auth/invalid-email":
          message = "Please enter a valid email address.";
          break;

        case "auth/too-many-requests":
          message = "Too many login attempts. Please try again later.";
          break;

        case "auth/network-request-failed":
          message = "Network error. Please check your internet connection.";
          break;

        case "auth/user-disabled":
          message = "This Firebase account has been disabled.";
          break;

        default:
          message = error?.message || message;
      }

      Alert.alert("Login Failed", message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);

      const { backendUser } = await loginWithGoogle();

      Alert.alert("Welcome", `Welcome, ${backendUser.name}!`, [
        {
          text: "Continue",
          onPress: () => {
            router.replace("/(tabs)");
          },
        },
      ]);
    } catch (error: any) {
      console.log(
        "GOOGLE LOGIN ERROR:",
        error?.code || error?.message || error,
      );

      // User cancelled Google sign-in.
      if (error?.code === "SIGN_IN_CANCELLED" || error?.code === "12501") {
        return;
      }

      let message = "Unable to sign in with Google. Please try again.";

      if (error?.code === "DEVELOPER_ERROR") {
        message =
          "Google Sign-In configuration is incorrect. Please check the Android SHA-1 and OAuth configuration.";
      } else if (error?.code === "PLAY_SERVICES_NOT_AVAILABLE") {
        message = "Google Play Services is not available on this device.";
      } else if (error?.message) {
        message = error.message;
      }

      Alert.alert("Google Sign-In Failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

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
          {/* BRAND */}

          <View className="items-center mb-12">
            <Text className="text-black text-4xl font-bold tracking-[5px]">
              RARITONE
            </Text>

            <Text className="text-neutral-500 mt-4 text-base">
              Fashion, Reimagined.
            </Text>
          </View>

          {/* LOGIN CARD */}

          <View className="bg-white border border-neutral-200 rounded-3xl p-6">
            <Text className="text-black text-2xl font-bold">Welcome back</Text>

            <Text className="text-neutral-500 mt-2 mb-8">
              Sign in to continue shopping.
            </Text>

            {/* EMAIL */}

            <Text className="text-neutral-700 text-sm mb-2">Email</Text>

            <View className="relative">
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor="#A3A3A3"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!loading}
                returnKeyType="next"
                className="bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-4 pr-12 text-black"
              />

              <View className="absolute right-4 top-4">
                <Ionicons name="mail-outline" size={21} color="#737373" />
              </View>
            </View>

            {/* PASSWORD */}

            <Text className="text-neutral-700 text-sm mb-2 mt-5">Password</Text>

            <View className="relative">
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor="#A3A3A3"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                className="bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-4 pr-14 text-black"
              />

              <Pressable
                onPress={() => setShowPassword((previous) => !previous)}
                disabled={loading}
                className="absolute right-4 top-4"
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#737373"
                />
              </Pressable>
            </View>

            {/* FORGOT PASSWORD */}

            <Pressable disabled={loading} className="self-end mt-3">
              <Text className="text-neutral-600 text-sm font-medium">
                Forgot Password?
              </Text>
            </Pressable>

            {/* LOGIN BUTTON */}

            <Pressable
              onPress={handleLogin}
              disabled={loading}
              className={`rounded-full py-4 items-center mt-7 ${
                loading ? "bg-neutral-300" : "bg-black"
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
                <Text className="text-white font-bold">Sign In</Text>
              )}
            </Pressable>

            {/* DIVIDER */}

            <View className="flex-row items-center my-7">
              <View className="flex-1 h-[1px] bg-neutral-200" />

              <Text className="text-neutral-400 text-xs mx-4">OR</Text>

              <View className="flex-1 h-[1px] bg-neutral-200" />
            </View>

            {/* GOOGLE */}

            <Pressable
              onPress={handleGoogleLogin}
              disabled={loading}
              className={`border border-neutral-200 rounded-full py-4 items-center justify-center ${
                loading ? "opacity-50" : ""
              }`}
            >
              <View className="flex-row items-center">
                {loading ? (
                  <ActivityIndicator size="small" color="#111111" />
                ) : (
                  <Ionicons name="logo-google" size={19} color="#111111" />
                )}

                <Text className="text-black font-semibold ml-3">
                  Continue with Google
                </Text>
              </View>
            </Pressable>

            {/* SIGN UP */}

            <Pressable
              disabled={loading}
              onPress={() => router.navigate("/signup")}
              className="items-center mt-7"
            >
              <Text className="text-neutral-500">
                Don't have an account?{" "}
                <Text className="text-black font-semibold">Sign Up</Text>
              </Text>
            </Pressable>
          </View>

          <View className="items-center mt-8">
            <Text className="text-neutral-400 text-xs">
              Secure authentication powered by Raritone
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
