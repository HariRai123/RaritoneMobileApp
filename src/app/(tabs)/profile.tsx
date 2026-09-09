import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { logoutFromFirebase } from "../../services/firebaseAuth";
import { useAuthStore } from "../../store/authStore";

export default function ProfileScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const logout = useAuthStore((state) => state.logout);

  const user = useAuthStore((state) => state.user);

  const [signingOut, setSigningOut] = useState(false);

  /* ==========================================
     RESPONSIVE
  ========================================== */

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
        : 32;

  /* ==========================================
     USER INFO
  ========================================== */

  const displayName = user?.name || "Raritone User";

  const email = user?.email || "";

  const firstLetter = displayName.trim().charAt(0).toUpperCase() || "R";

  /* ==========================================
     SIGN OUT
  ========================================== */

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out of your account?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: performSignOut,
        },
      ],
    );
  };

  const performSignOut = async () => {
    try {
      setSigningOut(true);

      /*
       * Firebase logout
       */
      await logoutFromFirebase();

      /*
       * Clear Zustand auth state
       */
      await logout();

      /*
       * Return to the main app
       */
      router.replace("/(tabs)");
    } catch (error) {
      console.error("SIGN OUT ERROR:", error);

      Alert.alert(
        "Sign Out Failed",
        "Unable to sign out right now. Please try again.",
      );
    } finally {
      setSigningOut(false);
    }
  };

  /* ==========================================
     MENU ITEM
  ========================================== */

  const MenuItem = ({
    icon,
    title,
    subtitle,
    onPress,
    danger = false,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    onPress: () => void;
    danger?: boolean;
  }) => {
    return (
      <Pressable
        onPress={onPress}
        disabled={signingOut}
        android_ripple={{
          color: "#e5e5e5",
        }}
        className="flex-row items-center py-4"
      >
        <View
          className={`w-11 h-11 rounded-full items-center justify-center ${
            danger ? "bg-red-50" : "bg-neutral-100"
          }`}
        >
          <Ionicons
            name={icon}
            size={21}
            color={danger ? "#DC2626" : "#111111"}
          />
        </View>

        <View className="flex-1 ml-4">
          <Text
            className={`font-semibold ${
              danger ? "text-red-600" : "text-black"
            }`}
          >
            {title}
          </Text>

          {subtitle ? (
            <Text className="text-neutral-500 text-xs mt-1">{subtitle}</Text>
          ) : null}
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color={danger ? "#FCA5A5" : "#737373"}
        />
      </Pressable>
    );
  };

  /* ==========================================
     SCREEN
  ========================================== */

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: horizontalPadding,
          paddingTop: isTablet ? 32 : 20,
          paddingBottom: 100,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 900,
            alignSelf: "center",
          }}
        >
          {/* =====================================
              HEADER
          ===================================== */}

          <View className="mb-8">
            <Text
              className={
                isTablet
                  ? "text-black text-4xl font-bold"
                  : isSmallPhone
                    ? "text-black text-3xl font-bold"
                    : "text-black text-3xl font-bold"
              }
            >
              Profile
            </Text>

            <Text className="text-neutral-500 text-sm mt-1">
              Manage your account and activity
            </Text>
          </View>

          {/* =====================================
              USER CARD
          ===================================== */}

          <View className="rounded-3xl bg-black p-5">
            <View className="flex-row items-center">
              {/* AVATAR */}

              <View
                className={`rounded-full bg-white items-center justify-center ${
                  isSmallPhone ? "w-16 h-16" : "w-20 h-20"
                }`}
              >
                <Text
                  className={
                    isSmallPhone
                      ? "text-black text-2xl font-bold"
                      : "text-black text-3xl font-bold"
                  }
                >
                  {firstLetter}
                </Text>
              </View>

              {/* USER */}

              <View className="flex-1 ml-4">
                <Text
                  className="text-white text-xl font-bold"
                  numberOfLines={1}
                >
                  {displayName}
                </Text>

                {email ? (
                  <Text
                    className="text-neutral-400 text-sm mt-1"
                    numberOfLines={1}
                  >
                    {email}
                  </Text>
                ) : (
                  <Text className="text-neutral-500 text-sm mt-1">
                    Welcome to Raritone
                  </Text>
                )}
              </View>
            </View>

            {/* ACCOUNT BADGE */}

            <View className="flex-row items-center mt-5 pt-4 border-t border-neutral-800">
              <View className="w-2 h-2 rounded-full bg-green-400" />

              <Text className="text-neutral-400 text-xs ml-2">
                Account active
              </Text>

              <View className="flex-1" />

              <View className="flex-row items-center">
                <Ionicons
                  name="shield-checkmark-outline"
                  size={15}
                  color="#737373"
                />

                <Text className="text-neutral-500 text-xs ml-1">
                  Secure account
                </Text>
              </View>
            </View>
          </View>

          {/* =====================================
              SHOPPING
          ===================================== */}

          <Text className="text-neutral-400 text-xs font-bold uppercase tracking-widest mt-8 mb-2">
            Shopping
          </Text>

          <View className="rounded-3xl border border-neutral-200 bg-white px-4">
            {/* ORDERS */}

            <MenuItem
              icon="receipt-outline"
              title="My Orders"
              subtitle="Track and manage your orders"
              onPress={() => router.push("/orders")}
            />

            <View className="h-px bg-neutral-100" />

            {/* TRY ON */}

            <MenuItem
              icon="sparkles-outline"
              title="Virtual Try-On"
              subtitle="See how products look on you"
              onPress={() => router.push("/(tabs)/try-on")}
            />

            <View className="h-px bg-neutral-100" />

            {/* HISTORY */}

            <MenuItem
              icon="time-outline"
              title="Try-On History"
              subtitle="View your previous virtual try-ons"
              onPress={() => router.push("/try-on/history")}
            />
          </View>

          {/* =====================================
              ACCOUNT
          ===================================== */}

          <Text className="text-neutral-400 text-xs font-bold uppercase tracking-widest mt-8 mb-2">
            Account
          </Text>

          <View className="rounded-3xl border border-neutral-200 bg-white px-4">
            <MenuItem
              icon="person-outline"
              title="Account Details"
              subtitle="View your profile information"
              onPress={() => {
                Alert.alert(
                  "Account Details",
                  `${displayName}\n${email || "No email available"}`,
                );
              }}
            />

            <View className="h-px bg-neutral-100" />

            <MenuItem
              icon="lock-closed-outline"
              title="Security"
              subtitle="Your account is secured with Firebase Authentication"
              onPress={() => {
                Alert.alert(
                  "Security",
                  "Your Raritone account uses Firebase Authentication for secure sign-in.",
                );
              }}
            />
          </View>

          {/* =====================================
              HELP
          ===================================== */}

          <Text className="text-neutral-400 text-xs font-bold uppercase tracking-widest mt-8 mb-2">
            Support
          </Text>

          <View className="rounded-3xl border border-neutral-200 bg-white px-4">
            <MenuItem
              icon="help-circle-outline"
              title="Help & Support"
              subtitle="Get help with your Raritone account"
              onPress={() => {
                Alert.alert(
                  "Help & Support",
                  "For support, please contact the Raritone team.",
                );
              }}
            />

            <View className="h-px bg-neutral-100" />

            <MenuItem
              icon="information-circle-outline"
              title="About Raritone"
              subtitle="Raritone shopping experience"
              onPress={() => {
                Alert.alert(
                  "Raritone",
                  "Discover products and experience AI-powered Virtual Try-On.",
                );
              }}
            />
          </View>

          {/* =====================================
              SIGN OUT
          ===================================== */}

          <View className="rounded-3xl border border-red-100 bg-red-50 px-4 mt-8">
            <MenuItem
              icon="log-out-outline"
              title={signingOut ? "Signing Out..." : "Sign Out"}
              subtitle="Sign out from this device"
              danger
              onPress={handleSignOut}
            />
          </View>

          {/* =====================================
              LOADING
          ===================================== */}

          {signingOut ? (
            <View className="flex-row items-center justify-center mt-5">
              <ActivityIndicator size="small" color="#111111" />

              <Text className="text-neutral-500 text-xs ml-2">
                Signing you out...
              </Text>
            </View>
          ) : null}

          {/* =====================================
              FOOTER
          ===================================== */}

          <View className="items-center mt-10">
            <View className="flex-row items-center">
              <Ionicons name="sparkles" size={14} color="#111111" />

              <Text className="text-black font-bold text-sm ml-2">
                RARITONE
              </Text>
            </View>

            <Text className="text-neutral-400 text-xs mt-2">
              Your style. Your way.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
