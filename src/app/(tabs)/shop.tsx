import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
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

const CATEGORIES = ["All", "Women", "Men", "Kids", "Unisex"];

const COLORS = {
  background: "#FFFFFF",
  text: "#111111",
  secondary: "#666666",
  muted: "#999999",
  border: "#E9E9E9",
  soft: "#F5F5F5",
  card: "#F7F7F7",
  black: "#000000",
  white: "#FFFFFF",
  green: "#16834A",
  error: "#B42318",
};

export default function ShopScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);

  /* =======================================================
     RESPONSIVE BREAKPOINTS

     Small phone       < 360
     Standard phone    360 - 429
     Large phone       430 - 599
     Tablet            >= 600
  ======================================================= */

  const isSmallScreen = width < 360;
  const isStandardScreen = width >= 360 && width < 430;
  const isLargeScreen = width >= 430;
  const isTablet = width >= 600;

  /* =======================================================
     RESPONSIVE LAYOUT
  ======================================================= */

  const horizontalPadding = isTablet
    ? Math.min(width * 0.05, 40)
    : isSmallScreen
      ? 14
      : Math.min(width * 0.05, 22);

  const columnGap = isTablet ? 18 : isSmallScreen ? 10 : 12;

  /*
   * Two columns on phones.
   *
   * Three columns on tablets.
   *
   * We deliberately don't use a fixed card width so the
   * layout adapts when the device rotates/resizes.
   */
  const numColumns = isTablet ? 3 : 2;

  const cardWidth =
    (width - horizontalPadding * 2 - columnGap * (numColumns - 1)) / numColumns;

  /*
   * Responsive product image.
   */
  const productImageHeight = isTablet
    ? cardWidth * 1.25
    : isSmallScreen
      ? cardWidth * 1.24
      : cardWidth * 1.27;

  /* =======================================================
     API
  ======================================================= */

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(false);

      const response = await api.get("/products");

      setProducts(response.data?.products || []);
    } catch (err) {
      console.error("Products fetch error:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     FILTERING
  ======================================================= */

  const filteredProducts = useMemo(() => {
    const searchValue = search.toLowerCase().trim();

    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "All" || product.gender === selectedCategory;

      const matchesSearch =
        !searchValue ||
        product.name.toLowerCase().includes(searchValue) ||
        product.brand.toLowerCase().includes(searchValue) ||
        product.subcategory.toLowerCase().includes(searchValue);

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, search]);

  /* =======================================================
     HELPERS
  ======================================================= */

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString("en-IN")}`;
  };

  const toggleWishlist = (id: string) => {
    setWishlist((previous) => {
      if (previous.includes(id)) {
        return previous.filter((item) => item !== id);
      }

      return [...previous, id];
    });
  };

  const openProduct = (id: string) => {
    router.push({
      pathname: "/product/[id]",
      params: {
        id,
      },
    });
  };

  /* =======================================================
     HEADER
  ======================================================= */

  const headerTitleSize = isSmallScreen ? 28 : isTablet ? 38 : 32;

  const headerButtonSize = isSmallScreen ? 40 : 44;

  /* =======================================================
     SCREEN
  ======================================================= */

  return (
    <SafeAreaView
      className="flex-1"
      edges={["top"]}
      style={{
        backgroundColor: COLORS.background,
      }}
    >
      {/* =================================================
          HEADER / PRODUCT LIST
      ================================================= */}

      <FlatList
        data={filteredProducts}
        numColumns={numColumns}
        key={`${numColumns}-${width < 600 ? "phone" : "tablet"}`}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: horizontalPadding,
          paddingBottom: 110 + Math.max(insets.bottom, 12),
        }}
        columnWrapperStyle={
          numColumns > 1
            ? {
                gap: columnGap,
              }
            : undefined
        }
        ListHeaderComponent={
          <View
            style={{
              paddingTop: Math.max(insets.top * 0.08, 4),
              paddingBottom: 24,
            }}
          >
            {/* =============================================
                TITLE ROW
            ============================================= */}

            <View
              className="flex-row items-center justify-between"
              style={{
                minHeight: 52,
              }}
            >
              <View
                style={{
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                  style={{
                    color: COLORS.muted,
                    fontSize: isSmallScreen ? 9 : 10,
                    letterSpacing: isSmallScreen ? 2.2 : 3,
                    fontWeight: "600",
                  }}
                >
                  DISCOVER
                </Text>

                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                  style={{
                    color: COLORS.text,
                    fontSize: headerTitleSize,
                    lineHeight: headerTitleSize + 4,
                    fontWeight: "700",
                    marginTop: 2,
                  }}
                >
                  Shop
                </Text>
              </View>

              {/* FILTER BUTTON */}

              <Pressable
                onPress={() => {
                  // Filter UI can be connected here
                  // when advanced filters are implemented.
                }}
                className="items-center justify-center rounded-full"
                style={{
                  width: headerButtonSize,
                  height: headerButtonSize,
                  backgroundColor: COLORS.soft,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  marginLeft: 12,
                }}
                hitSlop={4}
              >
                <Ionicons
                  name="options-outline"
                  size={isSmallScreen ? 19 : 21}
                  color={COLORS.text}
                />
              </Pressable>
            </View>

            {/* =============================================
                SEARCH
            ============================================= */}

            <View
              className="flex-row items-center rounded-2xl"
              style={{
                marginTop: 20,
                minHeight: isSmallScreen ? 48 : 54,
                paddingHorizontal: isSmallScreen ? 13 : 16,
                backgroundColor: COLORS.soft,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <Ionicons
                name="search-outline"
                size={isSmallScreen ? 19 : 21}
                color={COLORS.secondary}
              />

              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search fashion..."
                placeholderTextColor={COLORS.muted}
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
                className="ml-3 flex-1"
                style={{
                  color: COLORS.text,
                  fontSize: isSmallScreen ? 13 : 15,
                  minWidth: 0,
                  paddingVertical: 0,
                }}
              />

              {search.length > 0 && (
                <Pressable
                  onPress={() => setSearch("")}
                  className="items-center justify-center"
                  style={{
                    width: 34,
                    height: 34,
                  }}
                  hitSlop={4}
                >
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={COLORS.muted}
                  />
                </Pressable>
              )}
            </View>

            {/* =============================================
                CATEGORY FILTERS
            ============================================= */}

            <FlatList
              horizontal
              data={CATEGORIES}
              keyExtractor={(item) => item}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                gap: isSmallScreen ? 8 : 10,
                paddingTop: 16,
              }}
              renderItem={({ item }) => {
                const active = selectedCategory === item;

                return (
                  <Pressable
                    onPress={() => setSelectedCategory(item)}
                    className="rounded-full"
                    style={{
                      paddingHorizontal: isSmallScreen ? 15 : 18,
                      paddingVertical: isSmallScreen ? 9 : 11,
                      minHeight: 40,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: active ? COLORS.black : COLORS.soft,
                      borderWidth: active ? 0 : 1,
                      borderColor: COLORS.border,
                    }}
                  >
                    <Text
                      style={{
                        color: active ? COLORS.white : COLORS.secondary,
                        fontSize: isSmallScreen ? 11 : 12,
                        fontWeight: "600",
                      }}
                    >
                      {item}
                    </Text>
                  </Pressable>
                );
              }}
            />

            {/* =============================================
                RESULT SUMMARY
            ============================================= */}

            <View
              className="flex-row items-center justify-between"
              style={{
                marginTop: 24,
              }}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                style={{
                  color: COLORS.text,
                  fontSize: isSmallScreen ? 17 : 19,
                  fontWeight: "700",
                  flexShrink: 1,
                }}
              >
                Trending now
              </Text>

              <Text
                numberOfLines={1}
                style={{
                  color: COLORS.muted,
                  fontSize: isSmallScreen ? 11 : 12,
                  marginLeft: 10,
                  flexShrink: 0,
                }}
              >
                {filteredProducts.length}{" "}
                {filteredProducts.length === 1 ? "item" : "items"}
              </Text>
            </View>

            {/* =============================================
                ERROR STATE
            ============================================= */}

            {error && (
              <View
                className="rounded-2xl"
                style={{
                  marginTop: 16,
                  padding: 16,
                  backgroundColor: "#FEF3F2",
                  borderWidth: 1,
                  borderColor: "#FECACA",
                }}
              >
                <View className="flex-row items-center">
                  <Ionicons
                    name="alert-circle-outline"
                    size={20}
                    color={COLORS.error}
                  />

                  <View className="ml-3 flex-1">
                    <Text
                      style={{
                        color: COLORS.error,
                        fontSize: 13,
                        fontWeight: "600",
                      }}
                    >
                      Unable to load products
                    </Text>

                    <Text
                      style={{
                        color: "#7F1D1D",
                        fontSize: 11,
                        marginTop: 3,
                      }}
                    >
                      Check your connection and try again.
                    </Text>
                  </View>

                  <Pressable
                    onPress={fetchProducts}
                    className="rounded-full"
                    style={{
                      paddingHorizontal: 13,
                      paddingVertical: 8,
                      backgroundColor: COLORS.black,
                    }}
                  >
                    <Text
                      style={{
                        color: COLORS.white,
                        fontSize: 11,
                        fontWeight: "600",
                      }}
                    >
                      Retry
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View
              className="items-center justify-center"
              style={{
                minHeight: 300,
              }}
            >
              <ActivityIndicator size="large" color={COLORS.black} />

              <Text
                style={{
                  color: COLORS.muted,
                  fontSize: 13,
                  marginTop: 14,
                }}
              >
                Loading products...
              </Text>
            </View>
          ) : (
            <View
              className="items-center justify-center"
              style={{
                minHeight: 300,
                paddingHorizontal: 20,
              }}
            >
              <View
                className="items-center justify-center rounded-full"
                style={{
                  width: 64,
                  height: 64,
                  backgroundColor: COLORS.soft,
                }}
              >
                <Ionicons name="search-outline" size={28} color="#888888" />
              </View>

              <Text
                style={{
                  color: COLORS.text,
                  fontSize: 17,
                  fontWeight: "600",
                  marginTop: 16,
                  textAlign: "center",
                }}
              >
                No products found
              </Text>

              <Text
                style={{
                  color: COLORS.muted,
                  fontSize: 12,
                  marginTop: 6,
                  textAlign: "center",
                  lineHeight: 18,
                }}
              >
                Try another search or category.
              </Text>

              {(search.length > 0 || selectedCategory !== "All") && (
                <Pressable
                  onPress={() => {
                    setSearch("");
                    setSelectedCategory("All");
                  }}
                  className="mt-5 rounded-full"
                  style={{
                    paddingHorizontal: 18,
                    paddingVertical: 11,
                    backgroundColor: COLORS.black,
                  }}
                >
                  <Text
                    style={{
                      color: COLORS.white,
                      fontSize: 12,
                      fontWeight: "600",
                    }}
                  >
                    Clear Filters
                  </Text>
                </Pressable>
              )}
            </View>
          )
        }
        renderItem={({ item }) => {
          const liked = wishlist.includes(item._id);

          return (
            <Pressable
              onPress={() => openProduct(item._id)}
              style={{
                width: cardWidth,
                marginBottom: isSmallScreen ? 14 : 18,
              }}
            >
              {/* =========================================
                  PRODUCT CARD
              ========================================= */}

              <View
                className="overflow-hidden rounded-[18px]"
                style={{
                  backgroundColor: COLORS.card,
                }}
              >
                {/* PRODUCT IMAGE */}

                <View
                  className="relative overflow-hidden"
                  style={{
                    width: cardWidth,
                    height: productImageHeight,
                    backgroundColor: "#EEEEEE",
                  }}
                >
                  <Image
                    source={{
                      uri: item.image,
                    }}
                    style={{
                      width: "100%",
                      height: "100%",
                    }}
                    resizeMode="cover"
                  />

                  {/* DISCOUNT */}

                  {item.discount > 0 && (
                    <View
                      className="absolute left-3 top-3 rounded-full"
                      style={{
                        paddingHorizontal: isSmallScreen ? 8 : 10,
                        paddingVertical: isSmallScreen ? 5 : 6,
                        backgroundColor: COLORS.white,
                      }}
                    >
                      <Text
                        style={{
                          color: COLORS.black,
                          fontSize: isSmallScreen ? 9 : 10,
                          fontWeight: "700",
                        }}
                      >
                        {item.discount}% OFF
                      </Text>
                    </View>
                  )}

                  {/* WISHLIST */}

                  <Pressable
                    onPress={(event) => {
                      event.stopPropagation();
                      toggleWishlist(item._id);
                    }}
                    className="absolute right-3 top-3 items-center justify-center rounded-full"
                    style={{
                      width: isSmallScreen ? 32 : 36,
                      height: isSmallScreen ? 32 : 36,
                      backgroundColor: "rgba(255,255,255,0.94)",
                    }}
                    hitSlop={4}
                  >
                    <Ionicons
                      name={liked ? "heart" : "heart-outline"}
                      size={isSmallScreen ? 17 : 19}
                      color={COLORS.black}
                    />
                  </Pressable>
                </View>

                {/* PRODUCT INFORMATION */}

                <View
                  style={{
                    padding: isSmallScreen ? 10 : 13,
                  }}
                >
                  {/* BRAND */}

                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                    style={{
                      color: COLORS.muted,
                      fontSize: isSmallScreen ? 9 : 10,
                      fontWeight: "500",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    {item.brand || "Raritone"}
                  </Text>

                  {/* NAME */}

                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                    style={{
                      color: COLORS.text,
                      fontSize: isSmallScreen ? 12 : 14,
                      fontWeight: "600",
                      marginTop: 5,
                    }}
                  >
                    {item.name}
                  </Text>

                  {/* SUBCATEGORY */}

                  {!!item.subcategory && (
                    <Text
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                      style={{
                        color: COLORS.muted,
                        fontSize: isSmallScreen ? 9 : 10,
                        marginTop: 3,
                      }}
                    >
                      {item.subcategory}
                    </Text>
                  )}

                  {/* PRICE */}

                  <View
                    className="flex-row items-center"
                    style={{
                      marginTop: isSmallScreen ? 8 : 10,
                    }}
                  >
                    <Text
                      style={{
                        color: COLORS.text,
                        fontSize: isSmallScreen ? 13 : 15,
                        fontWeight: "700",
                      }}
                    >
                      {formatPrice(item.price)}
                    </Text>

                    {item.discount > 0 && (
                      <Text
                        numberOfLines={1}
                        style={{
                          color: COLORS.green,
                          fontSize: isSmallScreen ? 9 : 10,
                          fontWeight: "600",
                          marginLeft: 6,
                        }}
                      >
                        Save {item.discount}%
                      </Text>
                    )}
                  </View>

                  {/* STOCK */}

                  {item.stock <= 0 && (
                    <Text
                      style={{
                        color: COLORS.error,
                        fontSize: 9,
                        fontWeight: "600",
                        marginTop: 5,
                      }}
                    >
                      Out of stock
                    </Text>
                  )}

                  {item.stock > 0 && item.stock <= 5 && (
                    <Text
                      style={{
                        color: "#B54708",
                        fontSize: 9,
                        fontWeight: "500",
                        marginTop: 5,
                      }}
                    >
                      Only {item.stock} left
                    </Text>
                  )}
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}
