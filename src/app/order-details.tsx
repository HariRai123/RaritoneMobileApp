import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    View,
    useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import api from "../services/api";

type OrderProduct = {
  _id?: string;
  name?: string;
  image?: string;
  price?: number;
};

type OrderItem = {
  product?: OrderProduct;
  name: string;
  image: string;
  price: number;
  quantity: number;
};

type ShippingAddress = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
};

type Order = {
  _id: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
};

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    text: string;
    bg: string;
  }
> = {
  pending: {
    label: "Order Pending",
    icon: "time-outline",
    text: "#B45309",
    bg: "bg-amber-50",
  },

  confirmed: {
    label: "Order Confirmed",
    icon: "checkmark-circle-outline",
    text: "#2563EB",
    bg: "bg-blue-50",
  },

  shipped: {
    label: "Shipped",
    icon: "car-outline",
    text: "#7C3AED",
    bg: "bg-purple-50",
  },

  delivered: {
    label: "Delivered",
    icon: "checkmark-done-circle-outline",
    text: "#15803D",
    bg: "bg-green-50",
  },

  cancelled: {
    label: "Cancelled",
    icon: "close-circle-outline",
    text: "#DC2626",
    bg: "bg-red-50",
  },
};

const STATUS_STEPS = [
  {
    key: "pending",
    title: "Order placed",
    description: "Your order has been received.",
  },
  {
    key: "confirmed",
    title: "Order confirmed",
    description: "Your order has been confirmed.",
  },
  {
    key: "shipped",
    title: "Shipped",
    description: "Your order is on the way.",
  },
  {
    key: "delivered",
    title: "Delivered",
    description: "Your order has been delivered.",
  },
];

