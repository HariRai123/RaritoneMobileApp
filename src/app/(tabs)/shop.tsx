import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
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
import { useWishlistStore } from "../../store/wishlistStore";

/* =========================================================
   TYPES
========================================================= */

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

type SortOption = "relevance" | "priceLow" | "priceHigh" | "newest";

type AdvancedFilters = {
  gender: string;
  category: string;
  minPrice: string;
  maxPrice: string;
  inStockOnly: boolean;
  sort: SortOption;
};

/* =========================================================
   CONSTANTS
========================================================= */

const FILTERS = [
  "All",
  "Women",
  "Men",
  "Kids",
  "Unisex",
  "Footwear",
  "Bags",
  "Accessories",
];

const GENDER_FILTERS = ["Women", "Men", "Kids", "Unisex"];

const CATEGORY_FILTERS = ["Footwear", "Bags", "Accessories"];

const ADVANCED_CATEGORIES = [
  "All",
  "Clothing",
  "Footwear",
  "Bags",
  "Accessories",
];

const SORT_OPTIONS: {
  value: SortOption;
  label: string;
}[] = [
  {
    value: "relevance",
    label: "Relevance",
  },
  {
    value: "priceLow",
    label: "Price: Low to High",
  },
  {
    value: "priceHigh",
    label: "Price: High to Low",
  },
  {
    value: "newest",
    label: "Newest",
  },
];

const DEFAULT_ADVANCED_FILTERS: AdvancedFilters = {
  gender: "All",
  category: "All",
  minPrice: "",
  maxPrice: "",
  inStockOnly: false,
  sort: "relevance",
};

/* =========================================================
   COLORS
========================================================= */

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
  warning: "#B54708",
};

/* =========================================================
   SHOP SCREEN
========================================================= */

