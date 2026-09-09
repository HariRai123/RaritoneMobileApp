import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  createTryOn,
  getTryOnSession,
  retryTryOn,
  type TryOnResponse,
  type TryOnSession,
} from "../../services/tryonApi";

export default function TryOnScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const { productId } = useLocalSearchParams<{
    productId?: string;
  }>();

  const [personImage, setPersonImage] = useState<string | null>(null);

  const [session, setSession] = useState<TryOnSession | null>(null);

  const [loading, setLoading] = useState(false);

  const [retrying, setRetrying] = useState(false);

  const [status, setStatus] = useState("idle");

  const [error, setError] = useState("");

  /* --------------------------------
     RESPONSIVE
  -------------------------------- */

  const isSmallPhone = width < 360;
  const isTablet = width >= 768;

  const horizontalPadding = isTablet ? 32 : isSmallPhone ? 14 : 20;

  const imageHeight = isTablet
    ? Math.min(width * 0.75, 620)
    : Math.min(width * 1.15, 500);

  /* --------------------------------
     GALLERY
  -------------------------------- */

  const pickImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow photo library access to select your photo.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.9,
      });

      if (result.canceled) return;

      const image = result.assets?.[0]?.uri;

      if (image) {
        setPersonImage(image);
        setSession(null);
        setStatus("idle");
        setError("");
      }
    } catch (err) {
      console.error("GALLERY ERROR:", err);

      Alert.alert("Error", "Unable to select the image.");
    }
  };

  /* --------------------------------
     CAMERA
  -------------------------------- */

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow camera access to take your photo.",
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.9,
      });

      if (result.canceled) return;

      const image = result.assets?.[0]?.uri;

      if (image) {
        setPersonImage(image);
        setSession(null);
        setStatus("idle");
        setError("");
      }
    } catch (err) {
      console.error("CAMERA ERROR:", err);

      Alert.alert("Error", "Unable to open the camera.");
    }
  };

  /* --------------------------------
     POLL SESSION
  -------------------------------- */

  const pollSession = useCallback(
    async (sessionId: string) => {
      const maxAttempts = 120;
      const interval = 3000;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const response = await getTryOnSession(sessionId);

          const currentSession = response?.result;

          if (!currentSession) {
            throw new Error("Try-on session was not returned by the server.");
          }

          setSession(currentSession);

          const currentStatus = currentSession.status;

          setStatus(currentStatus);

          console.log(
            `TRY-ON STATUS [${attempt + 1}/${maxAttempts}]:`,
            currentStatus,
          );

          if (currentStatus === "completed") {
            setLoading(false);

            if (!currentSession.resultImageReference) {
              setError(
                "Try-on completed, but the result image is not available yet.",
              );
              return;
            }

            router.replace(`/try-on/result/${sessionId}`);

            return;
          }

          if (currentStatus === "failed") {
            setLoading(false);

            setError(
              currentSession.errorMessage ||
                "The virtual try-on could not be completed.",
            );

            return;
          }

          await new Promise((resolve) => setTimeout(resolve, interval));
        } catch (err: any) {
          console.error(
            "TRY-ON POLLING ERROR:",
            err?.response?.data || err?.message || err,
          );

          setLoading(false);

          setError(
            err?.response?.data?.error?.message ||
              err?.response?.data?.message ||
              err?.message ||
              "Unable to check try-on status.",
          );

          return;
        }
      }

      setLoading(false);

      setError("The try-on is taking longer than expected. Please try again.");
    },
    [router],
  );

  /* --------------------------------
     GENERATE
  -------------------------------- */

  const handleGenerate = async () => {
    if (!personImage) {
      Alert.alert("Photo Required", "Please select or take a photo first.");
      return;
    }

    if (!productId) {
      Alert.alert(
        "Product Required",
        "Please open Virtual Try-On from a product page.",
      );
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSession(null);
      setStatus("uploading");

      console.log("STARTING TRY-ON");

      console.log("PRODUCT ID:", productId);

      const response: TryOnResponse = await createTryOn({
        image: personImage,
        productId: String(productId),
      });

      console.log("TRY-ON RESPONSE:", JSON.stringify(response, null, 2));

      const createdSession =
        response?.tryOn || response?.result || response?.session;

      if (!createdSession) {
        throw new Error("Try-on session was not returned by the server.");
      }

      const sessionId = createdSession.id || createdSession._id;

      if (!sessionId) {
        throw new Error("Try-on session ID was not returned by the server.");
      }

      setSession(createdSession);

      setStatus(createdSession.status || "pending");

      await pollSession(String(sessionId));
    } catch (err: any) {
      console.error(
        "TRY-ON ERROR:",
        err?.response?.data || err?.message || err,
      );

      setLoading(false);
      setStatus("failed");

      setError(
        err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          err?.message ||
          "Unable to start virtual try-on.",
      );
    }
  };

  /* --------------------------------
     RETRY
  -------------------------------- */

  const handleRetry = async () => {
    const sessionId = session?.id || session?._id;

    if (!sessionId) {
      Alert.alert("Error", "Try-on session could not be found.");
      return;
    }

    try {
      setRetrying(true);
      setLoading(true);
      setError("");
      setStatus("pending");

      const response = await retryTryOn(String(sessionId));

      const retrySession =
        response?.result || response?.tryOn || response?.session;

      if (retrySession) {
        setSession(retrySession);
      }

      await pollSession(String(sessionId));
    } catch (err: any) {
      console.error("RETRY ERROR:", err?.response?.data || err?.message || err);

      setLoading(false);

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

  /* --------------------------------
     REMOVE PHOTO
  -------------------------------- */

  const removePhoto = () => {
    if (loading) return;

    setPersonImage(null);
    setSession(null);
    setStatus("idle");
    setError("");
  };

  /* --------------------------------
     STATUS
  -------------------------------- */

  const getStatusText = () => {
    switch (status) {
      case "uploading":
        return "Uploading your photo...";

      case "pending":
        return "Preparing your virtual try-on...";

      case "processing":
        return "AI is generating your try-on...";

      case "completed":
        return "Try-on completed!";

      case "failed":
        return "Try-on failed.";

      default:
        return "Ready to try on.";
    }
  };

  const getStatusIcon = () => {
    if (status === "completed") {
      return "checkmark-circle";
    }

    if (status === "failed") {
      return "close-circle";
    }

    return "sparkles";
  };

  /* --------------------------------
     UI
  -------------------------------- */

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top", "left", "right"]}>
      <View className="flex-1 bg-black">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: horizontalPadding,

            /*
             * EXTRA TOP SPACE
             * prevents header clipping
             */
            paddingTop: isTablet ? 28 : 18,

            paddingBottom: 120,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 900,
              alignSelf: "center",
            }}
          >
            {/* ==========================
                HEADER
            ========================== */}

            <View
              className="mb-7"
              style={{
                paddingTop: 4,
              }}
            >
              <View className="flex-row items-center">
                <View
                  className={`items-center justify-center bg-white ${
                    isSmallPhone
                      ? "w-11 h-11 rounded-xl"
                      : "w-12 h-12 rounded-2xl"
                  }`}
                >
                  <Ionicons
                    name="sparkles"
                    size={isSmallPhone ? 21 : 23}
                    color="black"
                  />
                </View>

                <View className="ml-3 flex-1">
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                    className={`font-bold text-white ${
                      isSmallPhone ? "text-2xl" : "text-3xl"
                    }`}
                  >
                    Virtual Try-On
                  </Text>

                  <Text
                    className="text-neutral-400 mt-1 text-sm"
                    numberOfLines={2}
                  >
                    See how the product looks on you.
                  </Text>
                </View>
              </View>
            </View>

            {/* ==========================
                ERROR
            ========================== */}

            {error ? (
              <View className="mb-5 rounded-2xl border border-red-900 bg-red-950 p-4">
                <View className="flex-row items-start">
                  <Ionicons
                    name="alert-circle-outline"
                    size={23}
                    color="#F87171"
                  />

                  <View className="flex-1 ml-3">
                    <Text className="font-bold text-red-300">
                      Try-On Failed
                    </Text>

                    <Text className="text-red-200 text-sm mt-1 leading-5">
                      {error}
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}

            {/* ==========================
                PHOTO CARD
            ========================== */}

            <View className="rounded-3xl border border-neutral-800 bg-neutral-950 p-4">
              <View className="flex-row items-center mb-4">
                <View className="w-10 h-10 rounded-xl bg-white items-center justify-center">
                  <Ionicons name="person-outline" size={20} color="black" />
                </View>

                <View className="ml-3 flex-1">
                  <Text className="text-lg font-bold text-white">
                    Your Photo
                  </Text>

                  <Text className="text-sm text-neutral-500">
                    Use a clear full-body photo
                  </Text>
                </View>
              </View>

              {/* IMAGE */}

              <View
                style={{
                  height: imageHeight,
                }}
                className="rounded-3xl overflow-hidden bg-black border border-neutral-800"
              >
                {personImage ? (
                  <>
                    <Image
                      source={{
                        uri: personImage,
                      }}
                      style={{
                        width: "100%",
                        height: "100%",
                      }}
                      resizeMode="contain"
                    />

                    {!loading ? (
                      <View className="absolute top-3 right-3">
                        <Pressable
                          onPress={removePhoto}
                          className="w-10 h-10 rounded-full bg-black/90 border border-neutral-700 items-center justify-center"
                        >
                          <Ionicons name="close" size={21} color="white" />
                        </Pressable>
                      </View>
                    ) : null}
                  </>
                ) : (
                  <View className="flex-1 items-center justify-center px-8">
                    <View className="w-20 h-20 rounded-full bg-neutral-900 border border-neutral-800 items-center justify-center mb-5">
                      <Ionicons
                        name="person-outline"
                        size={38}
                        color="#737373"
                      />
                    </View>

                    <Text className="text-xl font-bold text-white text-center">
                      Add your photo
                    </Text>

                    <Text className="text-neutral-500 text-center mt-2 leading-5">
                      Upload a clear photo where your full body is visible.
                    </Text>
                  </View>
                )}
              </View>

              {/* CAMERA / GALLERY */}

              <View
                className={`mt-4 ${isSmallPhone ? "flex-col" : "flex-row"}`}
              >
                <Pressable
                  onPress={takePhoto}
                  disabled={loading}
                  className={`rounded-2xl bg-white py-4 items-center justify-center ${
                    isSmallPhone ? "w-full mb-3" : "flex-1 mr-1.5"
                  }`}
                >
                  <View className="flex-row items-center">
                    <Ionicons name="camera-outline" size={21} color="black" />

                    <Text className="text-black font-bold ml-2">Camera</Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={pickImage}
                  disabled={loading}
                  className={`rounded-2xl bg-neutral-900 border border-neutral-800 py-4 items-center justify-center ${
                    isSmallPhone ? "w-full" : "flex-1 ml-1.5"
                  }`}
                >
                  <View className="flex-row items-center">
                    <Ionicons name="images-outline" size={21} color="white" />

                    <Text className="text-white font-bold ml-2">Gallery</Text>
                  </View>
                </Pressable>
              </View>
            </View>

            {/* ==========================
                PRODUCT
            ========================== */}

            <View className="rounded-3xl border border-neutral-800 bg-neutral-950 p-5 mt-5">
              <Text className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                Product
              </Text>

              {productId ? (
                <View className="flex-row items-center mt-3 rounded-2xl bg-neutral-900 border border-neutral-800 p-4">
                  <View className="w-10 h-10 rounded-full bg-white items-center justify-center">
                    <Ionicons name="shirt-outline" size={20} color="black" />
                  </View>

                  <View className="flex-1 ml-3">
                    <Text className="text-white font-bold">
                      Product Selected
                    </Text>

                    <Text
                      className="text-neutral-500 text-xs mt-1"
                      numberOfLines={1}
                    >
                      {String(productId)}
                    </Text>
                  </View>

                  <Ionicons name="checkmark-circle" size={23} color="#4ADE80" />
                </View>
              ) : (
                <View className="mt-3 rounded-2xl bg-neutral-900 border border-neutral-800 p-4">
                  <Text className="text-neutral-400">No product selected.</Text>

                  <Text className="text-neutral-600 text-sm mt-1">
                    Open Try-On from a product page.
                  </Text>
                </View>
              )}

              {/* PROCESSING */}

              {loading ? (
                <View className="mt-5 rounded-2xl bg-white p-5">
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="black" />

                    <View className="flex-1 ml-3">
                      <Text className="text-black font-bold">
                        {getStatusText()}
                      </Text>

                      <Text className="text-neutral-500 text-xs mt-1">
                        Please wait...
                      </Text>
                    </View>

                    <Ionicons
                      name={getStatusIcon() as any}
                      size={22}
                      color="black"
                    />
                  </View>

                  <Text className="text-neutral-500 text-xs mt-3 leading-5">
                    Your photo is being processed by the Raritone AI Try-On
                    service. Please keep the app open.
                  </Text>
                </View>
              ) : null}

              {/* RETRY */}

              {status === "failed" && session ? (
                <Pressable
                  onPress={handleRetry}
                  disabled={retrying}
                  className="mt-5 rounded-full bg-white py-4 items-center"
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
              ) : null}
            </View>

            {/* ==========================
                GENERATE
            ========================== */}

            {!loading && status !== "failed" ? (
              <Pressable
                onPress={handleGenerate}
                disabled={!personImage || !productId}
                className={`mt-6 rounded-full py-5 items-center ${
                  personImage && productId ? "bg-white" : "bg-neutral-800"
                }`}
              >
                <View className="flex-row items-center">
                  <Ionicons
                    name="sparkles-outline"
                    size={21}
                    color={personImage && productId ? "black" : "#525252"}
                  />

                  <Text
                    className={`font-bold text-base ml-2 ${
                      personImage && productId
                        ? "text-black"
                        : "text-neutral-600"
                    }`}
                  >
                    Generate Try-On
                  </Text>
                </View>
              </Pressable>
            ) : null}

            {/* ==========================
                INFO
            ========================== */}

            <View className="mt-6 flex-row items-start px-2">
              <Ionicons
                name="information-circle-outline"
                size={18}
                color="#525252"
              />

              <Text className="text-neutral-500 text-xs leading-5 ml-2 flex-1">
                For best results, use a clear, well-lit full-body photo. AI
                processing may take some time.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
