import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
    useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { auth } from "../config/firebase";
import api from "../services/api";
import { useCartStore } from "../store/cartStore";

export default function CheckoutScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const items = useCartStore((state) => state.items);
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
  const clearCart = useCartStore((state) => state.clearCart);

  // --------------------------------------------------
  // RESPONSIVE
  // --------------------------------------------------

  const isSmallPhone = width < 360;
  const isPhone = width < 600;
  const isTablet = width >= 600;

  const horizontalPadding = isSmallPhone ? 16 : isPhone ? 20 : 32;

  const contentWidth = isTablet
    ? Math.min(width - horizontalPadding * 2, 1200)
    : width - horizontalPadding * 2;

  // --------------------------------------------------
  // CART TOTALS
  // --------------------------------------------------

  const totalItems = getTotalItems();
  const subtotal = getTotalPrice();

  const deliveryCharge = 0;
  const totalPrice = subtotal + deliveryCharge;

  // --------------------------------------------------
  // FORM STATE
  // --------------------------------------------------

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // --------------------------------------------------
  // EMPTY CART
  // --------------------------------------------------

  if (items.length === 0) {
    return (
      <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 rounded-full bg-neutral-100 items-center justify-center">
            <Ionicons name="bag-outline" size={36} color="#737373" />
          </View>

          <Text className="text-black text-2xl font-bold mt-6 text-center">
            Your cart is empty
          </Text>

          <Text className="text-neutral-500 text-center mt-3 leading-6">
            Add some products before proceeding to checkout.
          </Text>

          <Pressable
            onPress={() => router.replace("/(tabs)/shop")}
            className="bg-black rounded-full px-8 py-4 mt-8"
          >
            <Text className="text-white font-bold">Continue Shopping</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // --------------------------------------------------
  // PLACE ORDER
  // --------------------------------------------------

  const handlePlaceOrder = async () => {
    if (isPlacingOrder) {
      return;
    }

    try {
      setIsPlacingOrder(true);

      // ------------------------------------------------
      // 1. CHECK FIREBASE SESSION
      // ------------------------------------------------

      const firebaseUser = auth.currentUser;

      console.log("====================================");
      console.log("CHECKOUT AUTH DEBUG");
      console.log("Firebase user exists:", !!firebaseUser);
      console.log("Firebase UID:", firebaseUser?.uid);
      console.log("Firebase email:", firebaseUser?.email);
      console.log("====================================");

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

      // ------------------------------------------------
      // 2. GET FRESH FIREBASE ID TOKEN
      // ------------------------------------------------
      //
      // true forces Firebase to refresh the token if
      // necessary.
      //

      const firebaseToken = await firebaseUser.getIdToken(true);

      console.log("Firebase token exists:", !!firebaseToken);

      console.log("Firebase token length:", firebaseToken?.length);

      if (!firebaseToken) {
        throw new Error("Unable to get Firebase authentication token");
      }

      // ------------------------------------------------
      // 3. VALIDATE EMAIL
      // ------------------------------------------------

      const email = firebaseUser.email?.trim().toLowerCase();

      if (!email) {
        Alert.alert(
          "Email Required",
          "Your Firebase account does not have an email address.",
        );

        return;
      }

      // ------------------------------------------------
      // 4. VALIDATE FULL NAME
      // ------------------------------------------------

      const trimmedName = fullName.trim();

      if (!trimmedName) {
        Alert.alert("Missing Information", "Please enter your full name.");

        return;
      }

      const nameParts = trimmedName.split(/\s+/);

      if (nameParts.length < 2) {
        Alert.alert(
          "Enter Full Name",
          "Please enter both your first name and last name.",
        );

        return;
      }

      const firstName = nameParts[0];

      const lastName = nameParts.slice(1).join(" ");

      // ------------------------------------------------
      // 5. VALIDATE PHONE
      // ------------------------------------------------

      const trimmedPhone = phone.trim();

      if (!/^[6-9]\d{9}$/.test(trimmedPhone)) {
        Alert.alert(
          "Invalid Phone Number",
          "Please enter a valid 10-digit Indian mobile number.",
        );

        return;
      }

      // ------------------------------------------------
      // 6. VALIDATE ADDRESS
      // ------------------------------------------------

      const trimmedAddress = address.trim();

      if (!trimmedAddress) {
        Alert.alert("Missing Address", "Please enter your delivery address.");

        return;
      }

      // ------------------------------------------------
      // 7. VALIDATE CITY
      // ------------------------------------------------

      const trimmedCity = city.trim();

      if (!trimmedCity) {
        Alert.alert("Missing City", "Please enter your city.");

        return;
      }

      // ------------------------------------------------
      // 8. VALIDATE STATE
      // ------------------------------------------------

      const trimmedState = state.trim();

      if (!trimmedState) {
        Alert.alert("Missing State", "Please enter your state.");

        return;
      }

      // ------------------------------------------------
      // 9. VALIDATE PINCODE
      // ------------------------------------------------

      const trimmedPincode = pincode.trim();

      if (!/^\d{6}$/.test(trimmedPincode)) {
        Alert.alert(
          "Invalid PIN Code",
          "Please enter a valid 6-digit PIN code.",
        );

        return;
      }

      // ------------------------------------------------
      // 10. PREPARE ORDER ITEMS
      // ------------------------------------------------
      //
      // Only productId + quantity are sent.
      //
      // Backend gets price/name/image from MongoDB.
      //

      const orderItems = items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      // ------------------------------------------------
      // 11. PREPARE REQUEST
      // ------------------------------------------------

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

      // ------------------------------------------------
      // 12. SEND ORDER
      // ------------------------------------------------
      //
      // api.ts automatically attaches:
      //
      // Authorization: Bearer <Firebase ID Token>
      //
      //

      const response = await api.post("/orders", orderData, {
        headers: {
          Authorization: `Bearer ${firebaseToken}`,
        },
      });

      console.log("ORDER RESPONSE:", response.data);

      // ------------------------------------------------
      // 13. CHECK RESPONSE
      // ------------------------------------------------

      if (!response.data?.order) {
        throw new Error("Invalid order response from backend");
      }

      // ------------------------------------------------
      // 14. CLEAR CART
      // ------------------------------------------------

      clearCart();

      // ------------------------------------------------
      // 15. SUCCESS
      // ------------------------------------------------

      Alert.alert(
        "Order Placed Successfully",
        "Your order has been placed successfully.",
        [
          {
            text: "View Orders",
            onPress: () => {
              router.replace("/(tabs)/profile");
            },
          },
        ],
        {
          cancelable: false,
        },
      );
    } catch (error: any) {
      console.error("====================================");

      console.error("PLACE ORDER ERROR");

      console.error("Status:", error?.response?.status);

      console.error("Backend response:", error?.response?.data);

      console.error("Error message:", error?.message);

      console.error("====================================");

      const status = error?.response?.status;

      let message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to place your order. Please try again.";

      // ----------------------------------------------
      // 401
      // ----------------------------------------------

      if (status === 401) {
        message = "Your login session has expired. Please login again.";

        Alert.alert("Authentication Required", message, [
          {
            text: "Login",
            onPress: () => {
              router.replace("/login");
            },
          },
        ]);

        return;
      }

      // ----------------------------------------------
      // 404
      // ----------------------------------------------

      if (status === 404) {
        message =
          error?.response?.data?.message || "Your account could not be found.";
      }

      // ----------------------------------------------
      // 409
      // ----------------------------------------------

      if (status === 409) {
        message =
          error?.response?.data?.message ||
          "Stock changed while placing your order. Please try again.";
      }

      // ----------------------------------------------
      // 500
      // ----------------------------------------------

      if (status === 500) {
        message =
          error?.response?.data?.message ||
          "Server error while placing your order.";
      }

      Alert.alert("Unable to Place Order", message);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // --------------------------------------------------
  // MAIN CHECKOUT
  // --------------------------------------------------

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-white">
      {/* HEADER */}

      <View
        className="flex-row items-center border-b border-neutral-200"
        style={{
          paddingHorizontal: horizontalPadding,
          paddingVertical: 14,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="w-10 h-10 rounded-full bg-neutral-100 items-center justify-center"
        >
          <Ionicons name="arrow-back" size={21} color="#111111" />
        </Pressable>

        <Text className="text-black text-xl font-bold ml-4">Checkout</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingBottom: 180,
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: contentWidth,
            paddingTop: isSmallPhone ? 20 : isPhone ? 24 : 32,
          }}
        >
          {/* ========================================== */}
          {/* DELIVERY ADDRESS */}
          {/* ========================================== */}

          <View className="mb-7">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center flex-1">
                <View className="w-9 h-9 rounded-full bg-black items-center justify-center">
                  <Ionicons name="location-outline" size={18} color="white" />
                </View>

                <Text className="text-black text-lg font-bold ml-3">
                  Delivery Address
                </Text>
              </View>

              <Text className="text-neutral-400 text-xs">REQUIRED</Text>
            </View>

            <View className="border border-neutral-200 rounded-3xl p-5">
              {/* FULL NAME */}

              <Text className="text-neutral-500 text-xs font-semibold mb-2">
                FULL NAME
              </Text>

              <TextInput
                placeholder="Enter your full name"
                placeholderTextColor="#A3A3A3"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                className="border border-neutral-200 rounded-2xl px-4 text-black"
                style={{
                  minHeight: 52,
                }}
              />

              {/* PHONE */}

              <Text className="text-neutral-500 text-xs font-semibold mt-5 mb-2">
                PHONE NUMBER
              </Text>

              <TextInput
                placeholder="Enter your phone number"
                placeholderTextColor="#A3A3A3"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
                className="border border-neutral-200 rounded-2xl px-4 text-black"
                style={{
                  minHeight: 52,
                }}
              />

              {/* ADDRESS */}

              <Text className="text-neutral-500 text-xs font-semibold mt-5 mb-2">
                ADDRESS
              </Text>

              <TextInput
                placeholder="House / Flat / Street"
                placeholderTextColor="#A3A3A3"
                value={address}
                onChangeText={setAddress}
                multiline
                textAlignVertical="top"
                className="border border-neutral-200 rounded-2xl px-4 py-4 text-black"
                style={{
                  minHeight: 90,
                }}
              />

              {/* CITY + STATE */}

              <View className={isPhone ? "mt-5" : "flex-row mt-5"}>
                {/* CITY */}

                <View className={isPhone ? "w-full" : "flex-1 mr-2"}>
                  <Text className="text-neutral-500 text-xs font-semibold mb-2">
                    CITY
                  </Text>

                  <TextInput
                    placeholder="City"
                    placeholderTextColor="#A3A3A3"
                    value={city}
                    onChangeText={setCity}
                    autoCapitalize="words"
                    className="border border-neutral-200 rounded-2xl px-4 text-black"
                    style={{
                      minHeight: 52,
                    }}
                  />
                </View>

                {/* STATE */}

                <View className={isPhone ? "w-full mt-5" : "flex-1 ml-2"}>
                  <Text className="text-neutral-500 text-xs font-semibold mb-2">
                    STATE
                  </Text>

                  <TextInput
                    placeholder="State"
                    placeholderTextColor="#A3A3A3"
                    value={state}
                    onChangeText={setState}
                    autoCapitalize="words"
                    className="border border-neutral-200 rounded-2xl px-4 text-black"
                    style={{
                      minHeight: 52,
                    }}
                  />
                </View>
              </View>

              {/* PIN */}

              <Text className="text-neutral-500 text-xs font-semibold mt-5 mb-2">
                PIN CODE
              </Text>

              <TextInput
                placeholder="PIN code"
                placeholderTextColor="#A3A3A3"
                value={pincode}
                onChangeText={setPincode}
                keyboardType="number-pad"
                maxLength={6}
                className="border border-neutral-200 rounded-2xl px-4 text-black"
                style={{
                  minHeight: 52,
                }}
              />
            </View>
          </View>

          {/* ========================================== */}
          {/* ORDER ITEMS */}
          {/* ========================================== */}

          <View className="mb-7">
            <View className="flex-row items-center mb-4">
              <View className="w-9 h-9 rounded-full bg-black items-center justify-center">
                <Ionicons name="bag-outline" size={18} color="white" />
              </View>

              <Text className="text-black text-lg font-bold ml-3">
                Your Items
              </Text>
            </View>

            <View className="border border-neutral-200 rounded-3xl overflow-hidden">
              {items.map((item, index) => (
                <View
                  key={item._id}
                  className={`p-4 ${
                    index !== items.length - 1
                      ? "border-b border-neutral-200"
                      : ""
                  }`}
                >
                  <View className="flex-row items-center">
                    <View className="w-20 h-24 rounded-2xl overflow-hidden bg-neutral-100">
                      <Image
                        source={{
                          uri: item.image,
                        }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    </View>

                    <View className="flex-1 ml-4">
                      <Text
                        className="text-neutral-500 text-xs uppercase"
                        numberOfLines={1}
                      >
                        {item.brand}
                      </Text>

                      <Text
                        className="text-black font-semibold text-base mt-1"
                        numberOfLines={2}
                      >
                        {item.name}
                      </Text>

                      <View className="flex-row items-center justify-between mt-3">
                        <Text className="text-neutral-500 text-sm">
                          Qty: {item.quantity}
                        </Text>

                        <Text className="text-black font-bold">
                          ₹
                          {(item.price * item.quantity).toLocaleString("en-IN")}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* ========================================== */}
          {/* PAYMENT METHOD */}
          {/* ========================================== */}

          <View className="mb-7">
            <View className="flex-row items-center mb-4">
              <View className="w-9 h-9 rounded-full bg-black items-center justify-center">
                <Ionicons name="card-outline" size={18} color="white" />
              </View>

              <Text className="text-black text-lg font-bold ml-3">
                Payment Method
              </Text>
            </View>

            <View className="border border-neutral-900 rounded-3xl p-5">
              <View className="flex-row items-center">
                <View className="w-11 h-11 rounded-full bg-black items-center justify-center">
                  <Ionicons name="cash-outline" size={22} color="white" />
                </View>

                <View className="flex-1 ml-4">
                  <Text className="text-black font-bold">Cash on Delivery</Text>

                  <Text className="text-neutral-500 text-sm mt-1">
                    Pay when your order arrives
                  </Text>
                </View>

                <View className="w-6 h-6 rounded-full bg-black items-center justify-center">
                  <Ionicons name="checkmark" size={15} color="white" />
                </View>
              </View>
            </View>

            <Text className="text-neutral-400 text-xs mt-3 px-1 leading-5">
              Online payment will be available once the payment gateway is
              integrated.
            </Text>
          </View>

          {/* ========================================== */}
          {/* PRICE SUMMARY */}
          {/* ========================================== */}

          <View className="bg-neutral-50 border border-neutral-200 rounded-3xl p-5">
            <Text className="text-black text-xl font-bold mb-5">
              Price Summary
            </Text>

            <View className="flex-row justify-between mb-3">
              <Text className="text-neutral-500">Items ({totalItems})</Text>

              <Text className="text-neutral-800 font-medium">
                ₹{subtotal.toLocaleString("en-IN")}
              </Text>
            </View>

            <View className="flex-row justify-between mb-3">
              <Text className="text-neutral-500">Delivery</Text>

              <Text className="text-green-600 font-semibold">FREE</Text>
            </View>

            <View className="h-px bg-neutral-200 my-3" />

            <View className="flex-row justify-between">
              <Text className="text-black text-lg font-bold">Total</Text>

              <Text className="text-black text-xl font-bold">
                ₹{totalPrice.toLocaleString("en-IN")}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ========================================== */}
      {/* STICKY PLACE ORDER */}
      {/* ========================================== */}

      <View className="absolute left-0 right-0 bottom-0 bg-white border-t border-neutral-200">
        <View
          style={{
            paddingHorizontal: horizontalPadding,
            paddingTop: 12,
            paddingBottom: 12,
          }}
        >
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
            disabled={isPlacingOrder}
            onPress={handlePlaceOrder}
            className={`rounded-full items-center justify-center ${
              isPlacingOrder ? "bg-neutral-400" : "bg-black"
            }`}
            style={{
              minHeight: 54,
            }}
          >
            <View className="flex-row items-center">
              {isPlacingOrder ? (
                <>
                  <ActivityIndicator size="small" color="white" />

                  <Text className="text-white font-bold text-base ml-2">
                    Placing Order...
                  </Text>
                </>
              ) : (
                <>
                  <Text className="text-white font-bold text-base">
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
                </>
              )}
            </View>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
