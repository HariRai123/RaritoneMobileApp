import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../services/api";

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

const categories = ["All", "Women", "Men", "Kids", "Unisex"];

export default function ShopScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const isTablet = width >= 768;
  const numColumns = isTablet ? 3 : 2;

  const horizontalPadding = isTablet ? 40 : 20;
  const gap = isTablet ? 16 : 10;

  const cardWidth =
    (width - horizontalPadding * 2 - gap * (numColumns - 1)) / numColumns;

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const response = await api.get("/products");

      setProducts(response.data.products || []);
    } catch (err) {
      console.error("Products fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "All" || product.gender === selectedCategory;

      const searchValue = search.toLowerCase().trim();

      const matchesSearch =
        !searchValue ||
        product.name.toLowerCase().includes(searchValue) ||
        product.brand.toLowerCase().includes(searchValue) ||
        product.subcategory.toLowerCase().includes(searchValue);

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, search]);

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString("en-IN")}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <FlatList
        data={filteredProducts}
        numColumns={numColumns}
        key={numColumns}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: horizontalPadding,
          paddingBottom: 30,
        }}
        columnWrapperStyle={
          numColumns > 1
            ? {
                gap,
              }
            : undefined
        }
        ListHeaderComponent={
          <View className="pt-5 pb-6">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-neutral-500 text-xs tracking-widest">
                  DISCOVER
                </Text>

                <Text
                  className={`text-white font-bold mt-1 ${
                    isTablet ? "text-4xl" : "text-3xl"
                  }`}
                >
                  Shop
                </Text>
              </View>

              <TouchableOpacity className="w-11 h-11 rounded-full bg-neutral-900 items-center justify-center">
                <Ionicons name="options-outline" size={21} color="white" />
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center bg-neutral-900 border border-neutral-800 rounded-2xl px-4 mt-6 h-14">
              <Ionicons name="search-outline" size={21} color="#737373" />

              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search fashion..."
                placeholderTextColor="#737373"
                className="flex-1 text-white ml-3 text-base"
              />

              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch("")}>
                  <Ionicons name="close-circle" size={20} color="#737373" />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              horizontal
              data={categories}
              keyExtractor={(item) => item}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                gap: 10,
                marginTop: 18,
              }}
              renderItem={({ item }) => {
                const active = selectedCategory === item;

                return (
                  <TouchableOpacity
                    onPress={() => setSelectedCategory(item)}
                    className={`px-5 py-3 rounded-full ${
                      active ? "bg-white" : "bg-neutral-900"
                    }`}
                  >
                    <Text
                      className={`font-semibold ${
                        active ? "text-black" : "text-neutral-400"
                      }`}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />

            <View className="flex-row items-center justify-between mt-8">
              <Text className="text-white text-lg font-bold">Trending now</Text>

              <Text className="text-neutral-500 text-sm">
                {filteredProducts.length} items
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View className="items-center justify-center py-20">
              <ActivityIndicator size="large" color="#FFFFFF" />

              <Text className="text-neutral-500 mt-4">Loading products...</Text>
            </View>
          ) : (
            <View className="items-center justify-center py-20">
              <Ionicons name="search-outline" size={40} color="#525252" />

              <Text className="text-white text-lg font-semibold mt-4">
                No products found
              </Text>

              <Text className="text-neutral-500 text-sm mt-2">
                Try another search or category.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: "/product/[id]",
                params: {
                  id: item._id,
                },
              })
            }
            style={{
              width: cardWidth,
              marginBottom: gap + 12,
            }}
          >
            <View className="bg-neutral-900 rounded-3xl overflow-hidden">
              <View className="relative bg-neutral-800">
                <Image
                  source={{ uri: item.image }}
                  className="w-full h-52"
                  resizeMode="cover"
                />

                <TouchableOpacity
                  onPress={(event) => {
                    event.stopPropagation();
                  }}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 items-center justify-center"
                >
                  <Ionicons name="heart-outline" size={19} color="white" />
                </TouchableOpacity>

                {item.discount > 0 && (
                  <View className="absolute top-3 left-3 bg-white px-3 py-1 rounded-full">
                    <Text className="text-black text-xs font-bold">
                      {item.discount}% OFF
                    </Text>
                  </View>
                )}
              </View>

              <View className="p-4">
                <Text className="text-neutral-500 text-xs">{item.brand}</Text>

                <Text
                  numberOfLines={1}
                  className="text-white font-semibold text-sm mt-2"
                >
                  {item.name}
                </Text>

                <Text className="text-neutral-500 text-xs mt-1">
                  {item.subcategory}
                </Text>

                <View className="flex-row items-center mt-3">
                  <Text className="text-white font-bold">
                    {formatPrice(item.price)}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
