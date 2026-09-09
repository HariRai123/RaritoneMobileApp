import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  getTryOnSession,
  retryTryOn,
  type TryOnSession,
} from "../../../services/tryonApi";

export default function TryOnResultScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const router = useRouter();
  const { width } = useWindowDimensions();

  const [session, setSession] = useState<TryOnSession | null>(null);

  const [loading, setLoading] = useState(true);

  const [retrying, setRetrying] = useState(false);

  const [error, setError] = useState("");

  const isSmallPhone = width < 360;
  const isTablet = width >= 768;

  const horizontalPadding = isTablet ? 32 : isSmallPhone ? 14 : 20;

  const resultImageHeight = isTablet
    ? Math.min(width * 0.72, 680)
    : Math.min(width * 1.18, 560);

  /* ==========================================
     FETCH SESSION
  ========================================== */

  const fetchSession = useCallback(async () => {
    if (!id) {
      setError("Try-on session ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await getTryOnSession(String(id));

      if (!response?.result) {
        throw new Error("Try-on session was not found.");
      }

      setSession(response.result);
    } catch (err: any) {
      console.error(
        "RESULT FETCH ERROR:",
        err?.response?.data || err?.message || err,
      );

      setError(
        err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          err?.message ||
          "Unable to load try-on result.",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  /* ==========================================
     RETRY
  ========================================== */

  const handleRetry = async () => {
    if (!id || !session) {
      return;
    }

    try {
      setRetrying(true);
      setError("");

      const response = await retryTryOn(String(id));

      const retrySession =
        response?.result || response?.tryOn || response?.session;

      if (retrySession) {
        setSession(retrySession);
      }

      /*
       * The backend starts processing
       * asynchronously after retry.
       *
       * Poll until completed/failed.
       */

      for (let attempt = 0; attempt < 120; attempt++) {
        const result = await getTryOnSession(String(id));

        const current = result?.result;

        if (!current) {
          throw new Error("Try-on session could not be retrieved.");
        }

        setSession(current);

        if (current.status === "completed") {
          return;
        }

        if (current.status === "failed") {
          setError(current.errorMessage || "The virtual try-on failed again.");
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      setError("Try-on is taking longer than expected.");
    } catch (err: any) {
      console.error(
        "RESULT RETRY ERROR:",
        err?.response?.data || err?.message || err,
      );

      setError(
        err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          err?.message ||
          "Unable to retry try-on.",
      );
    } finally {
      setRetrying(false);
    }
  };

  /* ==========================================
     FORMAT TIME
  ========================================== */

  const formatProcessingTime = (seconds?: number | null) => {
    if (seconds === null || seconds === undefined) {
      return "—";
    }

    if (seconds < 1) {
      return "<1 sec";
    }

    if (seconds < 60) {
      return `${seconds.toFixed(1)} sec`;
    }

    const minutes = Math.floor(seconds / 60);

    const remaining = Math.round(seconds % 60);

    return `${minutes}m ${remaining}s`;
  };

  /* ==========================================
     PRODUCT
  ========================================== */

  const product = session?.product;

  /* ==========================================
     LOADING
  ========================================== */

  if (loading) {
    return (
      <SafeAreaView
        className="flex-1 bg-black"
        edges={["top", "left", "right"]}
      >
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 rounded-3xl bg-white items-center justify-center">
            <ActivityIndicator size="large" color="black" />
          </View>

          <Text className="text-white text-xl font-bold mt-6">
            Loading your result
          </Text>

          <Text className="text-neutral-500 text-center mt-2">
            Please wait while we retrieve your virtual try-on.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /* ==========================================
     ERROR / SESSION NOT FOUND
  ========================================== */

  if (error && !session) {
    return (
      <SafeAreaView
        className="flex-1 bg-black"
        edges={["top", "left", "right"]}
      >
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 rounded-full bg-red-950 border border-red-900 items-center justify-center">
            <Ionicons name="alert-circle-outline" size={38} color="#F87171" />
          </View>

          <Text className="text-white text-2xl font-bold mt-6 text-center">
            Unable to load result
          </Text>

          <Text className="text-neutral-500 text-center mt-3 leading-5">
            {error}
          </Text>

          <Pressable
            onPress={() => router.back()}
            className="bg-white rounded-full px-8 py-4 mt-7"
          >
            <Text className="text-black font-bold">Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  /* ==========================================
     PROCESSING
  ========================================== */

  const isProcessing =
    session?.status === "pending" || session?.status === "processing";

  if (session && isProcessing) {
    return (
      <SafeAreaView
        className="flex-1 bg-black"
        edges={["top", "left", "right"]}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: horizontalPadding,
            paddingTop: isTablet ? 28 : 18,
            paddingBottom: 60,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 900,
              alignSelf: "center",
              flex: 1,
            }}
          >
            {/* HEADER */}

            <View className="flex-row items-center mb-8">
              <Pressable
                onPress={() => router.back()}
                className="w-11 h-11 rounded-full bg-neutral-900 border border-neutral-800 items-center justify-center"
              >
                <Ionicons name="arrow-back" size={21} color="white" />
              </Pressable>

              <View className="ml-4">
                <Text className="text-white text-2xl font-bold">
                  Virtual Try-On
                </Text>

                <Text className="text-neutral-500 text-sm mt-1">
                  Creating your look
                </Text>
              </View>
            </View>

            {/* PROCESSING CARD */}

            <View className="flex-1 items-center justify-center">
              <View className="w-28 h-28 rounded-full bg-white items-center justify-center">
                <ActivityIndicator size="large" color="black" />
              </View>

              <Text className="text-white text-2xl font-bold text-center mt-8">
                {session.status === "pending"
                  ? "Preparing your try-on"
                  : "AI is creating your look"}
              </Text>

              <Text className="text-neutral-500 text-center mt-3 leading-6 max-w-[340px]">
                Your photo and the selected product are being processed. This
                may take a little while.
              </Text>

              <View className="mt-8 rounded-2xl bg-neutral-950 border border-neutral-800 px-5 py-4 w-full max-w-[400px]">
                <View className="flex-row items-center">
                  <Ionicons name="sparkles-outline" size={20} color="white" />

                  <Text className="text-white font-semibold ml-3">
                    {session.message || "AI processing in progress"}
                  </Text>
                </View>
              </View>

              <Text className="text-neutral-600 text-xs text-center mt-5">
                Session: {String(id)}
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  /* ==========================================
     FAILED
  ========================================== */

  if (session?.status === "failed") {
    return (
      <SafeAreaView
        className="flex-1 bg-black"
        edges={["top", "left", "right"]}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: horizontalPadding,
            paddingTop: isTablet ? 28 : 18,
            paddingBottom: 80,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 900,
              alignSelf: "center",
            }}
          >
            {/* HEADER */}

            <View className="flex-row items-center mb-8">
              <Pressable
                onPress={() => router.back()}
                className="w-11 h-11 rounded-full bg-neutral-900 border border-neutral-800 items-center justify-center"
              >
                <Ionicons name="arrow-back" size={21} color="white" />
              </Pressable>

              <Text className="text-white text-2xl font-bold ml-4">
                Try-On Result
              </Text>
            </View>

            {/* ERROR */}

            <View className="rounded-3xl bg-neutral-950 border border-red-950 p-7 items-center">
              <View className="w-20 h-20 rounded-full bg-red-950 items-center justify-center">
                <Ionicons
                  name="close-circle-outline"
                  size={40}
                  color="#F87171"
                />
              </View>

              <Text className="text-white text-2xl font-bold text-center mt-6">
                Try-On Failed
              </Text>

              <Text className="text-neutral-500 text-center mt-3 leading-6">
                {error ||
                  session.errorMessage ||
                  "The virtual try-on could not be completed."}
              </Text>

              {session.errorCode ? (
                <Text className="text-neutral-700 text-xs mt-4">
                  Error: {session.errorCode}
                </Text>
              ) : null}

              {session.retryCount !== undefined && session.retryCount < 1 ? (
                <Pressable
                  onPress={handleRetry}
                  disabled={retrying}
                  className="bg-white rounded-full px-8 py-4 mt-7"
                >
                  <View className="flex-row items-center">
                    {retrying ? (
                      <ActivityIndicator size="small" color="black" />
                    ) : (
                      <Ionicons name="refresh" size={19} color="black" />
                    )}

                    <Text className="text-black font-bold ml-2">
                      {retrying ? "Retrying..." : "Try Again"}
                    </Text>
                  </View>
                </Pressable>
              ) : (
                <Text className="text-neutral-600 text-xs mt-7 text-center">
                  Please upload a new photo to start another try-on.
                </Text>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  /* ==========================================
     COMPLETED RESULT
  ========================================== */

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top", "left", "right"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: horizontalPadding,
          paddingTop: isTablet ? 28 : 18,
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

          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center flex-1">
              <Pressable
                onPress={() => router.back()}
                className="w-11 h-11 rounded-full bg-neutral-900 border border-neutral-800 items-center justify-center"
              >
                <Ionicons name="arrow-back" size={21} color="white" />
              </Pressable>

              <View className="ml-4 flex-1">
                <Text
                  className="text-white text-2xl font-bold"
                  numberOfLines={1}
                >
                  Your Try-On
                </Text>

                <Text className="text-neutral-500 text-sm mt-1">
                  Here's how it looks on you
                </Text>
              </View>
            </View>

            <View className="w-10 h-10 rounded-full bg-green-950 border border-green-900 items-center justify-center ml-3">
              <Ionicons name="checkmark" size={22} color="#4ADE80" />
            </View>
          </View>

          {/* =====================================
              RESULT IMAGE
          ===================================== */}

          {session?.resultImageReference ? (
            <View
              style={{
                height: resultImageHeight,
              }}
              className="rounded-[32px] overflow-hidden bg-neutral-950 border border-neutral-800"
            >
              <Image
                source={{
                  uri: session.resultImageReference,
                }}
                style={{
                  width: "100%",
                  height: "100%",
                }}
                resizeMode="contain"
              />

              <View className="absolute bottom-4 left-4 right-4">
                <View className="self-start rounded-full bg-black/85 border border-neutral-700 px-4 py-2">
                  <View className="flex-row items-center">
                    <Ionicons name="sparkles" size={15} color="white" />

                    <Text className="text-white text-xs font-semibold ml-2">
                      AI Generated
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View
              style={{
                height: resultImageHeight,
              }}
              className="rounded-[32px] bg-neutral-950 border border-neutral-800 items-center justify-center px-6"
            >
              <Ionicons name="image-outline" size={45} color="#525252" />

              <Text className="text-white font-bold text-lg mt-4">
                Result image unavailable
              </Text>

              <Text className="text-neutral-600 text-center text-sm mt-2">
                The try-on completed, but no result image was returned.
              </Text>
            </View>
          )}

          {/* =====================================
              SUCCESS MESSAGE
          ===================================== */}

          <View className="rounded-3xl bg-neutral-950 border border-neutral-800 p-5 mt-5">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-green-950 items-center justify-center">
                <Ionicons name="checkmark-circle" size={21} color="#4ADE80" />
              </View>

              <View className="flex-1 ml-3">
                <Text className="text-white font-bold">
                  Virtual Try-On Complete
                </Text>

                <Text className="text-neutral-500 text-xs mt-1">
                  {session?.message ||
                    "Your virtual try-on has been generated successfully."}
                </Text>
              </View>
            </View>
          </View>

          {/* =====================================
              PRODUCT CARD
          ===================================== */}

          {product ? (
            <View className="rounded-3xl bg-neutral-950 border border-neutral-800 p-5 mt-5">
              <Text className="text-neutral-500 text-xs font-bold uppercase tracking-widest">
                Product
              </Text>

              <View className="flex-row items-center mt-4">
                {product.image ? (
                  <Image
                    source={{
                      uri: product.image,
                    }}
                    className="w-20 h-20 rounded-2xl bg-neutral-900"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-20 h-20 rounded-2xl bg-neutral-900 items-center justify-center">
                    <Ionicons name="shirt-outline" size={25} color="#737373" />
                  </View>
                )}

                <View className="flex-1 ml-4">
                  <Text
                    className="text-white text-base font-bold"
                    numberOfLines={2}
                  >
                    {product.name || "Selected Product"}
                  </Text>

                  {product.brand ? (
                    <Text className="text-neutral-500 text-xs mt-1">
                      {product.brand}
                    </Text>
                  ) : null}

                  {product.price !== undefined ? (
                    <Text className="text-white font-semibold mt-2">
                      ₹{Number(product.price).toLocaleString("en-IN")}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>
          ) : null}

          {/* =====================================
              DETAILS
          ===================================== */}

          <View className="flex-row mt-5">
            <View className="flex-1 rounded-2xl bg-neutral-950 border border-neutral-800 p-4 mr-2">
              <Ionicons name="time-outline" size={20} color="#A3A3A3" />

              <Text className="text-neutral-500 text-xs mt-3">
                PROCESSING TIME
              </Text>

              <Text className="text-white font-bold mt-1">
                {formatProcessingTime(session?.processingTime)}
              </Text>
            </View>

            <View className="flex-1 rounded-2xl bg-neutral-950 border border-neutral-800 p-4 ml-2">
              <Ionicons name="sparkles-outline" size={20} color="#A3A3A3" />

              <Text className="text-neutral-500 text-xs mt-3">AI MODEL</Text>

              <Text className="text-white font-bold mt-1" numberOfLines={1}>
                {session?.aiModelVersion || "Raritone VTON"}
              </Text>
            </View>
          </View>

          {/* =====================================
              ERROR IF ANY
          ===================================== */}

          {error ? (
            <View className="rounded-2xl bg-red-950 border border-red-900 p-4 mt-5">
              <View className="flex-row items-start">
                <Ionicons
                  name="alert-circle-outline"
                  size={20}
                  color="#F87171"
                />

                <Text className="flex-1 text-red-300 text-sm ml-3 leading-5">
                  {error}
                </Text>
              </View>
            </View>
          ) : null}

          {/* =====================================
              ACTIONS
          ===================================== */}

          <Pressable
            onPress={() => router.back()}
            className="rounded-full bg-white py-5 items-center mt-7"
          >
            <View className="flex-row items-center">
              <Ionicons name="arrow-back" size={20} color="black" />

              <Text className="text-black font-bold text-base ml-2">
                Back to Product
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => router.push("/(tabs)/profile")}
            className="rounded-full border border-neutral-800 bg-neutral-950 py-5 items-center mt-3"
          >
            <View className="flex-row items-center">
              <Ionicons name="person-outline" size={19} color="white" />

              <Text className="text-white font-bold text-base ml-2">
                Go to Profile
              </Text>
            </View>
          </Pressable>

          {/* =====================================
              SESSION ID
          ===================================== */}

          <Text className="text-neutral-700 text-xs text-center mt-6">
            Session ID: {String(id)}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