export default function OrderDetailsScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    id?: string;
  }>();

  const { width } = useWindowDimensions();

  const orderId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const isTablet = width >= 768;
  const isLargeScreen = width >= 1024;

  const horizontalPadding = isLargeScreen ? 56 : isTablet ? 40 : 20;

  const contentMaxWidth = isLargeScreen ? 1180 : 900;

  /*
   * =========================
   * HELPERS
   * =========================
   */

  const formatCurrency = (amount: number) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
  };

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return date;
    }
  };

  const formatTime = (date: string) => {
    try {
      return new Date(date).toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const getStatusConfig = (status: string) => {
    return (
      STATUS_CONFIG[status?.toLowerCase()] || {
        label: "Order Pending",
        icon: "time-outline" as keyof typeof Ionicons.glyphMap,
        text: "#B45309",
        bg: "bg-amber-50",
      }
    );
  };

  /*
   * =========================
   * FETCH ORDER
   * =========================
   */

  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      setError("Order ID is missing.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setError("");

      const response = await api.get(`/orders/${orderId}`);

      const fetchedOrder = response.data?.order;

      if (!fetchedOrder) {
        throw new Error("Order information was not returned by the server.");
      }

      setOrder(fetchedOrder);
    } catch (err: any) {
      console.log(
        "GET ORDER DETAILS ERROR:",
        err?.response?.data || err?.message || err,
      );

      setError(
        err?.response?.data?.message ||
          "Unable to load this order. Please try again.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrder();
  };

  /*
   * =========================
   * LOADING
   * =========================
   */

  if (loading) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#111111" />

          <Text className="text-neutral-500 text-sm mt-4">
            Loading order details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /*
   * =========================
   * ERROR
   * =========================
   */

  if (error || !order) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-white">
        <View
          style={{
            paddingHorizontal: horizontalPadding,
          }}
          className="flex-1"
        >
          <View className="flex-row items-center py-4">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-neutral-100 items-center justify-center"
            >
              <Ionicons name="arrow-back" size={21} color="#171717" />
            </Pressable>
          </View>

          <View className="flex-1 items-center justify-center pb-24">
            <View className="w-16 h-16 rounded-full bg-red-50 items-center justify-center">
              <Ionicons name="alert-circle-outline" size={30} color="#DC2626" />
            </View>

            <Text className="text-black text-xl font-bold text-center mt-5">
              Couldn't load order
            </Text>

            <Text className="text-neutral-500 text-sm text-center mt-2 max-w-md">
              {error || "The requested order could not be found."}
            </Text>

            <View className="flex-row mt-6">
              <Pressable
                onPress={fetchOrder}
                className="bg-black rounded-full px-7 items-center justify-center"
                style={{
                  minHeight: 50,
                }}
              >
                <Text className="text-white font-semibold">Try Again</Text>
              </Pressable>

              <Pressable
                onPress={() => router.back()}
                className="border border-neutral-200 rounded-full px-7 ml-3 items-center justify-center"
                style={{
                  minHeight: 50,
                }}
              >
                <Text className="text-black font-semibold">Go Back</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const status = getStatusConfig(order.status);

  const currentStatus = order.status?.toLowerCase();

  const isCancelled = currentStatus === "cancelled";

  const currentStatusIndex = STATUS_STEPS.findIndex(
    (step) => step.key === currentStatus,
  );

  /*
   * =========================
   * MAIN SCREEN
   * =========================
   */

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#111111"
          />
        }
        contentContainerStyle={{
          paddingHorizontal: horizontalPadding,
          paddingBottom: 120,
          paddingTop: 12,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: contentMaxWidth,
            alignSelf: "center",
          }}
        >
          {/* =========================
              TOP BAR
          ========================= */}

          <View className="flex-row items-center justify-between mb-5">
            <Pressable
              onPress={() => router.back()}
              className="w-11 h-11 rounded-full bg-neutral-100 items-center justify-center"
            >
              <Ionicons name="arrow-back" size={21} color="#171717" />
            </Pressable>

            <Text className="text-black font-semibold text-base">
              Order Details
            </Text>

            <View className="w-11" />
          </View>

          {/* =========================
              ORDER SUMMARY
          ========================= */}

          <View className="bg-neutral-50 border border-neutral-200 rounded-3xl p-5">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-neutral-400 text-[10px] font-semibold uppercase tracking-wider">
                  Order ID
                </Text>

                <Text
                  className="text-black font-bold text-lg mt-1"
                  numberOfLines={1}
                >
                  #{order._id.slice(-8).toUpperCase()}
                </Text>
              </View>

              <View
                className={`${status.bg} rounded-full px-3 py-2 flex-row items-center`}
              >
                <Ionicons name={status.icon} size={14} color={status.text} />

                <Text
                  className="text-xs font-semibold ml-1.5"
                  style={{
                    color: status.text,
                  }}
                >
                  {status.label}
                </Text>
              </View>
            </View>

            <View className="h-[1px] bg-neutral-200 my-5" />

            <View className="flex-row">
              <View className="flex-1">
                <Text className="text-neutral-400 text-[10px] font-semibold uppercase tracking-wider">
                  Placed On
                </Text>

                <Text className="text-black font-medium text-sm mt-1">
                  {formatDate(order.createdAt)}
                </Text>

                <Text className="text-neutral-500 text-xs mt-1">
                  {formatTime(order.createdAt)}
                </Text>
              </View>

              <View className="flex-1">
                <Text className="text-neutral-400 text-[10px] font-semibold uppercase tracking-wider">
                  Total
                </Text>

                <Text className="text-black font-bold text-lg mt-1">
                  {formatCurrency(order.total)}
                </Text>
              </View>
            </View>
          </View>

          {/* =========================
              ORDER TRACKING
          ========================= */}

          <View className="mt-6">
            <Text className="text-black font-bold text-lg mb-3">
              Order Status
            </Text>

            <View className="bg-white border border-neutral-200 rounded-3xl p-5">
              {isCancelled ? (
                <View className="flex-row items-start">
                  <View className="w-10 h-10 rounded-full bg-red-50 items-center justify-center">
                    <Ionicons
                      name="close-circle-outline"
                      size={21}
                      color="#DC2626"
                    />
                  </View>

                  <View className="flex-1 ml-3">
                    <Text className="text-black font-semibold text-sm">
                      Order Cancelled
                    </Text>

                    <Text className="text-neutral-500 text-xs mt-1 leading-5">
                      This order has been cancelled.
                    </Text>
                  </View>
                </View>
              ) : (
                STATUS_STEPS.map((step, index) => {
                  const isCompleted = currentStatusIndex >= index;

                  const isCurrent = currentStatus === step.key;

                  const isLast = index === STATUS_STEPS.length - 1;

                  return (
                    <View key={step.key} className="flex-row">
                      <View className="items-center">
                        <View
                          className={`w-10 h-10 rounded-full items-center justify-center ${
                            isCompleted ? "bg-black" : "bg-neutral-100"
                          }`}
                        >
                          <Ionicons
                            name={isCompleted ? "checkmark" : "ellipse-outline"}
                            size={isCompleted ? 18 : 16}
                            color={isCompleted ? "#FFFFFF" : "#A3A3A3"}
                          />
                        </View>

                        {!isLast ? (
                          <View
                            className={
                              isCompleted ? "bg-black" : "bg-neutral-200"
                            }
                            style={{
                              width: 2,
                              height: 36,
                            }}
                          />
                        ) : null}
                      </View>

                      <View
                        className="flex-1 ml-3"
                        style={{
                          paddingBottom: isLast ? 0 : 20,
                        }}
                      >
                        <View className="flex-row items-center">
                          <Text
                            className={`font-semibold text-sm ${
                              isCompleted ? "text-black" : "text-neutral-400"
                            }`}
                          >
                            {step.title}
                          </Text>

                          {isCurrent ? (
                            <View className="ml-2 bg-neutral-100 rounded-full px-2 py-0.5">
                              <Text className="text-[9px] text-neutral-600 font-semibold uppercase">
                                Current
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        <Text
                          className={`text-xs mt-1 leading-5 ${
                            isCompleted
                              ? "text-neutral-500"
                              : "text-neutral-400"
                          }`}
                        >
                          {step.description}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>

          {/* =========================
              PRODUCTS
          ========================= */}

          <View className="mt-6">
            <Text className="text-black font-bold text-lg mb-3">Items</Text>

            <View className="bg-white border border-neutral-200 rounded-3xl overflow-hidden">
              {order.items.map((item, index) => (
                <View key={`${order._id}-${index}`}>
                  <View className="flex-row items-center p-4">
                    {/* Image */}

                    <View className="w-20 h-20 rounded-2xl bg-neutral-100 overflow-hidden items-center justify-center">
                      {item.image ? (
                        <Image
                          source={{
                            uri: item.image,
                          }}
                          className="w-20 h-20"
                          resizeMode="cover"
                        />
                      ) : (
                        <Ionicons
                          name="image-outline"
                          size={26}
                          color="#A3A3A3"
                        />
                      )}
                    </View>

                    {/* Details */}

                    <View className="flex-1 ml-4">
                      <Text
                        className="text-black font-semibold text-sm"
                        numberOfLines={2}
                      >
                        {item.name}
                      </Text>

                      <Text className="text-neutral-500 text-xs mt-2">
                        Quantity: {item.quantity}
                      </Text>

                      <Text className="text-neutral-500 text-xs mt-1">
                        Unit price: {formatCurrency(item.price)}
                      </Text>
                    </View>

                    {/* Price */}

                    <View className="items-end ml-3">
                      <Text className="text-black font-bold text-sm">
                        {formatCurrency(item.price * item.quantity)}
                      </Text>
                    </View>
                  </View>

                  {index < order.items.length - 1 ? (
                    <View className="h-[1px] bg-neutral-100 ml-[116px]" />
                  ) : null}
                </View>
              ))}
            </View>
          </View>

          {/* =========================
              PRICE SUMMARY
          ========================= */}

          <View className="mt-6">
            <Text className="text-black font-bold text-lg mb-3">
              Price Summary
            </Text>

            <View className="bg-neutral-50 border border-neutral-200 rounded-3xl p-5">
              <View className="flex-row justify-between">
                <Text className="text-neutral-500 text-sm">Items</Text>

                <Text className="text-black text-sm font-medium">
                  {order.items.reduce(
                    (total, item) => total + item.quantity,
                    0,
                  )}{" "}
                  items
                </Text>
              </View>

              <View className="flex-row justify-between mt-3">
                <Text className="text-neutral-500 text-sm">Subtotal</Text>

                <Text className="text-black text-sm font-medium">
                  {formatCurrency(order.total)}
                </Text>
              </View>

              <View className="flex-row justify-between mt-3">
                <Text className="text-neutral-500 text-sm">Delivery</Text>

                <Text className="text-green-600 text-sm font-semibold">
                  Free
                </Text>
              </View>

              <View className="h-[1px] bg-neutral-200 my-4" />

              <View className="flex-row justify-between items-center">
                <Text className="text-black font-bold text-base">Total</Text>

                <Text className="text-black font-bold text-xl">
                  {formatCurrency(order.total)}
                </Text>
              </View>
            </View>
          </View>

          {/* =========================
              PAYMENT
          ========================= */}

          <View className="mt-6">
            <Text className="text-black font-bold text-lg mb-3">Payment</Text>

            <View className="bg-white border border-neutral-200 rounded-3xl p-5">
              <View className="flex-row items-center">
                <View className="w-11 h-11 rounded-2xl bg-neutral-100 items-center justify-center">
                  <Ionicons
                    name={
                      order.paymentMethod === "cod"
                        ? "cash-outline"
                        : "card-outline"
                    }
                    size={21}
                    color="#171717"
                  />
                </View>

                <View className="flex-1 ml-3">
                  <Text className="text-black font-semibold text-sm">
                    {order.paymentMethod === "cod"
                      ? "Cash on Delivery"
                      : "Online Payment"}
                  </Text>

                  <Text className="text-neutral-500 text-xs mt-1">
                    Payment status:{" "}
                    <Text className="text-black font-medium">
                      {order.paymentStatus}
                    </Text>
                  </Text>
                </View>

                <View
                  className={`rounded-full px-3 py-1.5 ${
                    order.paymentStatus === "paid"
                      ? "bg-green-50"
                      : order.paymentStatus === "failed"
                        ? "bg-red-50"
                        : "bg-amber-50"
                  }`}
                >
                  <Text
                    className="text-[10px] font-bold uppercase"
                    style={{
                      color:
                        order.paymentStatus === "paid"
                          ? "#15803D"
                          : order.paymentStatus === "failed"
                            ? "#DC2626"
                            : "#B45309",
                    }}
                  >
                    {order.paymentStatus}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* =========================
              SHIPPING ADDRESS
          ========================= */}

          <View className="mt-6">
            <Text className="text-black font-bold text-lg mb-3">
              Delivery Address
            </Text>

            <View className="bg-white border border-neutral-200 rounded-3xl p-5">
              <View className="flex-row items-start">
                <View className="w-10 h-10 rounded-full bg-neutral-100 items-center justify-center">
                  <Ionicons name="location-outline" size={19} color="#171717" />
                </View>

                <View className="flex-1 ml-3">
                  <Text className="text-black font-semibold text-sm">
                    {order.shippingAddress.firstName}{" "}
                    {order.shippingAddress.lastName}
                  </Text>

                  <Text className="text-neutral-600 text-sm mt-2 leading-5">
                    {order.shippingAddress.address}
                  </Text>

                  <Text className="text-neutral-600 text-sm leading-5">
                    {order.shippingAddress.city}, {order.shippingAddress.state}
                  </Text>

                  <Text className="text-neutral-600 text-sm leading-5">
                    PIN: {order.shippingAddress.pincode}
                  </Text>

                  <View className="h-[1px] bg-neutral-100 my-4" />

                  <View className="flex-row items-center">
                    <Ionicons name="call-outline" size={15} color="#737373" />

                    <Text className="text-neutral-600 text-xs ml-2">
                      {order.shippingAddress.phone}
                    </Text>
                  </View>

                  <View className="flex-row items-center mt-2">
                    <Ionicons name="mail-outline" size={15} color="#737373" />

                    <Text
                      className="text-neutral-600 text-xs ml-2 flex-1"
                      numberOfLines={2}
                    >
                      {order.shippingAddress.email}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* =========================
              FOOTER ACTION
          ========================= */}

          <Pressable
            onPress={() => router.back()}
            className="bg-black rounded-full items-center justify-center flex-row mt-7"
            style={{
              minHeight: 54,
            }}
          >
            <Ionicons name="arrow-back" size={17} color="#FFFFFF" />

            <Text className="text-white font-semibold text-sm ml-2">
              Back to My Orders
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
