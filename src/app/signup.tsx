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

import { signupWithEmail, signupWithGoogle } from "../services/firebaseAuth";

import { useAuthStore } from "../store/authStore";

export default function SignupScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // ==================================================
  // ZUSTAND
  // ==================================================

  const setUser = useAuthStore((state) => state.setUser);

  // ==================================================
  // FORM STATE
  // ==================================================

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  // ==================================================
  // RESPONSIVE
  // ==================================================

  const isSmallPhone = width < 360;
  const isPhone = width < 600;
  const isTablet = width >= 768;
  const isLargeTablet = width >= 1100;

  const horizontalPadding = isSmallPhone
    ? 16
    : isPhone
      ? 20
      : isLargeTablet
        ? 48
        : isTablet
          ? 32
          : 24;

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

  // ==================================================
  // SAVE USER TO ZUSTAND
  // ==================================================

  const saveUserToStore = (backendUser: any) => {
    setUser({
      id: backendUser.id || backendUser._id || "",

      firebaseUid: backendUser.firebaseUid,

      name: backendUser.name || "Raritone User",

      email: backendUser.email,

      phone: backendUser.phone,

      role: backendUser.role || "user",

      profileImage: backendUser.profileImage,

      provider: backendUser.provider,

      isActive: backendUser.isActive ?? true,

      createdAt: backendUser.createdAt,

      updatedAt: backendUser.updatedAt,
    });
  };

  // ==================================================
  // EMAIL SIGNUP
  // ==================================================

  const handleSignup = async () => {
    const cleanName = name.trim();

    const cleanEmail = email.trim().toLowerCase();

    // ----------------------------------------------
    // VALIDATION
    // ----------------------------------------------

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

      // ----------------------------------------------
      // CREATE FIREBASE + MONGODB ACCOUNT
      // ----------------------------------------------

      const { backendUser } = await signupWithEmail(
        cleanName,
        cleanEmail,
        password,
      );

      console.log("EMAIL SIGNUP BACKEND USER:", backendUser);

      // ----------------------------------------------
      // SAVE USER TO ZUSTAND
      // ----------------------------------------------

      saveUserToStore(backendUser);

      // ----------------------------------------------
      // SUCCESS
      // ----------------------------------------------

      Alert.alert(
        "Account Created",
        `Welcome to Raritone, ${backendUser.name || cleanName}!`,
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
        "FIREBASE EMAIL SIGNUP ERROR:",
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

        case "auth/too-many-requests":
          message = "Too many attempts. Please try again later.";
          break;

        default:
          message = error?.message || message;
      }

      Alert.alert("Signup Failed", message);
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // GOOGLE SIGNUP
  // ==================================================

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);

      // ----------------------------------------------
      // GOOGLE + FIREBASE + MONGODB
      // ----------------------------------------------

      const { backendUser } = await signupWithGoogle();

      console.log("GOOGLE SIGNUP BACKEND USER:", backendUser);

      // ----------------------------------------------
      // SAVE USER TO ZUSTAND
      // ----------------------------------------------

      saveUserToStore(backendUser);

      // ----------------------------------------------
      // SUCCESS
      // ----------------------------------------------

      Alert.alert(
        "Account Created",
        `Welcome to Raritone, ${backendUser.name || "Raritone User"}!`,
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
        "FIREBASE GOOGLE SIGNUP ERROR:",
        error?.code || error?.message || error,
      );

      // Google cancellation
      if (error?.code === "SIGN_IN_CANCELLED" || error?.code === "12501") {
        return;
      }

      let message = "Unable to create your Google account. Please try again.";

      const errorMessage = error?.message?.toLowerCase?.() || "";

      if (
        errorMessage.includes("already exists") ||
        errorMessage.includes("account already exists")
      ) {
        message =
          "A Raritone account already exists for this Google account. Please sign in instead.";
      } else if (errorMessage.includes("user account not found")) {
        message = "Unable to create your Raritone account. Please try again.";
      } else if (error?.code === "DEVELOPER_ERROR") {
        message =
          "Google Sign-In configuration is incorrect. Please check the Android SHA-1 and OAuth configuration.";
      } else if (error?.code === "PLAY_SERVICES_NOT_AVAILABLE") {
        message = "Google Play Services is not available on this device.";
      } else if (error?.message) {
        message = error.message;
      }

      Alert.alert("Google Signup Failed", message);
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // UI
  // ==================================================

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
              justifyContent: height > 760 ? "center" : "flex-start",
            }}
          >
            {/* =====================================
                BACK BUTTON
            ===================================== */}

            <Pressable
              onPress={() => router.back()}
              disabled={loading}
              hitSlop={8}
              className="h-10 w-10 items-center justify-center rounded-full border border-neutral-200"
              style={{
                marginBottom: isSmallPhone ? 24 : 32,
              }}
            >
              <Ionicons name="arrow-back" size={20} color="#111111" />
            </Pressable>

            {/* =====================================
                BRAND
            ===================================== */}

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

            {/* =====================================
                SIGNUP CARD
            ===================================== */}

            <View
              className="bg-white border border-neutral-200"
              style={{
                width: "100%",
                borderRadius: cardRadius,
                padding: cardPadding,
              }}
            >
              {/* TITLE */}

              <Text
                className="text-black font-bold"
                style={{
                  fontSize: titleSize,
                  lineHeight: titleSize + 5,
                }}
              >
                Create account
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
                Join Raritone and start shopping.
              </Text>

              {/* ==================================
                  FULL NAME
              ================================== */}

              <Text className="text-neutral-700 text-sm mb-2">Full Name</Text>

              <View className="relative">
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your full name"
                  placeholderTextColor="#A3A3A3"
                  autoCapitalize="words"
                  autoCorrect={false}
                  textContentType="name"
                  autoComplete="name"
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
                  <Ionicons name="person-outline" size={20} color="#737373" />
                </View>
              </View>

              {/* ==================================
                  EMAIL
              ================================== */}

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

              {/* ==================================
                  PASSWORD
              ================================== */}

              <Text className="text-neutral-700 text-sm mb-2 mt-5">
                Password
              </Text>

              <View className="relative">
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Create a password"
                  placeholderTextColor="#A3A3A3"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  autoComplete="new-password"
                  editable={!loading}
                  returnKeyType="next"
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

              {/* ==================================
                  CONFIRM PASSWORD
              ================================== */}

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
                  textContentType="newPassword"
                  autoComplete="new-password"
                  editable={!loading}
                  returnKeyType="done"
                  onSubmitEditing={handleSignup}
                  style={{
                    height: inputHeight,
                    paddingLeft: 16,
                    paddingRight: 52,
                    fontSize: isSmallPhone ? 14 : 15,
                  }}
                  className="bg-neutral-50 border border-neutral-200 rounded-2xl text-black"
                />

                <Pressable
                  onPress={() =>
                    setShowConfirmPassword((previous) => !previous)
                  }
                  disabled={loading}
                  hitSlop={10}
                  style={{
                    position: "absolute",
                    right: 14,
                    top: inputHeight / 2 - 11,
                  }}
                >
                  <Ionicons
                    name={
                      showConfirmPassword ? "eye-off-outline" : "eye-outline"
                    }
                    size={22}
                    color="#737373"
                  />
                </Pressable>
              </View>

              {/* ==================================
                  CREATE ACCOUNT
              ================================== */}

              <Pressable
                onPress={handleSignup}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Create account"
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
                      Creating account...
                    </Text>
                  </View>
                ) : (
                  <Text className="text-white font-bold">Create Account</Text>
                )}
              </Pressable>

              {/* ==================================
                  DIVIDER
              ================================== */}

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

              {/* ==================================
                  GOOGLE SIGNUP
              ================================== */}

              <Pressable
                onPress={handleGoogleSignup}
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

              {/* ==================================
                  LOGIN LINK
              ================================== */}

              <Pressable
                disabled={loading}
                onPress={() => router.replace("/login")}
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
                  Already have an account?{" "}
                  <Text className="text-black font-semibold">Sign In</Text>
                </Text>
              </Pressable>
            </View>

            {/* ======================================
                FOOTER
            ====================================== */}

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
