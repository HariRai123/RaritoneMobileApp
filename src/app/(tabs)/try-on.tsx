import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import type { Href } from "expo-router";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";

export default function TryOnScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();

  const { productId } = useLocalSearchParams<{
    productId?: string;
  }>();

  const token = useAuthStore((state) => state.token);

  const [personImage, setPersonImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isTablet = width >= 768;

  const pickFromGallery = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow photo library access to select a photo.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPersonImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log("Gallery error:", error);

      Alert.alert("Error", "Unable to open your photo library.");
    }
  };

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow camera access to take a photo.",
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPersonImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log("Camera error:", error);

      Alert.alert("Error", "Unable to open your camera.");
    }
  };

  const generateTryOn = async () => {
    if (!personImage) {
      Alert.alert("Photo Required", "Please select or take a photo first.");
      return;
    }

    if (!productId) {
      Alert.alert(
        "Product Required",
        "Please select a product before using Virtual Try-On.",
      );
      return;
    }

    if (!token) {
      Alert.alert(
        "Login Required",
        "Please login before using Virtual Try-On.",
      );
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("productId", String(productId));

      formData.append("person_image", {
        uri: personImage,
        name: "person.jpg",
        type: "image/jpeg",
      } as any);

      console.log("================================");
      console.log("STARTING AI TRY-ON");
      console.log("Product ID:", productId);
      console.log("Image:", personImage);
      console.log("================================");

      const response = await api.post("/tryon", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        timeout: 180000,
      });

      console.log("TRY-ON RESPONSE:", response.data);

      const sessionId =
        response.data?.session?._id ||
        response.data?.session?.id ||
        response.data?.session?.sessionId ||
        response.data?.sessionId ||
        response.data?.tryOnSession?._id ||
        response.data?.tryOnSession?.id ||
        response.data?._id ||
        response.data?.id;

      if (!sessionId) {
        console.log("SESSION ID NOT FOUND");

        console.log("FULL RESPONSE:", JSON.stringify(response.data, null, 2));

        throw new Error(
          "Try-on started, but no session ID was returned by the server.",
        );
      }

      console.log("TRY-ON SESSION ID:", sessionId);

      router.push(`/try-on/result/${String(sessionId)}` as Href);
    } catch (error: any) {
      console.log("================================");
      console.log("TRY-ON ERROR");
      console.log(error?.response?.data || error?.message || error);
      console.log("================================");

      let message = "Something went wrong while generating your try-on.";

      if (error?.response?.status === 401) {
        message =
          "Your login session is invalid or expired. Please login again.";
      } else if (error?.response?.status === 400) {
        message =
          error?.response?.data?.message ||
          "Invalid image or product information.";
      } else if (error?.response?.status === 404) {
        message = "Try-on service could not find the selected product.";
      } else if (error?.response?.data?.message) {
        message = error.response.data.message;
      } else if (error?.message) {
        message = error.message;
      }

      Alert.alert("Try-On Failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: isTablet ? 32 : 20,
          paddingBottom: 100,
        }}
      >
        <View className={isTablet ? "max-w-4xl self-center w-full" : "w-full"}>
          <View className="mb-8">
            <Text className="text-white text-3xl font-bold">
              Virtual Try-On
            </Text>

            <Text className="text-neutral-500 text-base mt-2">
              See how the outfit looks on you using AI.
            </Text>
          </View>

          <View className="bg-neutral-950 border border-neutral-900 rounded-3xl p-5">
            <View className="flex-row items-center mb-5">
              <View className="w-11 h-11 rounded-full bg-white items-center justify-center">
                <Ionicons name="sparkles" size={22} color="#000000" />
              </View>

              <View className="ml-3">
                <Text className="text-white font-bold text-lg">
                  Upload Your Photo
                </Text>

                <Text className="text-neutral-500 text-sm mt-1">
                  Use a clear full-body photo
                </Text>
              </View>
            </View>

            <View className="rounded-3xl overflow-hidden bg-neutral-900 h-[420px] items-center justify-center">
              {personImage ? (
                <Image
                  source={{
                    uri: personImage,
                  }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="items-center px-8">
                  <View className="w-20 h-20 rounded-full bg-neutral-800 items-center justify-center mb-5">
                    <Ionicons name="person-outline" size={38} color="#737373" />
                  </View>

                  <Text className="text-white text-lg font-semibold text-center">
                    Add your photo
                  </Text>

                  <Text className="text-neutral-500 text-center mt-2">
                    For the best results, upload a clear photo where your full
                    body is visible.
                  </Text>
                </View>
              )}
            </View>

            <View className="flex-row mt-5">
              <Pressable
                onPress={takePhoto}
                disabled={loading}
                className="flex-1 bg-neutral-900 rounded-2xl py-4 items-center mr-2"
              >
                <Ionicons name="camera-outline" size={22} color="#FFFFFF" />

                <Text className="text-white font-semibold mt-2">Camera</Text>
              </Pressable>

              <Pressable
                onPress={pickFromGallery}
                disabled={loading}
                className="flex-1 bg-neutral-900 rounded-2xl py-4 items-center ml-2"
              >
                <Ionicons name="images-outline" size={22} color="#FFFFFF" />

                <Text className="text-white font-semibold mt-2">Gallery</Text>
              </Pressable>
            </View>

            {productId ? (
              <View className="bg-neutral-900 rounded-2xl p-4 mt-5 flex-row items-center">
                <Ionicons name="shirt-outline" size={22} color="#A3A3A3" />

                <View className="ml-3 flex-1">
                  <Text className="text-neutral-500 text-xs">
                    SELECTED PRODUCT
                  </Text>

                  <Text className="text-white font-semibold mt-1">
                    Ready for virtual try-on
                  </Text>
                </View>

                <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
              </View>
            ) : (
              <View className="bg-neutral-900 rounded-2xl p-4 mt-5 flex-row items-center">
                <Ionicons
                  name="information-circle-outline"
                  size={22}
                  color="#737373"
                />

                <Text className="text-neutral-400 text-sm ml-3 flex-1">
                  Select a product from the Shop to try it on.
                </Text>
              </View>
            )}

            <Pressable
              disabled={!personImage || !productId || loading}
              onPress={generateTryOn}
              className={`rounded-full py-4 mt-6 items-center ${
                personImage && productId && !loading
                  ? "bg-white"
                  : "bg-neutral-800"
              }`}
            >
              <View className="flex-row items-center">
                {loading ? (
                  <Ionicons
                    name="hourglass-outline"
                    size={20}
                    color="#737373"
                  />
                ) : (
                  <Ionicons
                    name="sparkles-outline"
                    size={20}
                    color={personImage && productId ? "#000000" : "#525252"}
                  />
                )}

                <Text
                  className={`font-bold ml-2 ${
                    personImage && productId && !loading
                      ? "text-black"
                      : "text-neutral-600"
                  }`}
                >
                  {loading ? "Generating..." : "Generate Try-On"}
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
