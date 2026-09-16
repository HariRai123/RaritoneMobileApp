import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useCartStore } from "../../store/cartStore";

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

export default function CartScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  /* =======================================================
     CART STORE
  ======================================================= */

  const items = useCartStore((state) => state.items);

  const increaseQuantity = useCartStore((state) => state.increaseQuantity);

  const decreaseQuantity = useCartStore((state) => state.decreaseQuantity);

  const removeFromCart = useCartStore((state) => state.removeFromCart);

  const clearCart = useCartStore((state) => state.clearCart);

  const getTotalItems = useCartStore((state) => state.getTotalItems);

  const getTotalPrice = useCartStore((state) => state.getTotalPrice);

  /* =======================================================
     RESPONSIVE
  ======================================================= */

  const isSmallPhone = width < 360;

  const isPhone = width < 600;

  const isTablet = width >= 600;

  const horizontalPadding = isSmallPhone ? 16 : isPhone ? 20 : 32;

  const contentWidth = isTablet
    ? Math.min(width - horizontalPadding * 2, 1200)
    : width - horizontalPadding * 2;

  /* =======================================================
     TOTALS
  ======================================================= */

  const totalItems = getTotalItems();

  const subtotal = getTotalPrice();

  const deliveryCharge = subtotal > 0 ? 0 : 0;

  const total = subtotal + deliveryCharge;

  /* =======================================================
     FORMAT
  ======================================================= */

  const formatPrice = (value: number) => {
    return `₹${Number(value).toLocaleString("en-IN")}`;
  };

  /* =======================================================
     CHECKOUT
  ======================================================= */

  const handleProceedToCheckout = () => {
    if (items.length === 0) {
      return;
    }

    router.push("/checkout");
  };

  /* =======================================================
     REMOVE ITEM
  ======================================================= */

  const handleRemove = (id: string, name: string) => {
    Alert.alert("Remove item", `Remove "${name}" from your cart?`, [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => removeFromCart(id),
      },
    ]);
  };

  /* =======================================================
     CLEAR CART
  ======================================================= */

  const handleClearCart = () => {
    Alert.alert("Clear cart", "Remove all items from your cart?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Clear All",
        style: "destructive",
        onPress: clearCart,
      },
    ]);
  };

  /* =======================================================
     EMPTY CART
  ======================================================= */

  if (items.length === 0) {
    return (
      <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-6">
          <View
            className="items-center justify-center rounded-full bg-neutral-100"
            style={{
              width: isSmallPhone ? 80 : 96,
              height: isSmallPhone ? 80 : 96,
            }}
          >
            <Ionicons
              name="bag-outline"
              size={isSmallPhone ? 36 : 42}
              color="#737373"
            />
          </View>

          <Text
            className="mt-6 text-center font-bold text-black"
            style={{
              fontSize: isSmallPhone ? 23 : 27,
            }}
          >
            Your cart is empty
          </Text>

          <Text className="mt-3 max-w-sm text-center text-base leading-6 text-neutral-500">
            Looks like you haven't added anything to your cart yet.
          </Text>

          <Pressable
            className="mt-8 rounded-full bg-black px-8 py-4"
            onPress={() => router.push("/(tabs)/shop")}
          >
            <Text className="font-bold text-white">Start Shopping</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  /* =======================================================
     CART
  ======================================================= */

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          alignItems: "center",
          paddingBottom: isTablet ? 60 : 180,
        }}
      >
        <View
          style={{
            width: contentWidth,
            paddingTop: isSmallPhone ? 16 : isPhone ? 20 : 28,
          }}
        >
          {/* ===========================================
              HEADER
          =========================================== */}

          <View className="mb-5 flex-row items-end justify-between">
            <View className="flex-1">
              <Text
                className="font-bold text-black"
                style={{
                  fontSize: isSmallPhone ? 28 : isPhone ? 31 : 38,
                }}
              >
                Your Cart
              </Text>

              <Text className="mt-2 text-neutral-500">
                {totalItems} {totalItems === 1 ? "item" : "items"}
              </Text>
            </View>

            {/* CLEAR */}

            <Pressable
              onPress={handleClearCart}
              className="mb-1 ml-3 flex-row items-center rounded-full bg-neutral-100 px-3 py-2.5"
            >
              <Ionicons name="trash-outline" size={14} color="#666666" />

              <Text className="ml-1.5 text-xs font-semibold text-neutral-600">
                Clear
              </Text>
            </Pressable>
          </View>

          {/* ===========================================
              CART ITEMS
          =========================================== */}

          <View
            className={isTablet ? "flex-row flex-wrap justify-between" : ""}
          >
            {items.map((item) => {
              const itemTotal = item.price * item.quantity;

              const isMaxQuantity = item.quantity >= item.stock;

              return (
                <View
                  key={item._id}
                  className={`mb-4 overflow-hidden rounded-3xl border border-neutral-200 bg-white p-4 ${
                    isTablet ? "w-[48.5%]" : "w-full"
                  }`}
                >
                  {/* =================================
                        PRODUCT
                    ================================= */}

                  <View className="flex-row">
                    {/* IMAGE */}

                    <Pressable
                      onPress={() => router.push(`/product/${item._id}`)}
                    >
                      <Image
                        source={{
                          uri: item.image,
                        }}
                        className={
                          isSmallPhone
                            ? "h-28 w-24 rounded-2xl bg-neutral-100"
                            : isPhone
                              ? "h-32 w-28 rounded-2xl bg-neutral-100"
                              : "h-36 w-32 rounded-2xl bg-neutral-100"
                        }
                        resizeMode="cover"
                      />
                    </Pressable>

                    {/* INFO */}

                    <View className="ml-4 flex-1">
                      <View className="flex-row">
                        <View className="min-w-0 flex-1 pr-2">
                          <Text
                            className="text-xs uppercase text-neutral-500"
                            numberOfLines={1}
                            style={{
                              letterSpacing: 1,
                            }}
                          >
                            {item.brand || "RARITONE"}
                          </Text>

                          <Text
                            className="mt-1 text-base font-semibold text-black"
                            numberOfLines={2}
                          >
                            {item.name}
                          </Text>
                        </View>

                        {/* REMOVE */}

                        <Pressable
                          onPress={() => handleRemove(item._id, item.name)}
                          hitSlop={8}
                          className="h-9 w-9 items-center justify-center rounded-full bg-neutral-100"
                        >
                          <Ionicons
                            name="trash-outline"
                            size={17}
                            color="#737373"
                          />
                        </Pressable>
                      </View>

                      {/* PRICE */}

                      <Text className="mt-3 text-lg font-bold text-black">
                        {formatPrice(item.price)}
                      </Text>

                      {/* UNIT STOCK */}

                      {item.stock <= 5 && (
                        <Text
                          className={`mt-1 text-xs font-medium ${
                            item.stock === 0
                              ? "text-red-600"
                              : "text-orange-600"
                          }`}
                        >
                          {item.stock === 0
                            ? "Currently unavailable"
                            : `Only ${item.stock} left`}
                        </Text>
                      )}

                      {/* QUANTITY */}

                      <View className="mt-3 flex-row items-center justify-between">
                        <View className="flex-row items-center rounded-full bg-neutral-100">
                          <Pressable
                            onPress={() => decreaseQuantity(item._id)}
                            hitSlop={5}
                            className="h-9 w-9 items-center justify-center"
                          >
                            <Ionicons name="remove" size={17} color="#111111" />
                          </Pressable>

                          <Text className="min-w-[28px] px-1 text-center font-semibold text-black">
                            {item.quantity}
                          </Text>

                          <Pressable
                            onPress={() => increaseQuantity(item._id)}
                            disabled={isMaxQuantity}
                            hitSlop={5}
                            className="h-9 w-9 items-center justify-center"
                            style={{
                              opacity: isMaxQuantity ? 0.35 : 1,
                            }}
                          >
                            <Ionicons name="add" size={17} color="#111111" />
                          </Pressable>
                        </View>

                        {/* ITEM TOTAL */}

                        <Text className="ml-2 text-sm font-semibold text-neutral-700">
                          {formatPrice(itemTotal)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {/* ===========================================
              FREE DELIVERY
          =========================================== */}

          <View className="mt-2 flex-row items-center rounded-2xl bg-green-50 px-4 py-3.5">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-green-100">
              <Ionicons name="car-outline" size={18} color={COLORS.green} />
            </View>

            <View className="ml-3 flex-1">
              <Text className="text-sm font-semibold text-green-800">
                Free delivery
              </Text>

              <Text className="mt-1 text-xs text-green-700">
                Enjoy free delivery on your order.
              </Text>
            </View>

            <Ionicons name="checkmark-circle" size={21} color={COLORS.green} />
          </View>

          {/* ===========================================
              ORDER SUMMARY
          =========================================== */}

          <View className="mt-5 rounded-3xl border border-neutral-200 bg-neutral-50 p-5">
            <Text className="mb-5 text-xl font-bold text-black">
              Order Summary
            </Text>

            {/* ITEMS */}

            <View className="mb-3 flex-row justify-between">
              <Text className="text-neutral-500">Items ({totalItems})</Text>

              <Text className="font-medium text-neutral-800">
                {formatPrice(subtotal)}
              </Text>
            </View>

            {/* DELIVERY */}

            <View className="mb-3 flex-row justify-between">
              <Text className="text-neutral-500">Delivery</Text>

              <Text className="font-semibold text-green-600">FREE</Text>
            </View>

            {/* DIVIDER */}

            <View className="my-3 h-px bg-neutral-200" />

            {/* TOTAL */}

            <View className="flex-row justify-between">
              <Text className="text-lg font-bold text-black">Total</Text>

              <Text className="text-xl font-bold text-black">
                {formatPrice(total)}
              </Text>
            </View>

            {/* CHECKOUT */}
          </View>
        </View>
      </ScrollView>

      {/* =================================================
          MOBILE STICKY CHECKOUT
      ================================================= */}

      {!isTablet && (
        <View
          className="absolute bottom-0 left-0 right-0 border-t bg-white"
          style={{
            borderTopColor: COLORS.border,
            paddingHorizontal: horizontalPadding,
            paddingTop: 10,
            paddingBottom: 10,
          }}
        >
          <View className="mb-3 flex-row items-center justify-between">
            <View>
              <Text className="text-xs text-neutral-500">TOTAL</Text>

              <Text className="mt-1 text-xl font-bold text-black">
                {formatPrice(total)}
              </Text>
            </View>

            <Text className="text-sm text-neutral-500">
              {totalItems} {totalItems === 1 ? "item" : "items"}
            </Text>
          </View>

          <Pressable
            className="min-h-[52px] items-center justify-center rounded-full bg-black"
            onPress={handleProceedToCheckout}
          >
            <View className="flex-row items-center">
              <Text className="font-bold text-white">Proceed to Checkout</Text>

              <Ionicons
                name="arrow-forward"
                size={18}
                color="white"
                style={{
                  marginLeft: 8,
                }}
              />
            </View>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