export default function ShopScreen() {
  const router = useRouter();

  const { category: categoryParam, search: searchParam } =
    useLocalSearchParams<{
      category?: string;
      search?: string;
    }>();

  const { width } = useWindowDimensions();

  const insets = useSafeAreaInsets();

  /* =======================================================
     PRODUCTS
  ======================================================= */

  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState(false);

  /* =======================================================
     BASIC FILTERS
  ======================================================= */

  const [selectedFilter, setSelectedFilter] = useState("All");

  const [search, setSearch] = useState("");

  /* =======================================================
     ADVANCED FILTER
  ======================================================= */

  const [filterVisible, setFilterVisible] = useState(false);

  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>(
    DEFAULT_ADVANCED_FILTERS,
  );

  const [temporaryFilters, setTemporaryFilters] = useState<AdvancedFilters>(
    DEFAULT_ADVANCED_FILTERS,
  );

  /* =======================================================
     WISHLIST
  ======================================================= */

  const wishlistItems = useWishlistStore((state) => state.items);

  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);

  /* =======================================================
     RESPONSIVE
  ======================================================= */

  const isSmallScreen = width < 360;

  const isTablet = width >= 600;

  const horizontalPadding = isTablet
    ? Math.min(width * 0.05, 40)
    : isSmallScreen
      ? 14
      : Math.min(width * 0.05, 22);

  const columnGap = isTablet ? 18 : isSmallScreen ? 10 : 12;

  const numColumns = isTablet ? 3 : 2;

  const cardWidth =
    (width - horizontalPadding * 2 - columnGap * (numColumns - 1)) / numColumns;

  const productImageHeight = isTablet
    ? cardWidth * 1.25
    : isSmallScreen
      ? cardWidth * 1.24
      : cardWidth * 1.27;

  const headerTitleSize = isSmallScreen ? 28 : isTablet ? 38 : 32;

  const headerButtonSize = isSmallScreen ? 40 : 44;

  /* =======================================================
     HELPERS
  ======================================================= */

  const getDiscountedPrice = useCallback((price: number, discount: number) => {
    if (!discount || discount <= 0) {
      return price;
    }

    return Math.round(price - (price * discount) / 100);
  }, []);

  const getOldPrice = useCallback((price: number, discount: number) => {
    if (!discount || discount <= 0 || discount >= 100) {
      return price;
    }

    return Math.round(price / (1 - discount / 100));
  }, []);

  const formatPrice = useCallback((price: number) => {
    return `₹${Number(price).toLocaleString("en-IN")}`;
  }, []);

  /* =======================================================
     NORMALIZE CATEGORY
  ======================================================= */

  const normalizeFilter = useCallback((value?: string) => {
    if (!value) {
      return "All";
    }

    const decoded = decodeURIComponent(String(value)).trim();

    const match = FILTERS.find(
      (filter) => filter.toLowerCase() === decoded.toLowerCase(),
    );

    return match ?? "All";
  }, []);

  /* =======================================================
     ROUTE PARAMS
  ======================================================= */

  useEffect(() => {
    if (categoryParam !== undefined) {
      const normalized = normalizeFilter(categoryParam);

      setSelectedFilter(normalized);
    }

    if (searchParam !== undefined) {
      setSearch(decodeURIComponent(String(searchParam)));
    }
  }, [categoryParam, searchParam, normalizeFilter]);

  /* =======================================================
     FETCH PRODUCTS
  ======================================================= */

  const fetchProducts = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setError(false);

      const response = await api.get("/products");

      const rawProducts = Array.isArray(response.data?.products)
        ? response.data.products
        : Array.isArray(response.data)
          ? response.data
          : [];

      const normalizedProducts = rawProducts
        .map(
          (item: any): Product => ({
            _id: String(item?._id ?? ""),

            productId: String(item?.productId ?? ""),

            name: String(item?.name ?? "Product"),

            category: String(item?.category ?? ""),

            price: Number(item?.price ?? 0),

            image: String(item?.image ?? ""),

            brand: String(item?.brand ?? ""),

            stock: Number(item?.stock ?? 0),

            discount: Number(item?.discount ?? 0),

            gender: String(item?.gender ?? ""),

            subcategory: String(item?.subcategory ?? ""),
          }),
        )
        .filter((product: Product) =>
          Boolean(product._id && product.name && product.image),
        );

      setProducts(normalizedProducts);
    } catch (err) {
      console.error("Products fetch error:", err);

      setProducts([]);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  /* =======================================================
     REFRESH
  ======================================================= */

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);

    await fetchProducts(false);
  }, [fetchProducts]);

  /* =======================================================
     FILTERED PRODUCTS
  ======================================================= */

  const filteredProducts = useMemo(() => {
    const searchValue = search.toLowerCase().trim();

    const minPrice = Number(advancedFilters.minPrice);

    const maxPrice = Number(advancedFilters.maxPrice);

    const hasMinPrice =
      advancedFilters.minPrice.trim() !== "" && !Number.isNaN(minPrice);

    const hasMaxPrice =
      advancedFilters.maxPrice.trim() !== "" && !Number.isNaN(maxPrice);

    const result = products.filter((product: Product) => {
      /* ---------------------------------------------
               BASIC CATEGORY FILTER
            --------------------------------------------- */

      let matchesBasicFilter = true;

      if (GENDER_FILTERS.includes(selectedFilter)) {
        matchesBasicFilter =
          product.gender.toLowerCase() === selectedFilter.toLowerCase();
      } else if (CATEGORY_FILTERS.includes(selectedFilter)) {
        const selected = selectedFilter.toLowerCase();

        matchesBasicFilter =
          product.category.toLowerCase().includes(selected) ||
          product.subcategory.toLowerCase().includes(selected);
      }

      /* ---------------------------------------------
               ADVANCED GENDER
            --------------------------------------------- */

      const matchesGender =
        advancedFilters.gender === "All" ||
        product.gender.toLowerCase() === advancedFilters.gender.toLowerCase();

      /* ---------------------------------------------
               ADVANCED CATEGORY
            --------------------------------------------- */

      const matchesCategory =
        advancedFilters.category === "All" ||
        product.category
          .toLowerCase()
          .includes(advancedFilters.category.toLowerCase()) ||
        product.subcategory
          .toLowerCase()
          .includes(advancedFilters.category.toLowerCase()) ||
        (advancedFilters.category === "Clothing" &&
          !["footwear", "bags", "accessories"].some((value) =>
            product.category.toLowerCase().includes(value),
          ));

      /* ---------------------------------------------
               PRICE
            --------------------------------------------- */

      const finalPrice = getDiscountedPrice(product.price, product.discount);

      const matchesMinPrice = !hasMinPrice || finalPrice >= minPrice;

      const matchesMaxPrice = !hasMaxPrice || finalPrice <= maxPrice;

      /* ---------------------------------------------
               STOCK
            --------------------------------------------- */

      const matchesStock = !advancedFilters.inStockOnly || product.stock > 0;

      /* ---------------------------------------------
               SEARCH
            --------------------------------------------- */

      const matchesSearch =
        !searchValue ||
        product.name.toLowerCase().includes(searchValue) ||
        product.brand.toLowerCase().includes(searchValue) ||
        product.category.toLowerCase().includes(searchValue) ||
        product.subcategory.toLowerCase().includes(searchValue);

      return (
        matchesBasicFilter &&
        matchesGender &&
        matchesCategory &&
        matchesMinPrice &&
        matchesMaxPrice &&
        matchesStock &&
        matchesSearch
      );
    });

    /* -----------------------------------------------
         SORT
      ----------------------------------------------- */

    switch (advancedFilters.sort) {
      case "priceLow":
        return [...result].sort(
          (a, b) =>
            getDiscountedPrice(a.price, a.discount) -
            getDiscountedPrice(b.price, b.discount),
        );

      case "priceHigh":
        return [...result].sort(
          (a, b) =>
            getDiscountedPrice(b.price, b.discount) -
            getDiscountedPrice(a.price, a.discount),
        );

      case "newest":
        /*
         * Backend response is already
         * returned in newest-first order.
         */
        return result;

      default:
        return result;
    }
  }, [products, selectedFilter, search, advancedFilters, getDiscountedPrice]);

  /* =======================================================
     FILTER COUNT
  ======================================================= */

  const activeAdvancedFilterCount = useMemo(() => {
    let count = 0;

    if (advancedFilters.gender !== "All") {
      count++;
    }

    if (advancedFilters.category !== "All") {
      count++;
    }

    if (advancedFilters.minPrice.trim()) {
      count++;
    }

    if (advancedFilters.maxPrice.trim()) {
      count++;
    }

    if (advancedFilters.inStockOnly) {
      count++;
    }

    if (advancedFilters.sort !== "relevance") {
      count++;
    }

    return count;
  }, [advancedFilters]);

  /* =======================================================
     FILTER ACTIONS
  ======================================================= */

  const openAdvancedFilters = () => {
    setTemporaryFilters(advancedFilters);

    setFilterVisible(true);
  };

  const closeAdvancedFilters = () => {
    setFilterVisible(false);
  };

  const applyAdvancedFilters = () => {
    let filters = temporaryFilters;

    /*
     * Protect against min > max.
     */
    if (filters.minPrice.trim() && filters.maxPrice.trim()) {
      const min = Number(filters.minPrice);

      const max = Number(filters.maxPrice);

      if (!Number.isNaN(min) && !Number.isNaN(max) && min > max) {
        filters = {
          ...filters,
          minPrice: filters.maxPrice,
          maxPrice: filters.minPrice,
        };
      }
    }

    setAdvancedFilters(filters);

    setFilterVisible(false);
  };

  const resetAdvancedFilters = () => {
    setTemporaryFilters(DEFAULT_ADVANCED_FILTERS);
  };

  const clearFilters = () => {
    setSelectedFilter("All");

    setSearch("");

    setAdvancedFilters(DEFAULT_ADVANCED_FILTERS);

    setTemporaryFilters(DEFAULT_ADVANCED_FILTERS);
  };

  /* =======================================================
     WISHLIST
  ======================================================= */

  const isWishlisted = (id: string) =>
    wishlistItems.some((item) => item._id === id);

  const handleWishlist = (item: Product) => {
    const discountedPrice = getDiscountedPrice(item.price, item.discount);

    toggleWishlist({
      _id: item._id,
      productId: item.productId,
      name: item.name,
      price: discountedPrice,
      image: item.image,
      brand: item.brand,
      stock: item.stock,
      discount: item.discount,
    });
  };

  /* =======================================================
     NAVIGATION
  ======================================================= */

  const openProduct = (id: string) => {
    router.push({
      pathname: "/product/[id]",
      params: {
        id,
      },
    });
  };

  /* =======================================================
     RESULT TITLE
  ======================================================= */

  const resultTitle =
    selectedFilter === "All" ? "Trending now" : selectedFilter;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <SafeAreaView
      className="flex-1"
      edges={["top"]}
      style={{
        backgroundColor: COLORS.background,
      }}
    >
      <FlatList
        data={filteredProducts}
        numColumns={numColumns}
        key={`${numColumns}-${width < 600 ? "phone" : "tablet"}`}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={{
          paddingHorizontal: horizontalPadding,
          paddingBottom: 120 + Math.max(insets.bottom, 12),
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
              paddingTop: 6,
              paddingBottom: 24,
            }}
          >
            {/* ===========================================
                HEADER
            =========================================== */}

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

              <Pressable
                onPress={openAdvancedFilters}
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
                <View className="relative">
                  <Ionicons
                    name="options-outline"
                    size={isSmallScreen ? 19 : 21}
                    color={COLORS.text}
                  />

                  {activeAdvancedFilterCount > 0 && (
                    <View
                      className="absolute items-center justify-center rounded-full"
                      style={{
                        right: -7,
                        top: -7,
                        width: 17,
                        height: 17,
                        backgroundColor: COLORS.black,
                      }}
                    >
                      <Text
                        style={{
                          color: COLORS.white,
                          fontSize: 8,
                          fontWeight: "700",
                        }}
                      >
                        {activeAdvancedFilterCount}
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>
            </View>

            {/* ===========================================
                SEARCH
            =========================================== */}

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

            {/* ===========================================
                QUICK FILTERS
            =========================================== */}

            <FlatList
              horizontal
              data={FILTERS}
              keyExtractor={(item) => item}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                gap: isSmallScreen ? 8 : 10,
                paddingTop: 16,
              }}
              renderItem={({ item }) => {
                const active = selectedFilter === item;

                return (
                  <Pressable
                    onPress={() => setSelectedFilter(item)}
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

            {/* ===========================================
                SUMMARY
            =========================================== */}

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
                {resultTitle}
              </Text>

              <Text
                numberOfLines={1}
                style={{
                  color: COLORS.muted,
                  fontSize: isSmallScreen ? 11 : 12,
                  marginLeft: 10,
                }}
              >
                {filteredProducts.length}{" "}
                {filteredProducts.length === 1 ? "item" : "items"}
              </Text>
            </View>

            {/* ===========================================
                ACTIVE FILTER DISPLAY
            =========================================== */}

            {(selectedFilter !== "All" ||
              search.length > 0 ||
              activeAdvancedFilterCount > 0) && (
              <View className="mt-3 flex-row flex-wrap items-center">
                {selectedFilter !== "All" && (
                  <View
                    className="mr-2 mb-2 flex-row items-center rounded-full px-3 py-2"
                    style={{
                      backgroundColor: "#F1F1F1",
                    }}
                  >
                    <Ionicons
                      name="filter-outline"
                      size={13}
                      color={COLORS.secondary}
                    />

                    <Text
                      style={{
                        color: COLORS.secondary,
                        fontSize: 10,
                        fontWeight: "600",
                        marginLeft: 5,
                      }}
                    >
                      {selectedFilter}
                    </Text>
                  </View>
                )}

                {advancedFilters.gender !== "All" && (
                  <View
                    className="mr-2 mb-2 rounded-full px-3 py-2"
                    style={{
                      backgroundColor: "#F1F1F1",
                    }}
                  >
                    <Text
                      style={{
                        color: COLORS.secondary,
                        fontSize: 10,
                        fontWeight: "600",
                      }}
                    >
                      {advancedFilters.gender}
                    </Text>
                  </View>
                )}

                {advancedFilters.category !== "All" && (
                  <View
                    className="mr-2 mb-2 rounded-full px-3 py-2"
                    style={{
                      backgroundColor: "#F1F1F1",
                    }}
                  >
                    <Text
                      style={{
                        color: COLORS.secondary,
                        fontSize: 10,
                        fontWeight: "600",
                      }}
                    >
                      {advancedFilters.category}
                    </Text>
                  </View>
                )}

                {advancedFilters.inStockOnly && (
                  <View
                    className="mr-2 mb-2 rounded-full px-3 py-2"
                    style={{
                      backgroundColor: "#F1F1F1",
                    }}
                  >
                    <Text
                      style={{
                        color: COLORS.secondary,
                        fontSize: 10,
                        fontWeight: "600",
                      }}
                    >
                      In Stock
                    </Text>
                  </View>
                )}

                {search.length > 0 && (
                  <View
                    className="mr-2 mb-2 flex-row items-center rounded-full px-3 py-2"
                    style={{
                      backgroundColor: "#F1F1F1",
                      maxWidth: width * 0.65,
                    }}
                  >
                    <Ionicons
                      name="search-outline"
                      size={12}
                      color={COLORS.secondary}
                    />

                    <Text
                      numberOfLines={1}
                      style={{
                        color: COLORS.secondary,
                        fontSize: 10,
                        marginLeft: 5,
                        flexShrink: 1,
                      }}
                    >
                      {search}
                    </Text>
                  </View>
                )}

                <Pressable
                  onPress={clearFilters}
                  className="mb-2 rounded-full px-3 py-2"
                  style={{
                    backgroundColor: COLORS.black,
                  }}
                >
                  <Text
                    style={{
                      color: COLORS.white,
                      fontSize: 10,
                      fontWeight: "600",
                    }}
                  >
                    Clear All
                  </Text>
                </Pressable>
              </View>
            )}

            {/* ===========================================
                ERROR
            =========================================== */}

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
                    onPress={() => void fetchProducts()}
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
                }}
              >
                Try another search or category.
              </Text>

              <Pressable
                onPress={clearFilters}
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
            </View>
          )
        }
        renderItem={({ item }) => {
          const liked = isWishlisted(item._id);

          const discountedPrice = getDiscountedPrice(item.price, item.discount);

          const oldPrice = getOldPrice(item.price, item.discount);

          const hasDiscount = item.discount > 0 && oldPrice > discountedPrice;

          return (
            <Pressable
              onPress={() => openProduct(item._id)}
              style={{
                width: cardWidth,
                marginBottom: isSmallScreen ? 14 : 18,
              }}
            >
              <View
                className="overflow-hidden rounded-[18px]"
                style={{
                  backgroundColor: COLORS.card,
                }}
              >
                {/* =====================================
                    IMAGE
                ===================================== */}

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

                      handleWishlist(item);
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

                  {/* OUT OF STOCK */}

                  {item.stock <= 0 && (
                    <View className="absolute bottom-3 left-3 rounded-full bg-black/80 px-3 py-1.5">
                      <Text className="text-[9px] font-bold text-white">
                        OUT OF STOCK
                      </Text>
                    </View>
                  )}

                  {/* LOW STOCK */}

                  {item.stock > 0 && item.stock <= 5 && (
                    <View className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1.5">
                      <Text
                        style={{
                          color: COLORS.warning,
                          fontSize: 9,
                          fontWeight: "700",
                        }}
                      >
                        ONLY {item.stock} LEFT
                      </Text>
                    </View>
                  )}
                </View>

                {/* =====================================
                    DETAILS
                ===================================== */}

                <View
                  style={{
                    padding: isSmallScreen ? 10 : 13,
                  }}
                >
                  <Text
                    numberOfLines={1}
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

                  {!!item.subcategory && (
                    <Text
                      numberOfLines={1}
                      style={{
                        color: COLORS.muted,
                        fontSize: isSmallScreen ? 9 : 10,
                        marginTop: 3,
                      }}
                    >
                      {item.subcategory}
                    </Text>
                  )}

                  <View className="mt-2 flex-row flex-wrap items-center">
                    <Text
                      style={{
                        color: COLORS.text,
                        fontSize: isSmallScreen ? 13 : 15,
                        fontWeight: "700",
                      }}
                    >
                      {formatPrice(discountedPrice)}
                    </Text>

                    {hasDiscount && (
                      <Text
                        numberOfLines={1}
                        style={{
                          color: COLORS.muted,
                          fontSize: isSmallScreen ? 9 : 10,
                          marginLeft: 6,
                          textDecorationLine: "line-through",
                        }}
                      >
                        {formatPrice(oldPrice)}
                      </Text>
                    )}
                  </View>

                  {item.discount > 0 && (
                    <Text
                      style={{
                        color: COLORS.green,
                        fontSize: isSmallScreen ? 9 : 10,
                        fontWeight: "600",
                        marginTop: 3,
                      }}
                    >
                      Save {item.discount}%
                    </Text>
                  )}
                </View>
              </View>
            </Pressable>
          );
        }}
      />

      {/* ===================================================
          ADVANCED FILTER MODAL
      =================================================== */}

      <Modal
        visible={filterVisible}
        transparent
        animationType="slide"
        onRequestClose={closeAdvancedFilters}
      >
        <View
          className="flex-1 justify-end"
          style={{
            backgroundColor: "rgba(0,0,0,0.45)",
          }}
        >
          {/* BACKDROP */}

          <Pressable
            onPress={closeAdvancedFilters}
            style={{
              flex: 1,
            }}
          />

          {/* SHEET */}

          <View
            className="rounded-t-[28px]"
            style={{
              maxHeight: isTablet ? 720 : "90%",
              backgroundColor: COLORS.white,
            }}
          >
            {/* =============================================
                MODAL HEADER
            ============================================= */}

            <View
              className="flex-row items-center justify-between border-b"
              style={{
                paddingHorizontal: horizontalPadding,
                paddingVertical: 18,
                borderColor: COLORS.border,
              }}
            >
              <View>
                <Text
                  style={{
                    color: COLORS.text,
                    fontSize: 21,
                    fontWeight: "700",
                  }}
                >
                  Filters
                </Text>

                <Text
                  style={{
                    color: COLORS.muted,
                    fontSize: 11,
                    marginTop: 3,
                  }}
                >
                  Refine your fashion search
                </Text>
              </View>

              <Pressable
                onPress={closeAdvancedFilters}
                className="items-center justify-center rounded-full"
                style={{
                  width: 38,
                  height: 38,
                  backgroundColor: COLORS.soft,
                }}
                hitSlop={4}
              >
                <Ionicons name="close" size={20} color={COLORS.text} />
              </Pressable>
            </View>

            {/* =============================================
                MODAL CONTENT
            ============================================= */}

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                padding: horizontalPadding,
                paddingBottom: 32,
              }}
            >
              {/* =========================================
                  GENDER
              ========================================= */}

              <Text
                style={{
                  color: COLORS.text,
                  fontSize: 14,
                  fontWeight: "700",
                  marginBottom: 11,
                }}
              >
                Gender
              </Text>

              <View className="flex-row flex-wrap">
                {["All", ...GENDER_FILTERS].map((gender) => {
                  const active = temporaryFilters.gender === gender;

                  return (
                    <Pressable
                      key={gender}
                      onPress={() =>
                        setTemporaryFilters((prev) => ({
                          ...prev,
                          gender,
                        }))
                      }
                      className="mr-2 mb-2 rounded-full"
                      style={{
                        paddingHorizontal: 15,
                        paddingVertical: 10,
                        backgroundColor: active ? COLORS.black : COLORS.soft,
                        borderWidth: active ? 0 : 1,
                        borderColor: COLORS.border,
                      }}
                    >
                      <Text
                        style={{
                          color: active ? COLORS.white : COLORS.secondary,
                          fontSize: 11,
                          fontWeight: "600",
                        }}
                      >
                        {gender}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* =========================================
                  CATEGORY
              ========================================= */}

              <Text
                style={{
                  color: COLORS.text,
                  fontSize: 14,
                  fontWeight: "700",
                  marginTop: 20,
                  marginBottom: 11,
                }}
              >
                Category
              </Text>

              <View className="flex-row flex-wrap">
                {ADVANCED_CATEGORIES.map((category) => {
                  const active = temporaryFilters.category === category;

                  return (
                    <Pressable
                      key={category}
                      onPress={() =>
                        setTemporaryFilters((prev) => ({
                          ...prev,
                          category,
                        }))
                      }
                      className="mr-2 mb-2 rounded-full"
                      style={{
                        paddingHorizontal: 15,
                        paddingVertical: 10,
                        backgroundColor: active ? COLORS.black : COLORS.soft,
                        borderWidth: active ? 0 : 1,
                        borderColor: COLORS.border,
                      }}
                    >
                      <Text
                        style={{
                          color: active ? COLORS.white : COLORS.secondary,
                          fontSize: 11,
                          fontWeight: "600",
                        }}
                      >
                        {category}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* =========================================
                  PRICE
              ========================================= */}

              <Text
                style={{
                  color: COLORS.text,
                  fontSize: 14,
                  fontWeight: "700",
                  marginTop: 20,
                  marginBottom: 11,
                }}
              >
                Price Range
              </Text>

              <View className="flex-row">
                <View
                  className="flex-1 rounded-xl"
                  style={{
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    marginRight: 6,
                  }}
                >
                  <TextInput
                    value={temporaryFilters.minPrice}
                    onChangeText={(value) => {
                      setTemporaryFilters((prev) => ({
                        ...prev,
                        minPrice: value.replace(/[^0-9]/g, ""),
                      }));
                    }}
                    placeholder="Min price"
                    placeholderTextColor={COLORS.muted}
                    keyboardType="number-pad"
                    style={{
                      color: COLORS.text,
                      fontSize: 13,
                      paddingHorizontal: 13,
                      paddingVertical: 12,
                    }}
                  />
                </View>

                <View
                  className="flex-1 rounded-xl"
                  style={{
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    marginLeft: 6,
                  }}
                >
                  <TextInput
                    value={temporaryFilters.maxPrice}
                    onChangeText={(value) => {
                      setTemporaryFilters((prev) => ({
                        ...prev,
                        maxPrice: value.replace(/[^0-9]/g, ""),
                      }));
                    }}
                    placeholder="Max price"
                    placeholderTextColor={COLORS.muted}
                    keyboardType="number-pad"
                    style={{
                      color: COLORS.text,
                      fontSize: 13,
                      paddingHorizontal: 13,
                      paddingVertical: 12,
                    }}
                  />
                </View>
              </View>

              {/* =========================================
                  QUICK PRICE RANGES
              ========================================= */}

              <View className="mt-3 flex-row flex-wrap">
                {[
                  {
                    label: "Under ₹1,000",
                    min: "",
                    max: "1000",
                  },
                  {
                    label: "₹1,000 - ₹2,500",
                    min: "1000",
                    max: "2500",
                  },
                  {
                    label: "₹2,500 - ₹5,000",
                    min: "2500",
                    max: "5000",
                  },
                  {
                    label: "Above ₹5,000",
                    min: "5000",
                    max: "",
                  },
                ].map((range) => {
                  const active =
                    temporaryFilters.minPrice === range.min &&
                    temporaryFilters.maxPrice === range.max;

                  return (
                    <Pressable
                      key={range.label}
                      onPress={() =>
                        setTemporaryFilters((prev) => ({
                          ...prev,
                          minPrice: range.min,
                          maxPrice: range.max,
                        }))
                      }
                      className="mr-2 mb-2 rounded-full"
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 9,
                        backgroundColor: active ? "#EDEDED" : COLORS.white,
                        borderWidth: 1,
                        borderColor: active ? COLORS.black : COLORS.border,
                      }}
                    >
                      <Text
                        style={{
                          color: COLORS.secondary,
                          fontSize: 10,
                          fontWeight: active ? "700" : "500",
                        }}
                      >
                        {range.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* =========================================
                  AVAILABILITY
              ========================================= */}

              <Text
                style={{
                  color: COLORS.text,
                  fontSize: 14,
                  fontWeight: "700",
                  marginTop: 20,
                  marginBottom: 11,
                }}
              >
                Availability
              </Text>

              <Pressable
                onPress={() =>
                  setTemporaryFilters((prev) => ({
                    ...prev,
                    inStockOnly: !prev.inStockOnly,
                  }))
                }
                className="flex-row items-center justify-between rounded-2xl"
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 13,
                  backgroundColor: COLORS.soft,
                }}
              >
                <View className="flex-row items-center">
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={21}
                    color={
                      temporaryFilters.inStockOnly
                        ? COLORS.black
                        : COLORS.secondary
                    }
                  />

                  <View className="ml-3">
                    <Text
                      style={{
                        color: COLORS.text,
                        fontSize: 12,
                        fontWeight: "600",
                      }}
                    >
                      In stock only
                    </Text>

                    <Text
                      style={{
                        color: COLORS.muted,
                        fontSize: 10,
                        marginTop: 2,
                      }}
                    >
                      Hide unavailable products
                    </Text>
                  </View>
                </View>

                <View
                  className="items-center justify-center rounded-full"
                  style={{
                    width: 24,
                    height: 24,
                    backgroundColor: temporaryFilters.inStockOnly
                      ? COLORS.black
                      : "#DDDDDD",
                  }}
                >
                  {temporaryFilters.inStockOnly && (
                    <Ionicons name="checkmark" size={15} color={COLORS.white} />
                  )}
                </View>
              </Pressable>

              {/* =========================================
                  SORT
              ========================================= */}

              <Text
                style={{
                  color: COLORS.text,
                  fontSize: 14,
                  fontWeight: "700",
                  marginTop: 20,
                  marginBottom: 11,
                }}
              >
                Sort By
              </Text>

              {SORT_OPTIONS.map((option) => {
                const active = temporaryFilters.sort === option.value;

                return (
                  <Pressable
                    key={option.value}
                    onPress={() =>
                      setTemporaryFilters((prev) => ({
                        ...prev,
                        sort: option.value,
                      }))
                    }
                    className="mb-2 flex-row items-center justify-between rounded-xl"
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 13,
                      borderWidth: 1,
                      borderColor: active ? COLORS.black : COLORS.border,
                      backgroundColor: active ? "#F5F5F5" : COLORS.white,
                    }}
                  >
                    <Text
                      style={{
                        color: COLORS.text,
                        fontSize: 12,
                        fontWeight: active ? "700" : "500",
                      }}
                    >
                      {option.label}
                    </Text>

                    {active && (
                      <Ionicons
                        name="checkmark-circle"
                        size={19}
                        color={COLORS.black}
                      />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* =============================================
                MODAL FOOTER
            ============================================= */}

            <View
              className="flex-row border-t"
              style={{
                paddingHorizontal: horizontalPadding,
                paddingTop: 13,
                paddingBottom: Math.max(insets.bottom, 12) + 4,
                borderColor: COLORS.border,
                backgroundColor: COLORS.white,
              }}
            >
              <Pressable
                onPress={resetAdvancedFilters}
                className="items-center justify-center rounded-full"
                style={{
                  flex: 1,
                  minHeight: 48,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  marginRight: 6,
                }}
              >
                <Text
                  style={{
                    color: COLORS.text,
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  Reset
                </Text>
              </Pressable>

              <Pressable
                onPress={applyAdvancedFilters}
                className="items-center justify-center rounded-full"
                style={{
                  flex: 1.5,
                  minHeight: 48,
                  backgroundColor: COLORS.black,
                  marginLeft: 6,
                }}
              >
                <Text
                  style={{
                    color: COLORS.white,
                    fontSize: 12,
                    fontWeight: "700",
                  }}
                >
                  Show {filteredProducts.length} Products
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
