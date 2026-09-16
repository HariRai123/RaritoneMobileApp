import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import api from "../services/api";

/* =========================================================
   TYPES
========================================================= */

type OrderItem = {
  product:
    | string
    | {
        _id?: string;
        name?: string;
        brand?: string;
        image?: string;
        price?: number;
        category?: string;
      };

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
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  paymentMethod: "online" | "cod";
  createdAt: string;
  updatedAt?: string;
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
   STATUS
========================================================= */

const statusLabel = (status: Order["status"]) => {
  switch (status) {
    case "pending":
      return "Order Pending";

    case "confirmed":
      return "Confirmed";

    case "shipped":
      return "Shipped";

    case "delivered":
      return "Delivered";

    case "cancelled":
      return "Cancelled";

    default:
      return "Order";
  }
};

const statusIcon = (
  status: Order["status"],
): keyof typeof Ionicons.glyphMap => {
  switch (status) {
    case "pending":
      return "time-outline";

    case "confirmed":
      return "checkmark-circle-outline";

    case "shipped":
      return "car-outline";

    case "delivered":
      return "checkmark-done-circle-outline";

    case "cancelled":
      return "close-circle-outline";

    default:
      return "receipt-outline";
  }
};

const statusColor = (status: Order["status"]) => {
  switch (status) {
    case "pending":
      return COLORS.orange;

    case "confirmed":
      return "#2563EB";

    case "shipped":
      return "#7C3AED";

    case "delivered":
      return COLORS.green;

    case "cancelled":
      return COLORS.red;

    default:
      return COLORS.secondary;
  }
};

/* =========================================================
   FORMAT
========================================================= */

const formatPrice = (price: number) => {
  return `₹${Number(price).toLocaleString("en-IN")}`;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getProductId = (
  product:
    | string
    | {
        _id?: string;
      },
) => {
  if (typeof product === "string") {
    return product;
  }

  return product?._id ?? "";
};

/* =========================================================
   SCREEN
========================================================= */

export default function OrdersScreen() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState(false);

  /* =======================================================
     FETCH
  ======================================================= */

  const fetchOrders = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setError(false);

      const response = await api.get("/orders");

      const data = Array.isArray(response.data?.orders)
        ? response.data.orders
        : [];

      setOrders(data);
    } catch (err) {
      console.error("GET ORDERS ERROR:", err);

      setOrders([]);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  /* =======================================================
     REFRESH
  ======================================================= */

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders(false);
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center bg-white"
        edges={["top"]}
      >
        <ActivityIndicator size="large" color={COLORS.black} />

        <Text className="mt-3 text-xs text-neutral-500">
          Loading your orders...
        </Text>
      </SafeAreaView>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <View className="flex-1 items-center justify-center px-6">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
            <Ionicons name="cloud-offline-outline" size={29} color="#737373" />
          </View>

          <Text className="mt-5 text-xl font-bold text-black">
            Couldn't load orders
          </Text>

          <Text className="mt-2 text-center text-sm leading-6 text-neutral-500">
            Please check your connection and try again.
          </Text>

          <Pressable
            onPress={() => void fetchOrders()}
            className="mt-7 rounded-full bg-black px-7 py-3.5"
          >
            <Text className="font-bold text-white">Try Again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  /* =======================================================
     EMPTY
  ======================================================= */

  if (orders.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          contentContainerStyle={{
            flexGrow: 1,
          }}
        >
          <View className="flex-1 items-center justify-center px-6">
            <View className="h-20 w-20 items-center justify-center rounded-full bg-neutral-100">
              <Ionicons name="receipt-outline" size={37} color="#737373" />
            </View>

            <Text className="mt-6 text-2xl font-bold text-black">
              No orders yet
            </Text>

            <Text className="mt-3 max-w-sm text-center text-sm leading-6 text-neutral-500">
              Once you place your first order, it will appear here.
            </Text>

            <Pressable
              onPress={() => router.push("/(tabs)/shop")}
              className="mt-8 rounded-full bg-black px-8 py-4"
            >
              <Text className="font-bold text-white">Start Shopping</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  /* =======================================================
     MAIN
  ======================================================= */

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* HEADER */}

      <View className="flex-row items-center border-b border-neutral-200 px-5 py-3">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100"
          hitSlop={6}
        >
          <Ionicons name="arrow-back" size={20} color="#111111" />
        </Pressable>

        <View className="ml-4 flex-1">
          <Text className="text-xl font-bold text-black">My Orders</Text>

          <Text className="mt-0.5 text-xs text-neutral-400">
            Track your Raritone purchases
          </Text>
        </View>

        <View className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
          <Ionicons name="receipt-outline" size={19} color="#111111" />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 60,
        }}
      >
        {/* SUMMARY */}

        <View className="mb-5 flex-row items-center justify-between">
          <View>
            <Text className="text-sm font-medium text-neutral-500">
              Total Orders
            </Text>

            <Text className="mt-1 text-2xl font-bold text-black">
              {orders.length}
            </Text>
          </View>

          <View className="rounded-full bg-neutral-100 px-4 py-2">
            <Text className="text-xs font-semibold text-neutral-600">
              Most recent first
            </Text>
          </View>
        </View>

        {/* ORDERS */}

        {orders.map((order) => {
          const firstItem = order.items[0];

          const extraItems = Math.max(0, order.items.length - 1);

          const color = statusColor(order.status);

          return (
            <Pressable
              key={order._id}
              onPress={() =>
                router.push({
                  pathname: "/orders/[id]",
                  params: {
                    id: order._id,
                  },
                })
              }
              className="mb-4 overflow-hidden rounded-3xl border border-neutral-200 bg-white"
            >
              {/* TOP */}

              <View className="flex-row items-center justify-between border-b border-neutral-100 px-4 py-3.5">
                <View>
                  <Text className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                    ORDER PLACED
                  </Text>

                  <Text className="mt-1 text-sm font-semibold text-black">
                    {formatDate(order.createdAt)}
                  </Text>
                </View>

                <View
                  className="flex-row items-center rounded-full px-3 py-2"
                  style={{
                    backgroundColor: `${color}12`,
                  }}
                >
                  <Ionicons
                    name={statusIcon(order.status)}
                    size={14}
                    color={color}
                  />

                  <Text
                    className="ml-1.5 text-xs font-semibold"
                    style={{
                      color,
                    }}
                  >
                    {statusLabel(order.status)}
                  </Text>
                </View>
              </View>

              {/* PRODUCT */}

              {firstItem && (
                <View className="p-4">
                  <View className="flex-row">
                    <View className="h-24 w-20 overflow-hidden rounded-2xl bg-neutral-100">
                      <Image
                        source={{
                          uri: firstItem.image,
                        }}
                        className="h-full w-full"
                        resizeMode="cover"
                      />
                    </View>

                    <View className="ml-4 flex-1">
                      <Text
                        className="text-xs uppercase text-neutral-400"
                        numberOfLines={1}
                      >
                        {firstItem.product &&
                        typeof firstItem.product === "object" &&
                        firstItem.product.brand
                          ? firstItem.product.brand
                          : "RARITONE"}
                      </Text>

                      <Text
                        className="mt-1 text-base font-semibold text-black"
                        numberOfLines={2}
                      >
                        {firstItem.name}
                      </Text>

                      <View className="mt-3 flex-row items-center">
                        <Text className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-600">
                          Qty: {firstItem.quantity}
                        </Text>

                        {extraItems > 0 && (
                          <Text className="ml-2 text-xs text-neutral-400">
                            + {extraItems} more
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* BOTTOM */}

              <View className="flex-row items-center justify-between border-t border-neutral-100 bg-neutral-50 px-4 py-3.5">
                <View>
                  <Text className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
                    TOTAL
                  </Text>

                  <Text className="mt-1 text-lg font-bold text-black">
                    {formatPrice(order.total)}
                  </Text>
                </View>

                <View className="flex-row items-center">
                  <Text className="mr-1 text-xs font-semibold text-black">
                    View Details
                  </Text>

                  <Ionicons name="chevron-forward" size={16} color="#111111" />
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
