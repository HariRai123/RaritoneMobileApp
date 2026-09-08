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

import { signupWithEmail } from "../services/firebaseAuth";

export default function SignupScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail || !password || !confirmPassword) {
      Alert.alert("Missing Information", "Please fill in all the fields.");
      return;
    }

    if (cleanName.length < 2) {
      Alert.alert("Invalid Name", "Please enter your full name.");
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Weak Password",
        "Password must contain at least 6 characters.",
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        "Passwords Don't Match",
        "Please make sure both passwords are the same.",
      );
      return;
    }

    try {
      setLoading(true);

      const { backendUser } = await signupWithEmail(
        cleanName,
        cleanEmail,
        password,
      );

      Alert.alert(
        "Account Created",
        `Welcome to Raritone, ${backendUser.name}!`,
        [
          {
            text: "Continue",
            onPress: () => {
              router.replace("/(tabs)");
            },
          },
        ],
      );
    } catch (error: any) {
      console.log(
        "FIREBASE SIGNUP ERROR:",
        error?.code || error?.message || error,
      );

      let message = "Unable to create your account. Please try again.";

      switch (error?.code) {
        case "auth/email-already-in-use":
          message =
            "An account already exists with this email address. Please sign in instead.";
          break;

        case "auth/invalid-email":
          message = "Please enter a valid email address.";
          break;

        case "auth/weak-password":
          message =
            "Your password is too weak. Please use a stronger password.";
          break;

        case "auth/network-request-failed":
          message = "Network error. Please check your internet connection.";
          break;

        case "auth/operation-not-allowed":
          message = "Email/password authentication is currently disabled.";
          break;

        default:
          message = error?.message || message;
      }

      Alert.alert("Signup Failed", message);
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
          {/* =================================================
              BACK BUTTON
          ================================================= */}

          <Pressable
            onPress={() => router.back()}
            disabled={loading}
            className="mb-8 h-10 w-10 items-center justify-center rounded-full border border-neutral-200"
          >
            <Ionicons name="arrow-back" size={20} color="#111111" />
          </Pressable>

          {/* =================================================
              BRAND
          ================================================= */}

          <View className="items-center mb-10">
            <Text className="text-black text-4xl font-bold tracking-[5px]">
              RARITONE
            </Text>

            <Text className="text-neutral-500 mt-4 text-base">
              Fashion, Reimagined.
            </Text>
          </View>

          {/* =================================================
              SIGNUP CARD
          ================================================= */}

          <View className="bg-white border border-neutral-200 rounded-3xl p-6">
            <Text className="text-black text-2xl font-bold">
              Create account
            </Text>

            <Text className="text-neutral-500 mt-2 mb-8">
              Join Raritone and start shopping.
            </Text>

            {/* =================================================
                NAME
            ================================================= */}

            <Text className="text-neutral-700 text-sm mb-2">Full Name</Text>

            <View className="relative">
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                placeholderTextColor="#A3A3A3"
                autoCapitalize="words"
                autoCorrect={false}
                editable={!loading}
                returnKeyType="next"
                className="bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-4 pr-12 text-black"
              />

              <View className="absolute right-4 top-4">
                <Ionicons name="person-outline" size={21} color="#737373" />
              </View>
            </View>

            {/* =================================================
                EMAIL
            ================================================= */}

            <Text className="text-neutral-700 text-sm mb-2 mt-5">Email</Text>

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

            {/* =================================================
                PASSWORD
            ================================================= */}

            <Text className="text-neutral-700 text-sm mb-2 mt-5">Password</Text>

            <View className="relative">
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Create a password"
                placeholderTextColor="#A3A3A3"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                returnKeyType="next"
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

            {/* =================================================
                CONFIRM PASSWORD
            ================================================= */}

            <Text className="text-neutral-700 text-sm mb-2 mt-5">
              Confirm Password
            </Text>

            <View className="relative">
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your password"
                placeholderTextColor="#A3A3A3"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                returnKeyType="done"
                onSubmitEditing={handleSignup}
                className="bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-4 pr-14 text-black"
              />

              <Pressable
                onPress={() => setShowConfirmPassword((previous) => !previous)}
                disabled={loading}
                className="absolute right-4 top-4"
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#737373"
                />
              </Pressable>
            </View>

            {/* =================================================
                SIGNUP BUTTON
            ================================================= */}

            <Pressable
              onPress={handleSignup}
              disabled={loading}
              className={`rounded-full py-4 items-center mt-7 ${
                loading ? "bg-neutral-300" : "bg-black"
              }`}
            >
              {loading ? (
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="#FFFFFF" />

                  <Text className="text-white font-bold ml-2">
                    Creating account...
                  </Text>
                </View>
              ) : (
                <Text className="text-white font-bold">Create Account</Text>
              )}
            </Pressable>

            {/* =================================================
                LOGIN LINK
            ================================================= */}

            <Pressable
              disabled={loading}
              onPress={() => router.replace("/login")}
              className="items-center mt-7"
            >
              <Text className="text-neutral-500">
                Already have an account?{" "}
                <Text className="text-black font-semibold">Sign In</Text>
              </Text>
            </Pressable>
          </View>

          {/* =================================================
              FOOTER
          ================================================= */}

          <View className="items-center mt-8">
            <Text className="text-neutral-400 text-xs text-center">
              By creating an account, you agree to our Terms
              {"\n"}
              and Privacy Policy.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
