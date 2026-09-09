import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { loginWithEmail, loginWithGoogle } from "../services/firebaseAuth";

import { useAuthStore } from "../store/authStore";

export default function LoginScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Zustand auth store
  const setUser = useAuthStore((state) => state.setUser);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // --------------------------------------------------
  // RESPONSIVE VALUES
  // --------------------------------------------------

  const isSmallPhone = width < 360;
  const isPhone = width < 600;
  const isTablet = width >= 600;
  const isLargeTablet = width >= 900;

  const horizontalPadding = isSmallPhone
    ? 16
    : isPhone
      ? 20
      : isTablet
        ? 40
        : 56;

  const contentWidth = Math.min(
    width - horizontalPadding * 2,
    isLargeTablet ? 560 : 520,
  );

  const logoSize = isSmallPhone ? 27 : isPhone ? 31 : isTablet ? 38 : 42;

  const logoLetterSpacing = isSmallPhone ? 3 : isPhone ? 4 : 5;

  const brandMarginBottom = isSmallPhone ? 28 : isPhone ? 36 : 48;

  const cardPadding = isSmallPhone ? 18 : isPhone ? 22 : 28;

  const cardRadius = isSmallPhone ? 24 : 30;

  const titleSize = isSmallPhone ? 22 : isPhone ? 24 : 28;

  const subtitleSize = isSmallPhone ? 14 : 15;

  const inputHeight = isSmallPhone ? 52 : 56;

  const buttonHeight = isSmallPhone ? 52 : 56;

  const googleIconSize = isSmallPhone ? 20 : 22;

  const verticalTopPadding = Math.max(insets.top + 16, isSmallPhone ? 18 : 24);

  const verticalBottomPadding = Math.max(insets.bottom + 24, 32);

  // --------------------------------------------------
  // EMAIL LOGIN
  // --------------------------------------------------

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

      // IMPORTANT:
      // Save backend user into Zustand.
      setUser({
        id: backendUser._id,
        firebaseUid: backendUser.firebaseUid,
        name: backendUser.name,
        email: backendUser.email,
        phone: backendUser.phone,
        role: backendUser.role,
        profileImage: backendUser.profileImage,
        provider: backendUser.provider,
        isActive: backendUser.isActive,
        createdAt: backendUser.createdAt,
        updatedAt: backendUser.updatedAt,
      });

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

  // --------------------------------------------------
  // GOOGLE LOGIN
  // --------------------------------------------------

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);

      const { backendUser } = await loginWithGoogle();

      // IMPORTANT:
      // Save Google user into Zustand too.
      setUser({
        id: backendUser._id,
        firebaseUid: backendUser.firebaseUid,
        name: backendUser.name,
        email: backendUser.email,
        phone: backendUser.phone,
        role: backendUser.role,
        profileImage: backendUser.profileImage,
        provider: backendUser.provider,
        isActive: backendUser.isActive,
        createdAt: backendUser.createdAt,
        updatedAt: backendUser.updatedAt,
      });

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

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: "center",
            paddingHorizontal: horizontalPadding,
            paddingTop: verticalTopPadding,
            paddingBottom: verticalBottomPadding,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              width: contentWidth,
              flex: 1,
              justifyContent: height > 700 ? "center" : "flex-start",
            }}
          >
            {/* ====================================== */}
            {/* BRAND */}
            {/* ====================================== */}

            <View
              className="items-center"
              style={{
                marginBottom: brandMarginBottom,
              }}
            >
              <Text
                className="text-black font-bold"
                style={{
                  fontSize: logoSize,
                  letterSpacing: logoLetterSpacing,
                }}
              >
                RARITONE
              </Text>

              <Text
                className="text-neutral-500"
                style={{
                  marginTop: isSmallPhone ? 8 : 10,
                  fontSize: isSmallPhone ? 14 : 15,
                }}
              >
                Fashion, Reimagined.
              </Text>
            </View>

            {/* ====================================== */}
            {/* LOGIN CARD */}
            {/* ====================================== */}

            <View
              className="bg-white border border-neutral-200"
              style={{
                width: "100%",
                borderRadius: cardRadius,
                padding: cardPadding,
              }}
            >
              <Text
                className="text-black font-bold"
                style={{
                  fontSize: titleSize,
                  lineHeight: titleSize + 5,
                }}
              >
                Welcome back
              </Text>

              <Text
                className="text-neutral-500"
                style={{
                  marginTop: 8,
                  marginBottom: isSmallPhone ? 22 : 28,
                  fontSize: subtitleSize,
                  lineHeight: subtitleSize + 6,
                }}
              >
                Sign in to continue shopping.
              </Text>

              {/* ================================== */}
              {/* EMAIL */}
              {/* ================================== */}

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
                  textContentType="emailAddress"
                  autoComplete="email"
                  editable={!loading}
                  returnKeyType="next"
                  style={{
                    height: inputHeight,
                    paddingLeft: 16,
                    paddingRight: 48,
                    fontSize: isSmallPhone ? 14 : 15,
                  }}
                  className="bg-neutral-50 border border-neutral-200 rounded-2xl text-black"
                />

                <View
                  className="absolute right-4"
                  style={{
                    top: inputHeight / 2 - 10,
                  }}
                >
                  <Ionicons name="mail-outline" size={20} color="#737373" />
                </View>
              </View>

              {/* ================================== */}
              {/* PASSWORD */}
              {/* ================================== */}

              <Text className="text-neutral-700 text-sm mb-2 mt-5">
                Password
              </Text>

              <View className="relative">
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor="#A3A3A3"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="password"
                  autoComplete="password"
                  editable={!loading}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  style={{
                    height: inputHeight,
                    paddingLeft: 16,
                    paddingRight: 52,
                    fontSize: isSmallPhone ? 14 : 15,
                  }}
                  className="bg-neutral-50 border border-neutral-200 rounded-2xl text-black"
                />

                <Pressable
                  onPress={() => setShowPassword((previous) => !previous)}
                  disabled={loading}
                  hitSlop={10}
                  style={{
                    position: "absolute",
                    right: 14,
                    top: inputHeight / 2 - 11,
                  }}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color="#737373"
                  />
                </Pressable>
              </View>

              {/* ================================== */}
              {/* FORGOT PASSWORD */}
              {/* ================================== */}

              <Pressable
                disabled={loading}
                className="self-end"
                style={{
                  marginTop: 10,
                  paddingVertical: 4,
                  paddingHorizontal: 2,
                }}
              >
                <Text className="text-neutral-600 text-sm font-medium">
                  Forgot Password?
                </Text>
              </Pressable>

              {/* ================================== */}
              {/* SIGN IN */}
              {/* ================================== */}

              <Pressable
                onPress={handleLogin}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Sign in"
                style={{
                  height: buttonHeight,
                  marginTop: isSmallPhone ? 18 : 22,
                }}
                className={`rounded-full items-center justify-center ${
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

              {/* ================================== */}
              {/* DIVIDER */}
              {/* ================================== */}

              <View
                className="flex-row items-center"
                style={{
                  marginVertical: isSmallPhone ? 20 : 24,
                }}
              >
                <View className="flex-1 h-[1px] bg-neutral-200" />

                <Text className="text-neutral-400 text-xs mx-4">OR</Text>

                <View className="flex-1 h-[1px] bg-neutral-200" />
              </View>

              {/* ================================== */}
              {/* GOOGLE LOGIN */}
              {/* ================================== */}

              <Pressable
                onPress={handleGoogleLogin}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Continue with Google"
                style={{
                  height: buttonHeight,
                }}
                className={`border border-neutral-200 rounded-full items-center justify-center ${
                  loading ? "opacity-50" : ""
                }`}
              >
                <View className="flex-row items-center">
                  {loading ? (
                    <ActivityIndicator size="small" color="#111111" />
                  ) : (
                    <Image
                      source={require("../../assets/images/google.png")}
                      style={{
                        width: googleIconSize,
                        height: googleIconSize,
                        resizeMode: "contain",
                      }}
                    />
                  )}

                  <Text className="text-black font-semibold ml-3">
                    Continue with Google
                  </Text>
                </View>
              </Pressable>

              {/* ================================== */}
              {/* SIGN UP */}
              {/* ================================== */}

              <Pressable
                disabled={loading}
                onPress={() => router.navigate("/signup")}
                className="items-center"
                style={{
                  marginTop: isSmallPhone ? 22 : 26,
                  paddingVertical: 4,
                }}
              >
                <Text
                  className="text-neutral-500"
                  style={{
                    fontSize: isSmallPhone ? 13 : 14,
                    textAlign: "center",
                  }}
                >
                  Don't have an account?{" "}
                  <Text className="text-black font-semibold">Sign Up</Text>
                </Text>
              </Pressable>
            </View>

            {/* ====================================== */}
            {/* FOOTER */}
            {/* ====================================== */}

            <View
              className="items-center"
              style={{
                marginTop: isSmallPhone ? 22 : 28,
                paddingBottom: 4,
              }}
            >
              <Text className="text-neutral-400 text-xs text-center">
                Secure authentication powered by Raritone
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
