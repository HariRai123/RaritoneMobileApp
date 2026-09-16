import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
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

import { auth } from "../config/firebase";
import api from "../services/api";
import { useCartStore } from "../store/cartStore";

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

export default function CheckoutScreen() {
  const router = useRouter();

  const { width } = useWindowDimensions();

  const insets = useSafeAreaInsets();

  /* =======================================================
     CART
  ======================================================= */

  const items = useCartStore((state) => state.items);

  const getTotalItems = useCartStore((state) => state.getTotalItems);

  const getTotalPrice = useCartStore((state) => state.getTotalPrice);

  const clearCart = useCartStore((state) => state.clearCart);

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
     STICKY BAR HEIGHT
  ======================================================= */

  const stickyBarHeight = Math.max(92, 78 + Math.max(insets.bottom, 10));

  /* =======================================================
     CART TOTALS
  ======================================================= */

  const totalItems = getTotalItems();

  const subtotal = getTotalPrice();

  const deliveryCharge = 0;

  const totalPrice = subtotal + deliveryCharge;

  /* =======================================================
     FORM
  ======================================================= */

  const [fullName, setFullName] = useState("");

  const [phone, setPhone] = useState("");

  const [address, setAddress] = useState("");

  const [city, setCity] = useState("");

  const [state, setState] = useState("");

  const [pincode, setPincode] = useState("");

  /* =======================================================
     ORDER STATE
  ======================================================= */

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  /* =======================================================
     FORMAT PRICE
  ======================================================= */

  const formatPrice = useCallback((price: number) => {
    return `₹${Number(price).toLocaleString("en-IN")}`;
  }, []);

  /* =======================================================
     FORM VALIDATION
  ======================================================= */

  const validateForm = useCallback(() => {
    const trimmedName = fullName.trim();

    const trimmedPhone = phone.trim();

    const trimmedAddress = address.trim();

    const trimmedCity = city.trim();

    const trimmedState = state.trim();

    const trimmedPincode = pincode.trim();

    if (!trimmedName) {
      Alert.alert("Missing Information", "Please enter your full name.");
      return false;
    }

    const nameParts = trimmedName.split(/\s+/);

    if (nameParts.length < 2) {
      Alert.alert(
        "Enter Full Name",
        "Please enter both your first name and last name.",
      );
      return false;
    }

    if (!/^[6-9]\d{9}$/.test(trimmedPhone)) {
      Alert.alert(
        "Invalid Phone Number",
        "Please enter a valid 10-digit Indian mobile number.",
      );
      return false;
    }

    if (!trimmedAddress) {
      Alert.alert("Missing Address", "Please enter your delivery address.");
      return false;
    }

    if (!trimmedCity) {
      Alert.alert("Missing City", "Please enter your city.");
      return false;
    }

    if (!trimmedState) {
      Alert.alert("Missing State", "Please enter your state.");
      return false;
    }

    if (!/^\d{6}$/.test(trimmedPincode)) {
      Alert.alert("Invalid PIN Code", "Please enter a valid 6-digit PIN code.");
      return false;
    }

    return true;
  }, [fullName, phone, address, city, state, pincode]);

  /* =======================================================
     PLACE ORDER
  ======================================================= */

  const handlePlaceOrder = async () => {
    if (isPlacingOrder) {
      return;
    }

    if (items.length === 0) {
      Alert.alert(
        "Cart is Empty",
        "Please add products before placing an order.",
      );
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setIsPlacingOrder(true);

      /* ================================================
           FIREBASE AUTH
        ================================================ */

      const firebaseUser = auth.currentUser;

      if (!firebaseUser) {
        Alert.alert(
          "Authentication Required",
          "Your login session is not available. Please login again.",
          [
            {
              text: "Login",
              onPress: () => router.replace("/login"),
            },
          ],
        );

        return;
      }

      /* ================================================
           FIREBASE TOKEN
        ================================================ */

      const firebaseToken = await firebaseUser.getIdToken(true);

      if (!firebaseToken) {
        throw new Error("Unable to get Firebase authentication token.");
      }

      /* ================================================
           EMAIL
        ================================================ */

      const email = firebaseUser.email?.trim().toLowerCase();

      if (!email) {
        Alert.alert(
          "Email Required",
          "Your account does not have an email address.",
        );

        return;
      }

      /* ================================================
           NAME
        ================================================ */

      const trimmedName = fullName.trim();

      const nameParts = trimmedName.split(/\s+/);

      const firstName = nameParts[0];

      const lastName = nameParts.slice(1).join(" ");

      /* ================================================
           ADDRESS
        ================================================ */

      const trimmedPhone = phone.trim();

      const trimmedAddress = address.trim();

      const trimmedCity = city.trim();

      const trimmedState = state.trim();

      const trimmedPincode = pincode.trim();

      /* ================================================
           ORDER ITEMS
        ================================================ */

      const orderItems = items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      /* ================================================
           REQUEST
        ================================================ */

      const orderData = {
        items: orderItems,

        shippingAddress: {
          firstName,
          lastName,
          email,
          phone: trimmedPhone,
          address: trimmedAddress,
          city: trimmedCity,
          state: trimmedState,
          pincode: trimmedPincode,
        },

        paymentMethod: "cod",
      };

      console.log("ORDER REQUEST:", JSON.stringify(orderData, null, 2));

      /* ================================================
           BACKEND
        ================================================ */

      const response = await api.post("/orders", orderData, {
        headers: {
          Authorization: `Bearer ${firebaseToken}`,
        },
      });

      console.log("ORDER RESPONSE:", response.data);

      const createdOrder = response.data?.order;

      if (!createdOrder) {
        throw new Error("Invalid order response from backend.");
      }

      /* ================================================
           CLEAR CART
        ================================================ */

      clearCart();

      /* ================================================
           SUCCESS
        ================================================ */

      const orderNumber =
        createdOrder.orderNumber ||
        createdOrder.orderId ||
        createdOrder._id ||
        "";

      Alert.alert(
        "Order Placed Successfully",
        orderNumber
          ? `Your order has been placed successfully.\n\nOrder ID: ${orderNumber}`
          : "Your order has been placed successfully.",
        [
          {
            text: "Continue Shopping",
            onPress: () => router.replace("/(tabs)/shop"),
          },
          {
            text: "View Orders",
            onPress: () => router.replace("/(tabs)/profile"),
          },
        ],
        {
          cancelable: false,
        },
      );
    } catch (error: any) {
      console.error("PLACE ORDER ERROR:", error);

      const status = error?.response?.status;

      let message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to place your order. Please try again.";

      /* ================================================
           401
        ================================================ */

      if (status === 401) {
        message = "Your login session has expired. Please login again.";

        Alert.alert("Authentication Required", message, [
          {
            text: "Login",
            onPress: () => router.replace("/login"),
          },
        ]);

        return;
      }

      /* ================================================
           404
        ================================================ */

      if (status === 404) {
        message =
          error?.response?.data?.message ||
          "Your account or order service could not be found.";
      }

      /* ================================================
           409
        ================================================ */

      if (status === 409) {
        message =
          error?.response?.data?.message ||
          "Stock changed while placing your order. Please review your cart and try again.";
      }

      /* ================================================
           400
        ================================================ */

      if (status === 400) {
        message =
          error?.response?.data?.message ||
          "Some order information is invalid. Please review your details.";
      }

      /* ================================================
           500
        ================================================ */

      if (status === 500) {
        message =
          error?.response?.data?.message ||
          "Server error while placing your order. Please try again.";
      }

      Alert.alert("Unable to Place Order", message);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  /* =======================================================
     EMPTY CART
  ======================================================= */

  if (items.length === 0) {
    return (
      <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-6">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-neutral-100">
            <Ionicons name="bag-outline" size={36} color="#737373" />
          </View>

          <Text className="mt-6 text-center text-2xl font-bold text-black">
            Your cart is empty
          </Text>

          <Text className="mt-3 max-w-sm text-center leading-6 text-neutral-500">
            Add some products before proceeding to checkout.
          </Text>

          <Pressable
            onPress={() => router.replace("/(tabs)/shop")}
            className="mt-8 rounded-full bg-black px-8 py-4"
          >
            <Text className="font-bold text-white">Continue Shopping</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  /* =======================================================
     MAIN
  ======================================================= */

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-white">
      {/* ===================================================
          HEADER
      =================================================== */}

      <View
        className="flex-row items-center border-b border-neutral-200"
        style={{
          paddingHorizontal: horizontalPadding,
          paddingVertical: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100"
        >
          <Ionicons name="arrow-back" size={21} color="#111111" />
        </Pressable>

        <View className="ml-4 flex-1">
          <Text className="text-xl font-bold text-black">Checkout</Text>

          <Text className="mt-0.5 text-xs text-neutral-400">
            Secure order placement
          </Text>
        </View>

        <View className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
          <Ionicons name="lock-closed-outline" size={18} color="#111111" />
        </View>
      </View>

      {/* ===================================================
          KEYBOARD AVOIDING
      =================================================== */}

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{
            alignItems: "center",

            /*
             * Reserve enough room for sticky
             * bottom Place Order bar.
             */
            paddingBottom: isTablet ? 60 : stickyBarHeight + 35,
          }}
        >
          <View
            style={{
              width: contentWidth,
              paddingTop: isSmallPhone ? 20 : isPhone ? 24 : 32,
            }}
          >
            {/* =============================================
                PROGRESS
            ============================================= */}

            <View className="mb-7 flex-row items-center">
              <CheckoutStep number="1" title="Details" active />

              <View className="mx-2 h-px flex-1 bg-neutral-200" />

              <CheckoutStep number="2" title="Payment" active />

              <View className="mx-2 h-px flex-1 bg-neutral-200" />

              <CheckoutStep number="3" title="Done" />
            </View>

            {/* =============================================
                DELIVERY ADDRESS
            ============================================= */}

            <View className="mb-7">
              <SectionTitle
                icon="location-outline"
                title="Delivery Address"
                subtitle="Where should we deliver your order?"
              />

              <View className="rounded-3xl border border-neutral-200 p-5">
                {/* FULL NAME */}

                <InputLabel label="FULL NAME" />

                <TextInput
                  placeholder="Enter your full name"
                  placeholderTextColor="#A3A3A3"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  returnKeyType="next"
                  className="rounded-2xl border border-neutral-200 px-4 text-black"
                  style={{
                    minHeight: 52,
                  }}
                />

                {/* PHONE */}

                <InputLabel label="PHONE NUMBER" marginTop />

                <TextInput
                  placeholder="10-digit mobile number"
                  placeholderTextColor="#A3A3A3"
                  value={phone}
                  onChangeText={(value) =>
                    setPhone(value.replace(/[^0-9]/g, ""))
                  }
                  keyboardType="phone-pad"
                  maxLength={10}
                  returnKeyType="next"
                  className="rounded-2xl border border-neutral-200 px-4 text-black"
                  style={{
                    minHeight: 52,
                  }}
                />

                {/* ADDRESS */}

                <InputLabel label="ADDRESS" marginTop />

                <TextInput
                  placeholder="House / Flat / Street"
                  placeholderTextColor="#A3A3A3"
                  value={address}
                  onChangeText={setAddress}
                  multiline
                  textAlignVertical="top"
                  className="rounded-2xl border border-neutral-200 px-4 py-4 text-black"
                  style={{
                    minHeight: 95,
                  }}
                />

                {/* CITY */}

                <InputLabel label="CITY" marginTop />

                <TextInput
                  placeholder="City"
                  placeholderTextColor="#A3A3A3"
                  value={city}
                  onChangeText={setCity}
                  autoCapitalize="words"
                  returnKeyType="next"
                  className="rounded-2xl border border-neutral-200 px-4 text-black"
                  style={{
                    minHeight: 52,
                  }}
                />

                {/* STATE */}

                <InputLabel label="STATE" marginTop />

                <TextInput
                  placeholder="State"
                  placeholderTextColor="#A3A3A3"
                  value={state}
                  onChangeText={setState}
                  autoCapitalize="words"
                  returnKeyType="next"
                  className="rounded-2xl border border-neutral-200 px-4 text-black"
                  style={{
                    minHeight: 52,
                  }}
                />

                {/* PIN */}

                <InputLabel label="PIN CODE" marginTop />

                <TextInput
                  placeholder="6-digit PIN code"
                  placeholderTextColor="#A3A3A3"
                  value={pincode}
                  onChangeText={(value) =>
                    setPincode(value.replace(/[^0-9]/g, ""))
                  }
                  keyboardType="number-pad"
                  maxLength={6}
                  returnKeyType="done"
                  className="rounded-2xl border border-neutral-200 px-4 text-black"
                  style={{
                    minHeight: 52,
                  }}
                />

                {/* SECURITY */}

                <View className="mt-5 flex-row items-center rounded-2xl bg-neutral-50 px-4 py-3">
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={18}
                    color={COLORS.green}
                  />

                  <Text className="ml-2 flex-1 text-xs leading-5 text-neutral-500">
                    Your delivery information is securely used only to process
                    this order.
                  </Text>
                </View>
              </View>
            </View>

            {/* =============================================
                YOUR ITEMS
            ============================================= */}

            <View className="mb-7">
              <SectionTitle
                icon="bag-outline"
                title="Your Items"
                subtitle={`${totalItems} ${
                  totalItems === 1 ? "item" : "items"
                } in your order`}
              />

              <View className="overflow-hidden rounded-3xl border border-neutral-200">
                {items.map((item, index) => {
                  const itemTotal = item.price * item.quantity;

                  return (
                    <View
                      key={item._id}
                      className={`p-4 ${
                        index < items.length - 1
                          ? "border-b border-neutral-200"
                          : ""
                      }`}
                    >
                      <View className="flex-row items-center">
                        <View className="h-24 w-20 overflow-hidden rounded-2xl bg-neutral-100">
                          <Image
                            source={{
                              uri: item.image,
                            }}
                            className="h-full w-full"
                            resizeMode="cover"
                          />
                        </View>

                        <View className="ml-4 flex-1">
                          <Text
                            className="text-xs uppercase text-neutral-500"
                            numberOfLines={1}
                          >
                            {item.brand || "RARITONE"}
                          </Text>

                          <Text
                            className="mt-1 text-base font-semibold text-black"
                            numberOfLines={2}
                          >
                            {item.name}
                          </Text>

                          <View className="mt-3 flex-row items-center justify-between">
                            <View className="rounded-full bg-neutral-100 px-3 py-1.5">
                              <Text className="text-xs font-semibold text-neutral-600">
                                Qty: {item.quantity}
                              </Text>
                            </View>

                            <Text className="font-bold text-black">
                              {formatPrice(itemTotal)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* =============================================
                PAYMENT
            ============================================= */}

            <View className="mb-7">
              <SectionTitle
                icon="card-outline"
                title="Payment Method"
                subtitle="Choose how you'd like to pay"
              />

              {/* COD */}

              <View className="rounded-3xl border border-black bg-white p-5">
                <View className="flex-row items-center">
                  <View className="h-11 w-11 items-center justify-center rounded-full bg-black">
                    <Ionicons name="cash-outline" size={22} color="white" />
                  </View>

                  <View className="ml-4 flex-1">
                    <Text className="font-bold text-black">
                      Cash on Delivery
                    </Text>

                    <Text className="mt-1 text-sm text-neutral-500">
                      Pay when your order arrives
                    </Text>
                  </View>

                  <View className="h-6 w-6 items-center justify-center rounded-full bg-black">
                    <Ionicons name="checkmark" size={15} color="white" />
                  </View>
                </View>

                <View className="mt-4 flex-row items-center rounded-2xl bg-neutral-50 px-3 py-3">
                  <Ionicons
                    name="information-circle-outline"
                    size={17}
                    color="#737373"
                  />

                  <Text className="ml-2 flex-1 text-xs leading-5 text-neutral-500">
                    Online payment will be available after the payment gateway
                    is integrated.
                  </Text>
                </View>
              </View>
            </View>

            {/* =============================================
                PRICE SUMMARY
            ============================================= */}

            <View className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5">
              <Text className="mb-5 text-xl font-bold text-black">
                Price Summary
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

              <View className="my-3 h-px bg-neutral-200" />

              {/* TOTAL */}

              <View className="flex-row justify-between">
                <Text className="text-lg font-bold text-black">Total</Text>

                <Text className="text-xl font-bold text-black">
                  {formatPrice(totalPrice)}
                </Text>
              </View>

              {/* COD NOTE */}

              <View className="mt-4 flex-row items-center">
                <Ionicons
                  name="checkmark-circle-outline"
                  size={17}
                  color={COLORS.green}
                />

                <Text className="ml-2 text-xs text-neutral-500">
                  Free delivery • Cash on Delivery
                </Text>
              </View>
            </View>

            {/* =============================================
                MOBILE EXTRA SPACE
            ============================================= */}

            {!isTablet && (
              <View
                style={{
                  height: stickyBarHeight + 25,
                }}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ===================================================
          STICKY PLACE ORDER
      =================================================== */}

      <View
        className="absolute bottom-0 left-0 right-0 bg-white"
        style={{
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          paddingHorizontal: horizontalPadding,
          paddingTop: 10,
          paddingBottom: Math.max(insets.bottom, 10),
          minHeight: isTablet ? 78 : stickyBarHeight,
          elevation: 14,
          shadowColor: "#000000",
          shadowOffset: {
            width: 0,
            height: -3,
          },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        }}
      >
        <View
          className={
            isTablet ? "mx-auto flex-row items-center" : "flex-row items-center"
          }
          style={{
            width: isTablet ? Math.min(contentWidth, 700) : "100%",
          }}
        >
          {/* TOTAL */}

          <View className="mr-4">
            <Text className="text-[10px] font-medium text-neutral-500">
              TOTAL
            </Text>

            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              className="mt-1 text-xl font-bold text-black"
            >
              {formatPrice(totalPrice)}
            </Text>
          </View>

          {/* PLACE ORDER */}

          <Pressable
            disabled={isPlacingOrder}
            onPress={handlePlaceOrder}
            className={`flex-1 items-center justify-center rounded-full ${
              isPlacingOrder ? "bg-neutral-400" : "bg-black"
            }`}
            style={{
              minHeight: 52,
            }}
          >
            {isPlacingOrder ? (
              <View className="flex-row items-center">
                <ActivityIndicator size="small" color="white" />

                <Text className="ml-2 text-base font-bold text-white">
                  Placing Order...
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center">
                <Text className="text-base font-bold text-white">
                  Place Order
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
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

/* =========================================================
   CHECKOUT STEP
========================================================= */

function CheckoutStep({
  number,
  title,
  active = false,
}: {
  number: string;
  title: string;
  active?: boolean;
}) {
  return (
    <View className="items-center">
      <View
        className={`h-8 w-8 items-center justify-center rounded-full ${
          active ? "bg-black" : "bg-neutral-100"
        }`}
      >
        <Text
          className={`text-xs font-bold ${
            active ? "text-white" : "text-neutral-400"
          }`}
        >
          {number}
        </Text>
      </View>

      <Text
        className={`mt-1 text-[9px] font-medium ${
          active ? "text-black" : "text-neutral-400"
        }`}
      >
        {title}
      </Text>
    </View>
  );
}

/* =========================================================
   SECTION TITLE
========================================================= */

function SectionTitle({
  icon,
  title,
  subtitle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}) {
  return (
    <View className="mb-4 flex-row items-center">
      <View className="h-9 w-9 items-center justify-center rounded-full bg-black">
        <Ionicons name={icon} size={18} color="white" />
      </View>

      <View className="ml-3 flex-1">
        <Text className="text-lg font-bold text-black">{title}</Text>

        <Text className="mt-0.5 text-xs text-neutral-400">{subtitle}</Text>
      </View>
    </View>
  );
}

/* =========================================================
   INPUT LABEL
========================================================= */

function InputLabel({
  label,
  marginTop = false,
}: {
  label: string;
  marginTop?: boolean;
}) {
  return (
    <Text
      className={`mb-2 text-xs font-semibold text-neutral-500 ${
        marginTop ? "mt-5" : ""
      }`}
    >
      {label}
    </Text>
  );
}
