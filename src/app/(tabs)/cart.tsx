import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useCartStore } from "../../store/cartStore";

export default function CartScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const items = useCartStore((state) => state.items);
  const increaseQuantity = useCartStore((state) => state.increaseQuantity);
  const decreaseQuantity = useCartStore((state) => state.decreaseQuantity);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);

  // --------------------------------------------------
  // RESPONSIVE
  // --------------------------------------------------

  const isSmallPhone = width < 360;
  const isPhone = width < 600;
  const isTablet = width >= 600;

  const horizontalPadding = isSmallPhone
    ? 16
    : isPhone
      ? 20
      : isTablet
        ? 32
        : 48;

  const contentWidth = isTablet
    ? Math.min(width - horizontalPadding * 2, 1200)
    : width - horizontalPadding * 2;

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  // --------------------------------------------------
  // GO TO CHECKOUT
  // --------------------------------------------------

  const handleProceedToCheckout = () => {
    router.push("/checkout");
  };

  // --------------------------------------------------
  // EMPTY CART
  // --------------------------------------------------

  if (items.length === 0) {
    return (
      <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-white">
        <View
          className="flex-1 items-center justify-center"
          style={{
            paddingHorizontal: horizontalPadding,
          }}
        >
          <View
            className={`rounded-full bg-neutral-100 items-center justify-center ${
              isSmallPhone ? "w-20 h-20" : "w-24 h-24"
            }`}
          >
            <Ionicons
              name="bag-outline"
              size={isSmallPhone ? 36 : 42}
              color="#737373"
            />
          </View>

          <Text
            className="text-black font-bold text-center mt-6"
            style={{
              fontSize: isSmallPhone ? 23 : 27,
            }}
          >
            Your cart is empty
          </Text>

          <Text className="text-neutral-500 text-center mt-3 text-base leading-6 max-w-sm">
            Looks like you haven't added anything to your cart yet.
          </Text>

          <Pressable
            className="bg-black rounded-full px-8 py-4 mt-8"
            onPress={() => router.push("/(tabs)/shop")}
          >
            <Text className="text-white font-bold">Start Shopping</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // --------------------------------------------------
  // CART
  // --------------------------------------------------

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 190,
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: contentWidth,
            paddingTop: isSmallPhone ? 16 : isPhone ? 20 : 28,
          }}
        >
          {/* ========================================== */}
          {/* HEADER */}
          {/* ========================================== */}

          <View className="mb-7">
            <Text
              className="text-black font-bold"
              style={{
                fontSize: isSmallPhone ? 28 : isPhone ? 31 : isTablet ? 38 : 42,
              }}
            >
              Your Cart
            </Text>

            <Text className="text-neutral-500 mt-2">
              {totalItems} {totalItems === 1 ? "item" : "items"}
            </Text>
          </View>

          {/* ========================================== */}
          {/* CART ITEMS */}
          {/* ========================================== */}

          <View
            className={isTablet ? "flex-row flex-wrap justify-between" : ""}
          >
            {items.map((item) => (
              <View
                key={item._id}
                className={`bg-white border border-neutral-200 rounded-3xl p-4 mb-4 ${
                  isTablet ? "w-[48.5%]" : "w-full"
                }`}
              >
                <View className="flex-row">
                  {/* PRODUCT IMAGE */}

                  <Image
                    source={{
                      uri: item.image,
                    }}
                    className={`rounded-2xl bg-neutral-100 ${
                      isSmallPhone
                        ? "w-24 h-28"
                        : isPhone
                          ? "w-28 h-32"
                          : "w-32 h-36"
                    }`}
                    resizeMode="cover"
                  />

                  {/* PRODUCT INFO */}

                  <View className="flex-1 ml-4">
                    <View className="flex-row justify-between">
                      <View className="flex-1 pr-2">
                        <Text
                          className="text-neutral-500 text-xs uppercase"
                          numberOfLines={1}
                          style={{
                            letterSpacing: 1,
                          }}
                        >
                          {item.brand}
                        </Text>

                        <Text
                          className="text-black font-semibold text-base mt-1"
                          numberOfLines={2}
                        >
                          {item.name}
                        </Text>
                      </View>

                      {/* REMOVE */}

                      <Pressable
                        onPress={() => removeFromCart(item._id)}
                        hitSlop={8}
                        className="w-9 h-9 rounded-full bg-neutral-100 items-center justify-center"
                      >
                        <Ionicons
                          name="trash-outline"
                          size={17}
                          color="#737373"
                        />
                      </Pressable>
                    </View>

                    {/* PRICE */}

                    <Text className="text-black font-bold text-lg mt-4">
                      ₹{item.price.toLocaleString("en-IN")}
                    </Text>

                    {/* QUANTITY */}

                    <View className="flex-row items-center justify-between mt-4">
                      <View className="flex-row items-center bg-neutral-100 rounded-full">
                        <Pressable
                          onPress={() => decreaseQuantity(item._id)}
                          hitSlop={5}
                          className="w-9 h-9 items-center justify-center"
                        >
                          <Ionicons name="remove" size={17} color="#111111" />
                        </Pressable>

                        <Text className="text-black font-semibold px-2">
                          {item.quantity}
                        </Text>

                        <Pressable
                          onPress={() => increaseQuantity(item._id)}
                          hitSlop={5}
                          className="w-9 h-9 items-center justify-center"
                        >
                          <Ionicons name="add" size={17} color="#111111" />
                        </Pressable>
                      </View>

                      {/* ITEM TOTAL */}

                      <Text className="text-neutral-600 text-sm font-medium">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* ========================================== */}
          {/* ORDER SUMMARY */}
          {/* ========================================== */}

          <View className="bg-neutral-50 border border-neutral-200 rounded-3xl p-5 mt-4">
            <Text className="text-black text-xl font-bold mb-5">
              Order Summary
            </Text>

            {/* ITEMS */}

            <View className="flex-row justify-between mb-3">
              <Text className="text-neutral-500">Items ({totalItems})</Text>

              <Text className="text-neutral-800 font-medium">
                ₹{totalPrice.toLocaleString("en-IN")}
              </Text>
            </View>

            {/* DELIVERY */}

            <View className="flex-row justify-between mb-3">
              <Text className="text-neutral-500">Delivery</Text>

              <Text className="text-green-600 font-semibold">FREE</Text>
            </View>

            {/* DIVIDER */}

            <View className="h-px bg-neutral-200 my-3" />

            {/* TOTAL */}

            <View className="flex-row justify-between">
              <Text className="text-black text-lg font-bold">Total</Text>

              <Text className="text-black text-xl font-bold">
                ₹{totalPrice.toLocaleString("en-IN")}
              </Text>
            </View>

            {/* CHECKOUT */}

            <Pressable
              className="bg-black rounded-full py-4 mt-6 items-center"
              onPress={handleProceedToCheckout}
            >
              <View className="flex-row items-center">
                <Text className="text-white font-bold text-base">
                  Proceed to Checkout
                </Text>

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
        </View>
      </ScrollView>

      {/* ========================================== */}
      {/* MOBILE STICKY CHECKOUT */}
      {/* ========================================== */}

      {!isTablet && (
        <View className="absolute left-0 right-0 bottom-0 bg-white border-t border-neutral-200 px-5 pt-3 pb-3">
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-neutral-500 text-xs">TOTAL</Text>

              <Text className="text-black text-xl font-bold mt-1">
                ₹{totalPrice.toLocaleString("en-IN")}
              </Text>
            </View>

            <Text className="text-neutral-500 text-sm">
              {totalItems} {totalItems === 1 ? "item" : "items"}
            </Text>
          </View>

          <Pressable
            className="bg-black rounded-full items-center justify-center"
            style={{
              minHeight: 52,
            }}
            onPress={handleProceedToCheckout}
          >
            <View className="flex-row items-center">
              <Text className="text-white font-bold">Proceed to Checkout</Text>

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
