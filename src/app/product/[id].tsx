import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import api from "../../services/api";
import { useCartStore } from "../../store/cartStore";
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
  description?: string;
  createdAt?: string;
};

/* =========================================================
   COLORS
========================================================= */

const COLORS = {
  black: "#111111",
  white: "#FFFFFF",
  text: "#111111",
  secondary: "#666666",
  muted: "#999999",
  border: "#E8E8E8",
  soft: "#F5F5F5",
  green: "#16834A",
  red: "#D92D20",
  orange: "#B54708",
};

/* =========================================================
   SCREEN
========================================================= */

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const router = useRouter();

  const { width } = useWindowDimensions();

  const insets = require("react-native-safe-area-context").useSafeAreaInsets();

  /* =======================================================
     CART STORE
  ======================================================= */

  const addToCart = useCartStore((state) => state.addToCart);

  const cartItems = useCartStore((state) => state.items);

  /* =======================================================
     WISHLIST STORE
  ======================================================= */

  const wishlistItems = useWishlistStore((state) => state.items);

  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);

  /* =======================================================
     STATE
  ======================================================= */

  const [product, setProduct] = useState<Product | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(false);

  const [quantity, setQuantity] = useState(1);

  const [addedToCart, setAddedToCart] = useState(false);

  const [isBuying, setIsBuying] = useState(false);

  /* =======================================================
     RESPONSIVE
  ======================================================= */

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

  /*
   * Height reserved for mobile sticky bottom bar.
   * This is also used as ScrollView bottom padding so
   * the final content can scroll completely above it.
   */
  const stickyBarHeight = Math.max(78, 66 + Math.max(insets.bottom, 10));

  /* =======================================================
     FETCH PRODUCT
  ======================================================= */

  const fetchProduct = useCallback(async () => {
    if (!id) {
      setProduct(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(false);

      const response = await api.get(`/products/${id}`);

      const fetchedProduct = response.data?.product ?? response.data;

      if (!fetchedProduct) {
        setProduct(null);
        return;
      }

      setProduct({
        _id: String(fetchedProduct._id ?? ""),
        productId: String(fetchedProduct.productId ?? ""),
        name: String(fetchedProduct.name ?? "Product"),
        category: String(fetchedProduct.category ?? ""),
        price: Number(fetchedProduct.price ?? 0),
        image: String(fetchedProduct.image ?? ""),
        brand: String(fetchedProduct.brand ?? ""),
        stock: Number(fetchedProduct.stock ?? 0),
        discount: Number(fetchedProduct.discount ?? 0),
        gender: String(fetchedProduct.gender ?? ""),
        subcategory: String(fetchedProduct.subcategory ?? ""),
        description: fetchedProduct.description
          ? String(fetchedProduct.description)
          : "",
        createdAt: fetchedProduct.createdAt
          ? String(fetchedProduct.createdAt)
          : undefined,
      });
    } catch (err) {
      console.error("Product fetch error:", err);

      setProduct(null);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchProduct();
  }, [fetchProduct]);

  /* =======================================================
     PRICING
  ======================================================= */

  const discountedPrice = useMemo(() => {
    if (!product) {
      return 0;
    }

    if (product.discount <= 0) {
      return product.price;
    }

    return Math.round(product.price - (product.price * product.discount) / 100);
  }, [product]);

  const oldPrice = useMemo(() => {
    if (!product) {
      return 0;
    }

    if (product.discount <= 0 || product.discount >= 100) {
      return product.price;
    }

    return Math.round(product.price / (1 - product.discount / 100));
  }, [product]);

  const totalPrice = discountedPrice * quantity;

  const savings = product
    ? Math.max(0, (oldPrice - discountedPrice) * quantity)
    : 0;

  /* =======================================================
     CART CHECK
  ======================================================= */

  useEffect(() => {
    if (!product) {
      setAddedToCart(false);
      return;
    }

    const exists = cartItems.some((item) => item._id === product._id);

    setAddedToCart(exists);
  }, [cartItems, product]);

  /* =======================================================
     WISHLIST CHECK
  ======================================================= */

  const isWishlisted = useMemo(() => {
    if (!product) {
      return false;
    }

    return wishlistItems.some((item) => item._id === product._id);
  }, [wishlistItems, product]);

  /* =======================================================
     FORMAT PRICE
  ======================================================= */

  const formatPrice = (price: number) => {
    return `₹${Number(price).toLocaleString("en-IN")}`;
  };

  /* =======================================================
     QUANTITY
  ======================================================= */

  const decreaseQuantity = () => {
    setQuantity((current) => Math.max(1, current - 1));
  };

  const increaseQuantity = () => {
    if (!product) {
      return;
    }

    if (quantity >= product.stock) {
      return;
    }

    setQuantity((current) => Math.min(product.stock, current + 1));
  };

  /* =======================================================
     WISHLIST
  ======================================================= */

  const handleWishlist = () => {
    if (!product) {
      return;
    }

    toggleWishlist({
      _id: product._id,
      productId: product.productId,
      name: product.name,
      price: discountedPrice,
      image: product.image,
      brand: product.brand,
      stock: product.stock,
      discount: product.discount,
    });
  };

  /* =======================================================
     ADD TO CART
  ======================================================= */

  const handleAddToCart = () => {
    if (!product) {
      return;
    }

    if (product.stock <= 0) {
      Alert.alert("Out of stock", "This product is currently unavailable.");
      return;
    }

    /*
     * Preserve the current cartStore contract.
     * Quantity support can be connected at store level
     * once cartStore exposes a quantity API.
     */
    for (let index = 0; index < quantity; index++) {
      addToCart({
        _id: product._id,
        productId: product.productId,
        name: product.name,
        price: discountedPrice,
        image: product.image,
        brand: product.brand,
        stock: product.stock,
      });
    }

    setAddedToCart(true);

    Alert.alert(
      "Added to cart",
      quantity > 1
        ? `${quantity} × ${product.name} added to your cart.`
        : `${product.name} has been added to your cart.`,
      [
        {
          text: "Continue Shopping",
          style: "cancel",
        },
        {
          text: "View Cart",
          onPress: () => router.push("/cart"),
        },
      ],
    );
  };

  /* =======================================================
     BUY NOW
  ======================================================= */

  const handleBuyNow = () => {
    if (!product) {
      return;
    }

    if (product.stock <= 0) {
      Alert.alert("Out of stock", "This product is currently unavailable.");
      return;
    }

    setIsBuying(true);

    /*
     * Add requested quantity using the existing
     * cartStore API.
     */
    for (let index = 0; index < quantity; index++) {
      addToCart({
        _id: product._id,
        productId: product.productId,
        name: product.name,
        price: discountedPrice,
        image: product.image,
        brand: product.brand,
        stock: product.stock,
      });
    }

    setIsBuying(false);

    router.push("/cart");
  };

  /* =======================================================
     TRY ON
  ======================================================= */

  const handleTryOn = () => {
    if (!product) {
      return;
    }

    if (product.stock <= 0) {
      Alert.alert("Out of stock", "Try-On is unavailable for this product.");
      return;
    }

    router.push({
      pathname: "/(tabs)/try-on",
      params: {
        productId: product._id,
      },
    });
  };

  /* =======================================================
     SHARE
  ======================================================= */

  const handleShare = async () => {
    if (!product) {
      return;
    }

    try {
      await Share.share({
        message: `Check out ${product.name} on Raritone. ${formatPrice(
          discountedPrice,
        )}`,
      });
    } catch (err) {
      console.error("Share error:", err);
    }
  };

  /* =======================================================
     CART NAVIGATION
  ======================================================= */

  const handleCart = () => {
    router.push("/cart");
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color={COLORS.black} />

        <Text
          style={{
            color: COLORS.muted,
            fontSize: 12,
            marginTop: 12,
          }}
        >
          Loading product...
        </Text>
      </SafeAreaView>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error && !product) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-6">
        <View
          className="items-center justify-center rounded-full"
          style={{
            width: 68,
            height: 68,
            backgroundColor: COLORS.soft,
          }}
        >
          <Ionicons
            name="cloud-offline-outline"
            size={30}
            color={COLORS.secondary}
          />
        </View>

        <Text
          style={{
            color: COLORS.text,
            fontSize: 21,
            fontWeight: "700",
            marginTop: 18,
          }}
        >
          Couldn't load product
        </Text>

        <Text
          style={{
            color: COLORS.secondary,
            fontSize: 13,
            marginTop: 7,
            textAlign: "center",
          }}
        >
          Please check your connection and try again.
        </Text>

        <View className="mt-7 flex-row">
          <TouchableOpacity
            onPress={() => void fetchProduct()}
            activeOpacity={0.8}
            className="rounded-full bg-black px-6 py-3.5"
          >
            <Text className="font-bold text-white">Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.8}
            className="ml-3 rounded-full border border-neutral-300 px-6 py-3.5"
          >
            <Text className="font-bold text-black">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /* =======================================================
     NOT FOUND
  ======================================================= */

  if (!product) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-6">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
          <Ionicons name="bag-outline" size={28} color="#737373" />
        </View>

        <Text className="mt-5 text-xl font-bold text-black">
          Product not found
        </Text>

        <Text className="mt-2 text-center text-neutral-500">
          This product may no longer be available.
        </Text>

        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.8}
          className="mt-7 rounded-full bg-black px-7 py-3.5"
        >
          <Text className="font-bold text-white">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* ===================================================
          TOP BAR
      =================================================== */}

      <View
        className="flex-row items-center justify-between"
        style={{
          paddingHorizontal: horizontalPadding,
          paddingTop: isSmallPhone ? 8 : 12,
          paddingBottom: 8,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.8}
          className="h-11 w-11 items-center justify-center rounded-full bg-neutral-100"
        >
          <Ionicons name="arrow-back" size={21} color="#111111" />
        </TouchableOpacity>

        <View className="flex-row items-center">
          {/* SHARE */}

          <TouchableOpacity
            onPress={handleShare}
            activeOpacity={0.8}
            className="mr-2 h-11 w-11 items-center justify-center rounded-full bg-neutral-100"
          >
            <Ionicons name="share-outline" size={20} color="#111111" />
          </TouchableOpacity>

          {/* CART */}

          <TouchableOpacity
            onPress={handleCart}
            activeOpacity={0.8}
            className="relative h-11 w-11 items-center justify-center rounded-full bg-neutral-100"
          >
            <Ionicons name="bag-handle-outline" size={21} color="#111111" />

            {cartItems.length > 0 && (
              <View
                className="absolute items-center justify-center rounded-full bg-black"
                style={{
                  right: -1,
                  top: -1,
                  minWidth: 17,
                  height: 17,
                  paddingHorizontal: 2,
                }}
              >
                <Text
                  style={{
                    color: COLORS.white,
                    fontSize: 8,
                    fontWeight: "700",
                  }}
                >
                  {cartItems.length > 99 ? "99+" : cartItems.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ===================================================
          CONTENT
      =================================================== */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          /*
           * Critical:
           * reserve enough space so the sticky bottom
           * action bar never hides the final content.
           */
          paddingBottom: isTablet ? 60 : stickyBarHeight + 35,
        }}
      >
        <View
          style={{
            paddingHorizontal: horizontalPadding,
            paddingTop: isSmallPhone ? 8 : isPhone ? 12 : 20,
          }}
        >
          {/* =================================================
              PRODUCT IMAGE
          ================================================= */}

          <View
            style={{
              width: "100%",
              maxWidth: isLargeTablet ? 750 : undefined,
              alignSelf: "center",
            }}
          >
            <View
              className="relative overflow-hidden rounded-[32px] bg-neutral-100"
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
                    ? "h-[650px] w-full"
                    : isSmallPhone
                      ? "h-[390px] w-full"
                      : "h-[450px] w-full"
                }
                resizeMode="cover"
              />

              {/* DISCOUNT */}

              {product.discount > 0 && (
                <View className="absolute bottom-4 left-4 rounded-full bg-black px-4 py-2">
                  <Text className="text-xs font-bold text-white">
                    {product.discount}% OFF
                  </Text>
                </View>
              )}

              {/* STOCK */}

              {product.stock <= 0 && (
                <View className="absolute bottom-4 right-4 rounded-full bg-black/80 px-4 py-2">
                  <Text className="text-xs font-bold text-white">
                    OUT OF STOCK
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* =================================================
              TABLET / DETAILS
          ================================================= */}

          <View className={isTablet ? "mt-8 flex-row gap-10" : "w-full"}>
            <View className={isTablet ? "flex-1" : "mt-7"}>
              {/* BRAND */}

              <View className="flex-row items-center">
                <Text className="text-xs font-medium tracking-[3px] text-neutral-500">
                  {product.brand ? product.brand.toUpperCase() : "RARITONE"}
                </Text>

                {product.subcategory ? (
                  <>
                    <View className="mx-3 h-1 w-1 rounded-full bg-neutral-300" />

                    <Text
                      numberOfLines={1}
                      className="max-w-[45%] text-xs text-neutral-500"
                    >
                      {product.subcategory}
                    </Text>
                  </>
                ) : null}
              </View>

              {/* PRODUCT NAME */}

              <Text
                className={
                  isTablet
                    ? "mt-4 text-5xl font-bold leading-tight text-black"
                    : isSmallPhone
                      ? "mt-4 text-2xl font-bold leading-tight text-black"
                      : "mt-4 text-3xl font-bold leading-tight text-black"
                }
              >
                {product.name}
              </Text>

              {/* CATEGORY */}

              <Text className="mt-4 text-sm text-neutral-500">
                {product.category}

                {product.gender ? ` · ${product.gender}` : ""}
              </Text>

              {/* PRICE */}

              <View className="mt-6 flex-row flex-wrap items-center">
                <Text
                  className={
                    isTablet
                      ? "text-3xl font-bold text-black"
                      : "text-2xl font-bold text-black"
                  }
                >
                  {formatPrice(discountedPrice)}
                </Text>

                {product.discount > 0 && oldPrice > discountedPrice && (
                  <Text className="ml-3 text-sm text-neutral-400 line-through">
                    {formatPrice(oldPrice)}
                  </Text>
                )}

                {product.discount > 0 && (
                  <View className="ml-3 rounded-full bg-green-50 px-3 py-1.5">
                    <Text className="text-xs font-semibold text-green-700">
                      Save {product.discount}%
                    </Text>
                  </View>
                )}
              </View>

              {/* DIVIDER */}

              <View className="mt-7 h-px bg-neutral-200" />

              {/* =================================================
                  META
              ================================================= */}

              <View className="mt-6 flex-row">
                <View className="flex-1">
                  <Text className="text-xs font-medium text-neutral-400">
                    AVAILABILITY
                  </Text>

                  <View className="mt-2 flex-row items-center">
                    <View
                      className={`h-2 w-2 rounded-full ${
                        product.stock > 0 ? "bg-green-500" : "bg-red-500"
                      }`}
                    />

                    <Text className="ml-2 text-sm text-black">
                      {product.stock > 0
                        ? product.stock <= 5
                          ? `Only ${product.stock} left`
                          : `${product.stock} available`
                        : "Out of stock"}
                    </Text>
                  </View>
                </View>

                <View className="flex-1">
                  <Text className="text-xs font-medium text-neutral-400">
                    CATEGORY
                  </Text>

                  <Text numberOfLines={1} className="mt-2 text-sm text-black">
                    {product.subcategory || product.category}
                  </Text>
                </View>
              </View>

              {/* =================================================
                  QUANTITY
              ================================================= */}

              {product.stock > 0 && (
                <View className="mt-7 flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-black">
                      Quantity
                    </Text>

                    <Text className="mt-1 text-xs text-neutral-400">
                      Maximum {product.stock}
                    </Text>
                  </View>

                  <View className="ml-4 flex-row items-center rounded-full border border-neutral-200 bg-neutral-50">
                    <Pressable
                      onPress={decreaseQuantity}
                      disabled={quantity <= 1}
                      className="h-11 w-11 items-center justify-center rounded-full"
                      style={{
                        opacity: quantity <= 1 ? 0.35 : 1,
                      }}
                    >
                      <Ionicons name="remove" size={18} color="#111111" />
                    </Pressable>

                    <Text className="min-w-[30px] text-center text-sm font-bold text-black">
                      {quantity}
                    </Text>

                    <Pressable
                      onPress={increaseQuantity}
                      disabled={quantity >= product.stock}
                      className="h-11 w-11 items-center justify-center rounded-full"
                      style={{
                        opacity: quantity >= product.stock ? 0.35 : 1,
                      }}
                    >
                      <Ionicons name="add" size={18} color="#111111" />
                    </Pressable>
                  </View>
                </View>
              )}

              {/* =================================================
                  TOTAL
              ================================================= */}

              {product.stock > 0 && (
                <View className="mt-5 flex-row items-center justify-between rounded-2xl bg-neutral-50 px-4 py-3.5">
                  <View className="flex-1">
                    <Text className="text-xs text-neutral-500">Total</Text>

                    <Text className="mt-1 text-xs text-neutral-400">
                      {quantity} × {formatPrice(discountedPrice)}
                    </Text>
                  </View>

                  <View className="items-end">
                    <Text className="text-lg font-bold text-black">
                      {formatPrice(totalPrice)}
                    </Text>

                    {savings > 0 && (
                      <Text className="mt-1 text-xs font-semibold text-green-700">
                        You save {formatPrice(savings)}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {/* =================================================
                  ABOUT
              ================================================= */}

              <View className="mt-8">
                <Text className="text-lg font-bold text-black">
                  About this product
                </Text>

                <Text className="mt-3 text-sm leading-6 text-neutral-500">
                  {product.description ||
                    "Discover the perfect addition to your wardrobe with this carefully selected Raritone product. Designed to bring effortless style to your everyday look."}
                </Text>
              </View>

              {/* =================================================
                  ACTIONS
              ================================================= */}

              <View className="mt-8">
                {/* TRY ON */}

                <TouchableOpacity
                  disabled={product.stock <= 0}
                  onPress={handleTryOn}
                  activeOpacity={0.8}
                  className={`items-center rounded-full py-4 ${
                    product.stock > 0 ? "bg-black" : "bg-neutral-200"
                  }`}
                >
                  <View className="flex-row items-center">
                    <Ionicons
                      name="sparkles-outline"
                      size={19}
                      color={product.stock > 0 ? "white" : "#A3A3A3"}
                    />

                    <Text
                      className={`ml-2 text-base font-bold ${
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
                  className={`mt-3 items-center rounded-full border py-4 ${
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
                          ? "#A3A3A3"
                          : addedToCart
                            ? "#16A34A"
                            : "#111111"
                      }
                    />

                    <Text
                      className={`ml-2 text-base font-bold ${
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
                          ? "Added to Cart"
                          : "Add to Cart"}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* BUY NOW */}

                <TouchableOpacity
                  disabled={product.stock <= 0 || isBuying}
                  onPress={handleBuyNow}
                  activeOpacity={0.8}
                  className={`mt-3 items-center rounded-full py-4 ${
                    product.stock > 0 ? "bg-neutral-900" : "bg-neutral-200"
                  }`}
                >
                  {isBuying ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <View className="flex-row items-center">
                      <Ionicons
                        name="flash-outline"
                        size={19}
                        color={product.stock > 0 ? COLORS.white : "#A3A3A3"}
                      />

                      <Text
                        className={`ml-2 text-base font-bold ${
                          product.stock > 0 ? "text-white" : "text-neutral-400"
                        }`}
                      >
                        Buy Now
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* =================================================
                  WISHLIST
              ================================================= */}

              <TouchableOpacity
                onPress={handleWishlist}
                activeOpacity={0.8}
                className="mt-4 flex-row items-center justify-center rounded-full border border-neutral-200 py-3.5"
              >
                <Ionicons
                  name={isWishlisted ? "heart" : "heart-outline"}
                  size={18}
                  color={isWishlisted ? COLORS.red : COLORS.black}
                />

                <Text
                  className={`ml-2 text-sm font-semibold ${
                    isWishlisted ? "text-red-600" : "text-black"
                  }`}
                >
                  {isWishlisted ? "Saved to Wishlist" : "Add to Wishlist"}
                </Text>
              </TouchableOpacity>

              {/* =================================================
                  BENEFITS
              ================================================= */}

              <View className="mt-8 border-t border-neutral-200 pt-7">
                <Benefit
                  icon="car-outline"
                  title="Fast Delivery"
                  description="Quick and reliable delivery to your doorstep."
                />

                <Benefit
                  icon="refresh-outline"
                  title="Easy Returns"
                  description="Hassle-free return experience."
                />

                <Benefit
                  icon="shield-checkmark-outline"
                  title="Secure Shopping"
                  description="Your shopping experience is safe and secure."
                />
              </View>

              {/* =================================================
                  EXTRA BOTTOM SPACE
                  Keeps content comfortably above sticky bar.
              ================================================= */}

              {!isTablet && (
                <View
                  style={{
                    height: stickyBarHeight + 25,
                  }}
                />
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* =====================================================
          MOBILE STICKY ACTION BAR
      ===================================================== */}

      {!isTablet && product.stock > 0 && (
        <View
          className="absolute bottom-0 left-0 right-0 bg-white"
          style={{
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
            paddingHorizontal: horizontalPadding,
            paddingTop: 10,
            paddingBottom: Math.max(insets.bottom, 10),
            minHeight: stickyBarHeight,
            elevation: 12,
            shadowColor: "#000000",
            shadowOffset: {
              width: 0,
              height: -3,
            },
            shadowOpacity: 0.08,
            shadowRadius: 8,
          }}
        >
          <View className="flex-row items-center">
            {/* WISHLIST */}

            <Pressable
              onPress={handleWishlist}
              className="mr-2 items-center justify-center rounded-full border border-neutral-200"
              style={{
                width: 48,
                height: 48,
              }}
            >
              <Ionicons
                name={isWishlisted ? "heart" : "heart-outline"}
                size={20}
                color={isWishlisted ? COLORS.red : COLORS.black}
              />
            </Pressable>

            {/* ADD TO CART */}

            <Pressable
              onPress={handleAddToCart}
              className="mr-2 flex-1 items-center justify-center rounded-full border border-black"
              style={{
                minHeight: 48,
                paddingHorizontal: 8,
              }}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                className="text-sm font-bold text-black"
              >
                {addedToCart ? "Added" : "Add to Cart"}
              </Text>
            </Pressable>

            {/* BUY NOW */}

            <Pressable
              onPress={handleBuyNow}
              disabled={isBuying}
              className="flex-1 items-center justify-center rounded-full bg-black"
              style={{
                minHeight: 48,
                paddingHorizontal: 8,
                opacity: isBuying ? 0.65 : 1,
              }}
            >
              {isBuying ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                  className="text-sm font-bold text-white"
                >
                  Buy Now
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

/* =========================================================
   BENEFIT
========================================================= */

function Benefit({
  icon,
  title,
  description,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}) {
  return (
    <View className="mb-5 flex-row items-start">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
        <Ionicons name={icon} size={19} color="#111111" />
      </View>

      <View className="ml-3 flex-1">
        <Text className="text-sm font-semibold text-black">{title}</Text>

        <Text className="mt-1 text-xs leading-5 text-neutral-500">
          {description}
        </Text>
      </View>
    </View>
  );
}
