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
};

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const addToCart = useCartStore((state) => state.addToCart);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const isTablet = width >= 768;

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

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString("en-IN")}`;
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#FFFFFF" />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center px-6">
        <View className="w-16 h-16 rounded-full bg-neutral-900 items-center justify-center">
          <Ionicons name="bag-outline" size={28} color="#737373" />
        </View>

        <Text className="text-white text-xl font-bold mt-5">
          Product not found
        </Text>

        <Text className="text-neutral-500 text-center mt-2">
          This product may no longer be available.
        </Text>

        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-white px-7 py-3.5 rounded-full mt-7"
        >
          <Text className="text-black font-bold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 40,
        }}
      >
        <View className={isTablet ? "flex-row px-12 pt-8 gap-12" : "px-5 pt-4"}>
          <View className={isTablet ? "flex-1" : "w-full"}>
            <View className="relative bg-neutral-900 rounded-[32px] overflow-hidden">
              <Image
                source={{ uri: product.image }}
                className={isTablet ? "w-full h-[650px]" : "w-full h-[460px]"}
                resizeMode="cover"
              />

              <View className="absolute top-4 left-4 right-4 flex-row justify-between">
                <TouchableOpacity
                  onPress={() => router.back()}
                  className="w-11 h-11 rounded-full bg-black/60 items-center justify-center"
                >
                  <Ionicons name="arrow-back" size={22} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setIsWishlisted(!isWishlisted)}
                  className="w-11 h-11 rounded-full bg-black/60 items-center justify-center"
                >
                  <Ionicons
                    name={isWishlisted ? "heart" : "heart-outline"}
                    size={22}
                    color="white"
                  />
                </TouchableOpacity>
              </View>

              {product.discount > 0 && (
                <View className="absolute bottom-4 left-4 bg-white px-4 py-2 rounded-full">
                  <Text className="text-black text-xs font-bold">
                    {product.discount}% OFF
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View className={isTablet ? "flex-1 justify-center" : "mt-7"}>
            <View className="flex-row items-center">
              <Text className="text-neutral-500 text-xs tracking-[3px]">
                {product.brand.toUpperCase()}
              </Text>

              <View className="w-1 h-1 rounded-full bg-neutral-700 mx-3" />

              <Text className="text-neutral-500 text-xs">
                {product.subcategory}
              </Text>
            </View>

            <Text
              className={
                isTablet
                  ? "text-white text-5xl font-bold mt-4 leading-tight"
                  : "text-white text-3xl font-bold mt-4 leading-tight"
              }
            >
              {product.name}
            </Text>

            <Text className="text-neutral-500 text-sm mt-4">
              {product.category} · {product.gender}
            </Text>

            <View className="flex-row items-center mt-7">
              <Text
                className={
                  isTablet
                    ? "text-white text-3xl font-bold"
                    : "text-white text-2xl font-bold"
                }
              >
                {formatPrice(product.price)}
              </Text>

              {product.discount > 0 && (
                <View className="ml-3 bg-neutral-900 rounded-full px-3 py-1.5">
                  <Text className="text-neutral-400 text-xs">
                    Save {product.discount}%
                  </Text>
                </View>
              )}
            </View>

            <View className="h-px bg-neutral-900 mt-7" />

            <View className="flex-row mt-6">
              <View className="flex-1">
                <Text className="text-neutral-500 text-xs">AVAILABILITY</Text>

                <View className="flex-row items-center mt-2">
                  <View
                    className={`w-2 h-2 rounded-full ${
                      product.stock > 0 ? "bg-green-500" : "bg-red-500"
                    }`}
                  />

                  <Text className="text-white text-sm ml-2">
                    {product.stock > 0
                      ? `${product.stock} available`
                      : "Out of stock"}
                  </Text>
                </View>
              </View>

              <View className="flex-1">
                <Text className="text-neutral-500 text-xs">CATEGORY</Text>

                <Text className="text-white text-sm mt-2">
                  {product.subcategory}
                </Text>
              </View>
            </View>

            <View className="mt-8">
              <Text className="text-white text-lg font-bold">
                About this product
              </Text>

              <Text className="text-neutral-500 text-sm leading-6 mt-3">
                Discover the perfect addition to your wardrobe with this
                carefully selected Raritone product. Designed to bring
                effortless style to your everyday look.
              </Text>
            </View>

            <View className="mt-9">
              <TouchableOpacity
                disabled={product.stock === 0}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/try-on",
                    params: {
                      productId: product._id,
                    },
                  })
                }
                className={`rounded-full py-4 items-center ${
                  product.stock > 0 ? "bg-white" : "bg-neutral-800"
                }`}
              >
                <View className="flex-row items-center">
                  <Ionicons
                    name="sparkles-outline"
                    size={19}
                    color={product.stock > 0 ? "black" : "#737373"}
                  />

                  <Text
                    className={`font-bold text-base ml-2 ${
                      product.stock > 0 ? "text-black" : "text-neutral-500"
                    }`}
                  >
                    Try This On
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={product.stock === 0}
                onPress={() =>
                  addToCart({
                    _id: product._id,
                    productId: product.productId,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    brand: product.brand,
                    stock: product.stock,
                  })
                }
                className={`border rounded-full py-4 mt-3 items-center ${
                  product.stock > 0
                    ? "border-neutral-700"
                    : "border-neutral-900"
                }`}
              >
                <View className="flex-row items-center">
                  <Ionicons
                    name="bag-outline"
                    size={19}
                    color={product.stock > 0 ? "white" : "#525252"}
                  />

                  <Text
                    className={`font-bold text-base ml-2 ${
                      product.stock > 0 ? "text-white" : "text-neutral-600"
                    }`}
                  >
                    Add to Cart
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
