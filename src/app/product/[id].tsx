import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import api from "../../services/api";
import { useCartStore } from "../../store/cartStore";

type Product = {
  _id: string;
  productId: string;
  name: string;
  category: string;
  price: number;
  image: string;
  brand: string;
  stock: number;
  discount: number;
  gender: string;
  subcategory: string;
  description?: string;
};

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const addToCart = useCartStore((state) => state.addToCart);

  const cartItems = useCartStore((state) => state.items);

  const [product, setProduct] = useState<Product | null>(null);

  const [loading, setLoading] = useState(true);

  const [isWishlisted, setIsWishlisted] = useState(false);

  const [addedToCart, setAddedToCart] = useState(false);

  // --------------------------------------------------
  // RESPONSIVE
  // --------------------------------------------------

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

  // --------------------------------------------------
  // CHECK IF PRODUCT IS ALREADY IN CART
  // --------------------------------------------------

  useEffect(() => {
    if (!product) {
      setAddedToCart(false);
      return;
    }

    const existsInCart = cartItems.some((item) => item._id === product._id);

    setAddedToCart(existsInCart);
  }, [cartItems, product]);

  // --------------------------------------------------
  // FETCH PRODUCT
  // --------------------------------------------------

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);

      const response = await api.get(`/products/${id}`);

      setProduct(response.data.product);
    } catch (error) {
      console.error("Product fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // PRICE
  // --------------------------------------------------

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString("en-IN")}`;
  };

  // --------------------------------------------------
  // ADD TO CART
  // --------------------------------------------------

  const handleAddToCart = () => {
    if (!product || product.stock <= 0) {
      return;
    }

    addToCart({
      _id: product._id,
      productId: product.productId,
      name: product.name,
      price: product.price,
      image: product.image,
      brand: product.brand,
      stock: product.stock,
    });

    setAddedToCart(true);
  };

  // --------------------------------------------------
  // TRY ON
  // --------------------------------------------------

  const handleTryOn = () => {
    if (!product || product.stock <= 0) {
      return;
    }

    router.push({
      pathname: "/(tabs)/try-on",
      params: {
        productId: product._id,
      },
    });
  };

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#111111" />
      </SafeAreaView>
    );
  }

  // --------------------------------------------------
  // PRODUCT NOT FOUND
  // --------------------------------------------------

  if (!product) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-6">
        <View className="w-16 h-16 rounded-full bg-neutral-100 items-center justify-center">
          <Ionicons name="bag-outline" size={28} color="#737373" />
        </View>

        <Text className="text-black text-xl font-bold mt-5">
          Product not found
        </Text>

        <Text className="text-neutral-500 text-center mt-2">
          This product may no longer be available.
        </Text>

        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-black px-7 py-3.5 rounded-full mt-7"
        >
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // --------------------------------------------------
  // PRODUCT DETAILS
  // --------------------------------------------------

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 40,
        }}
      >
        <View
          className={isTablet ? "flex-row gap-10" : "w-full"}
          style={{
            paddingHorizontal: horizontalPadding,
            paddingTop: isSmallPhone ? 16 : isPhone ? 20 : 32,
          }}
        >
          {/* ========================================== */}
          {/* PRODUCT IMAGE */}
          {/* ========================================== */}

          <View className={isTablet ? "flex-1" : "w-full"}>
            <View
              className="relative bg-neutral-100 rounded-[32px] overflow-hidden"
              style={{
                maxHeight: isTablet ? 700 : undefined,
              }}
            >
              <Image
                source={{
                  uri: product.image,
                }}
                className={
                  isTablet
                    ? "w-full h-[650px]"
                    : isSmallPhone
                      ? "w-full h-[400px]"
                      : "w-full h-[460px]"
                }
                resizeMode="cover"
              />

              {/* IMAGE CONTROLS */}

              <View className="absolute top-4 left-4 right-4 flex-row justify-between">
                {/* BACK */}

                <TouchableOpacity
                  onPress={() => router.back()}
                  activeOpacity={0.8}
                  className="w-11 h-11 rounded-full bg-white/90 items-center justify-center"
                >
                  <Ionicons name="arrow-back" size={21} color="#111111" />
                </TouchableOpacity>

                {/* WISHLIST */}

                <TouchableOpacity
                  onPress={() => setIsWishlisted(!isWishlisted)}
                  activeOpacity={0.8}
                  className="w-11 h-11 rounded-full bg-white/90 items-center justify-center"
                >
                  <Ionicons
                    name={isWishlisted ? "heart" : "heart-outline"}
                    size={22}
                    color={isWishlisted ? "#ef4444" : "#111111"}
                  />
                </TouchableOpacity>
              </View>

              {/* DISCOUNT */}

              {product.discount > 0 && (
                <View className="absolute bottom-4 left-4 bg-black px-4 py-2 rounded-full">
                  <Text className="text-white text-xs font-bold">
                    {product.discount}% OFF
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* ========================================== */}
          {/* PRODUCT INFORMATION */}
          {/* ========================================== */}

          <View className={isTablet ? "flex-1 justify-center" : "mt-7"}>
            {/* BRAND + SUBCATEGORY */}

            <View className="flex-row items-center">
              <Text className="text-neutral-500 text-xs tracking-[3px]">
                {product.brand.toUpperCase()}
              </Text>

              <View className="w-1 h-1 rounded-full bg-neutral-300 mx-3" />

              <Text className="text-neutral-500 text-xs">
                {product.subcategory}
              </Text>
            </View>

            {/* PRODUCT NAME */}

            <Text
              className={
                isTablet
                  ? "text-black text-5xl font-bold mt-4 leading-tight"
                  : isSmallPhone
                    ? "text-black text-2xl font-bold mt-4 leading-tight"
                    : "text-black text-3xl font-bold mt-4 leading-tight"
              }
            >
              {product.name}
            </Text>

            {/* CATEGORY */}

            <Text className="text-neutral-500 text-sm mt-4">
              {product.category} · {product.gender}
            </Text>

            {/* PRICE */}

            <View className="flex-row items-center mt-7">
              <Text
                className={
                  isTablet
                    ? "text-black text-3xl font-bold"
                    : "text-black text-2xl font-bold"
                }
              >
                {formatPrice(product.price)}
              </Text>

              {product.discount > 0 && (
                <View className="ml-3 bg-neutral-100 rounded-full px-3 py-1.5">
                  <Text className="text-neutral-600 text-xs font-medium">
                    Save {product.discount}%
                  </Text>
                </View>
              )}
            </View>

            {/* DIVIDER */}

            <View className="h-px bg-neutral-200 mt-7" />

            {/* ======================================== */}
            {/* PRODUCT META */}
            {/* ======================================== */}

            <View className="flex-row mt-6">
              {/* AVAILABILITY */}

              <View className="flex-1">
                <Text className="text-neutral-400 text-xs font-medium">
                  AVAILABILITY
                </Text>

                <View className="flex-row items-center mt-2">
                  <View
                    className={`w-2 h-2 rounded-full ${
                      product.stock > 0 ? "bg-green-500" : "bg-red-500"
                    }`}
                  />

                  <Text className="text-black text-sm ml-2">
                    {product.stock > 0
                      ? `${product.stock} available`
                      : "Out of stock"}
                  </Text>
                </View>
              </View>

              {/* CATEGORY */}

              <View className="flex-1">
                <Text className="text-neutral-400 text-xs font-medium">
                  CATEGORY
                </Text>

                <Text className="text-black text-sm mt-2">
                  {product.subcategory}
                </Text>
              </View>
            </View>

            {/* ======================================== */}
            {/* ABOUT PRODUCT */}
            {/* ======================================== */}

            <View className="mt-8">
              <Text className="text-black text-lg font-bold">
                About this product
              </Text>

              <Text className="text-neutral-500 text-sm leading-6 mt-3">
                {product.description ||
                  "Discover the perfect addition to your wardrobe with this carefully selected Raritone product. Designed to bring effortless style to your everyday look."}
              </Text>
            </View>

            {/* ======================================== */}
            {/* ACTION BUTTONS */}
            {/* ======================================== */}

            <View className="mt-9">
              {/* TRY THIS ON */}

              <TouchableOpacity
                disabled={product.stock <= 0}
                onPress={handleTryOn}
                activeOpacity={0.8}
                className={`rounded-full py-4 items-center ${
                  product.stock > 0 ? "bg-black" : "bg-neutral-200"
                }`}
              >
                <View className="flex-row items-center">
                  <Ionicons
                    name="sparkles-outline"
                    size={19}
                    color={product.stock > 0 ? "white" : "#a3a3a3"}
                  />

                  <Text
                    className={`font-bold text-base ml-2 ${
                      product.stock > 0 ? "text-white" : "text-neutral-400"
                    }`}
                  >
                    Try This On
                  </Text>
                </View>
              </TouchableOpacity>

              {/* ADD TO CART */}

              <TouchableOpacity
                disabled={product.stock <= 0}
                onPress={handleAddToCart}
                activeOpacity={0.8}
                className={`border rounded-full py-4 mt-3 items-center ${
                  product.stock <= 0
                    ? "border-neutral-200 bg-neutral-50"
                    : addedToCart
                      ? "border-green-500 bg-green-50"
                      : "border-neutral-300 bg-white"
                }`}
              >
                <View className="flex-row items-center">
                  <Ionicons
                    name={addedToCart ? "checkmark-circle" : "bag-outline"}
                    size={19}
                    color={
                      product.stock <= 0
                        ? "#a3a3a3"
                        : addedToCart
                          ? "#16a34a"
                          : "#111111"
                    }
                  />

                  <Text
                    className={`font-bold text-base ml-2 ${
                      product.stock <= 0
                        ? "text-neutral-400"
                        : addedToCart
                          ? "text-green-600"
                          : "text-black"
                    }`}
                  >
                    {product.stock <= 0
                      ? "Out of Stock"
                      : addedToCart
                        ? "Added to Cart ✓"
                        : "Add to Cart"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* ======================================== */}
            {/* PRODUCT BENEFITS */}
            {/* ======================================== */}

            <View className="mt-8 pt-7 border-t border-neutral-200">
              <View className="flex-row items-start mb-5">
                <View className="w-10 h-10 rounded-full bg-neutral-100 items-center justify-center">
                  <Ionicons name="car-outline" size={19} color="#111111" />
                </View>

                <View className="flex-1 ml-3">
                  <Text className="text-black text-sm font-semibold">
                    Fast Delivery
                  </Text>

                  <Text className="text-neutral-500 text-xs mt-1 leading-5">
                    Quick and reliable delivery to your doorstep.
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start mb-5">
                <View className="w-10 h-10 rounded-full bg-neutral-100 items-center justify-center">
                  <Ionicons name="refresh-outline" size={19} color="#111111" />
                </View>

                <View className="flex-1 ml-3">
                  <Text className="text-black text-sm font-semibold">
                    Easy Returns
                  </Text>

                  <Text className="text-neutral-500 text-xs mt-1 leading-5">
                    Hassle-free return experience.
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start">
                <View className="w-10 h-10 rounded-full bg-neutral-100 items-center justify-center">
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={19}
                    color="#111111"
                  />
                </View>

                <View className="flex-1 ml-3">
                  <Text className="text-black text-sm font-semibold">
                    Secure Shopping
                  </Text>

                  <Text className="text-neutral-500 text-xs mt-1 leading-5">
                    Your shopping experience is safe and secure.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
