import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
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
    bg: string;
    text: string;
  }
> = {
  pending: {
    label: "Pending",
    icon: "time-outline",
    bg: "bg-amber-50",
    text: "#B45309",
  },

  confirmed: {
    label: "Confirmed",
    icon: "checkmark-circle-outline",
    bg: "bg-blue-50",
    text: "#2563EB",
  },

  shipped: {
    label: "Shipped",
    icon: "car-outline",
    bg: "bg-purple-50",
    text: "#7C3AED",
  },

  delivered: {
    label: "Delivered",
    icon: "checkmark-done-circle-outline",
    bg: "bg-green-50",
    text: "#15803D",
  },

  cancelled: {
    label: "Cancelled",
    icon: "close-circle-outline",
    bg: "bg-red-50",
    text: "#DC2626",
  },
};

export default function OrdersScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const isTablet = width >= 768;
  const isLargeScreen = width >= 1024;

  const horizontalPadding = isLargeScreen ? 56 : isTablet ? 40 : 20;

  const contentMaxWidth = isLargeScreen ? 1180 : 900;

  const fetchOrders = useCallback(async () => {
    try {
      setError("");

      const response = await api.get("/orders");

      console.log("GET ORDERS RESPONSE:", response.data);

      setOrders(response.data?.orders || []);
    } catch (err: any) {
      console.log(
        "GET ORDERS ERROR:",
        err?.response?.data || err?.message || err,
      );

      setError(
        err?.response?.data?.message ||
          "Unable to load your orders. Please try again.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return date;
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
  };

  const getStatusConfig = (status: string) => {
    return (
      STATUS_CONFIG[status?.toLowerCase()] || {
        label: status?.charAt(0).toUpperCase() + status?.slice(1) || "Pending",
        icon: "time-outline" as keyof typeof Ionicons.glyphMap,
        bg: "bg-neutral-100",
        text: "#525252",
      }
    );
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

          <Text className="text-neutral-500 mt-4 text-sm">
            Loading your orders...
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

  if (error && orders.length === 0) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-white">
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: horizontalPadding,
            paddingBottom: 100,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View className="w-16 h-16 rounded-full bg-red-50 items-center justify-center">
            <Ionicons name="alert-circle-outline" size={30} color="#DC2626" />
          </View>

          <Text className="text-black text-xl font-bold mt-5 text-center">
            Couldn't load orders
          </Text>

          <Text className="text-neutral-500 text-sm text-center mt-2 max-w-md">
            {error}
          </Text>

          <TouchableOpacity
            onPress={fetchOrders}
            className="bg-black rounded-full px-8 mt-6 items-center justify-center"
            style={{
              minHeight: 50,
            }}
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  /*
   * =========================
   * EMPTY
   * =========================
   */

  if (orders.length === 0) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-white">
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: horizontalPadding,
            paddingBottom: 100,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View className="w-20 h-20 rounded-full bg-neutral-100 items-center justify-center">
            <Ionicons name="bag-handle-outline" size={36} color="#525252" />
          </View>

          <Text className="text-black text-2xl font-bold mt-6 text-center">
            No orders yet
          </Text>

          <Text className="text-neutral-500 text-sm text-center mt-2 max-w-md leading-5">
            Your purchases will appear here once you place your first order.
          </Text>

          <TouchableOpacity
            onPress={() => router.replace("/(tabs)/shop")}
            className="bg-black rounded-full px-8 mt-7 items-center justify-center"
            style={{
              minHeight: 52,
            }}
          >
            <Text className="text-white font-semibold">Start Shopping</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

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
          paddingTop: isTablet ? 28 : 20,
          paddingBottom: 120,
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
              HEADER
          ========================= */}

          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text
                className="text-black font-bold"
                style={{
                  fontSize: isTablet ? 36 : 30,
                  lineHeight: isTablet ? 43 : 36,
                }}
              >
                My Orders
              </Text>

              <Text
                className="text-neutral-500 mt-2"
                style={{
                  fontSize: isTablet ? 16 : 14,
                }}
              >
                View and track your Raritone purchases
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleRefresh}
              disabled={refreshing}
              className="w-11 h-11 rounded-full bg-neutral-100 items-center justify-center ml-3"
            >
              <Ionicons name="refresh-outline" size={20} color="#171717" />
            </TouchableOpacity>
          </View>

          {/* =========================
              ORDER COUNT
          ========================= */}

          <View className="flex-row items-center mt-6 mb-4">
            <View className="bg-neutral-100 rounded-full px-3 py-1.5">
              <Text className="text-neutral-700 text-xs font-semibold">
                {orders.length} {orders.length === 1 ? "Order" : "Orders"}
              </Text>
            </View>
          </View>

          {/* =========================
              ORDER LIST
          ========================= */}

          <View
            style={{
              flexDirection: isTablet ? "row" : "column",
              flexWrap: isTablet ? "wrap" : "nowrap",
              gap: 16,
            }}
          >
            {orders.map((order) => {
              const status = getStatusConfig(order.status);

              const visibleItems = order.items?.slice(0, 3) || [];

              const remainingItems = Math.max(
                (order.items?.length || 0) - 3,
                0,
              );

              return (
                <View
                  key={order._id}
                  style={{
                    /*
                     * React Native does not support
                     * CSS calc().
                     */
                    width: isTablet ? "48.5%" : "100%",
                  }}
                  className="bg-white border border-neutral-200 rounded-3xl overflow-hidden"
                >
                  {/* =========================
                      ORDER HEADER
                  ========================= */}

                  <View className="px-5 pt-5 pb-4">
                    <View className="flex-row items-start">
                      <View className="flex-1 pr-2">
                        <Text className="text-neutral-400 text-[10px] font-semibold uppercase tracking-wider">
                          Order
                        </Text>

                        <Text
                          className="text-black font-bold mt-1"
                          style={{
                            fontSize: 15,
                          }}
                          numberOfLines={1}
                        >
                          #{order._id.slice(-8).toUpperCase()}
                        </Text>
                      </View>

                      <View
                        className={`${status.bg} rounded-full px-3 py-2 flex-row items-center`}
                      >
                        <Ionicons
                          name={status.icon}
                          size={14}
                          color={status.text}
                        />

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

                    <Text className="text-neutral-500 text-xs mt-3">
                      Placed on {formatDate(order.createdAt)}
                    </Text>
                  </View>

                  <View className="h-[1px] bg-neutral-100" />

                  {/* =========================
                      PRODUCTS
                  ========================= */}

                  <View className="px-5 py-4">
                    {visibleItems.map((item, index) => (
                      <View
                        key={`${order._id}-${index}`}
                        className="flex-row items-center"
                        style={{
                          marginTop: index === 0 ? 0 : 12,
                        }}
                      >
                        <View className="w-14 h-14 rounded-2xl bg-neutral-100 overflow-hidden items-center justify-center">
                          {item.image ? (
                            <Image
                              source={{
                                uri: item.image,
                              }}
                              className="w-14 h-14"
                              resizeMode="cover"
                            />
                          ) : (
                            <Ionicons
                              name="image-outline"
                              size={20}
                              color="#A3A3A3"
                            />
                          )}
                        </View>

                        <View className="flex-1 ml-3">
                          <Text
                            className="text-black font-medium text-sm"
                            numberOfLines={1}
                          >
                            {item.name}
                          </Text>

                          <Text className="text-neutral-500 text-xs mt-1">
                            Qty: {item.quantity}
                          </Text>
                        </View>

                        <Text className="text-black font-semibold text-sm">
                          {formatCurrency(item.price * item.quantity)}
                        </Text>
                      </View>
                    ))}

                    {remainingItems > 0 ? (
                      <Text className="text-neutral-500 text-xs mt-3 ml-[68px]">
                        +{remainingItems} more{" "}
                        {remainingItems === 1 ? "item" : "items"}
                      </Text>
                    ) : null}
                  </View>

                  <View className="h-[1px] bg-neutral-100" />

                  {/* =========================
                      PAYMENT + TOTAL
                  ========================= */}

                  <View className="px-5 py-4">
                    <View className="flex-row justify-between items-center">
                      <View className="flex-1">
                        <Text className="text-neutral-400 text-[10px] font-semibold uppercase tracking-wider">
                          Payment
                        </Text>

                        <View className="flex-row items-center mt-1">
                          <Text
                            className="text-black text-xs font-medium uppercase"
                            numberOfLines={1}
                          >
                            {order.paymentMethod === "cod"
                              ? "Cash on Delivery"
                              : "Online Payment"}
                          </Text>

                          <View
                            className={`ml-2 px-2 py-0.5 rounded-full ${
                              order.paymentStatus === "paid"
                                ? "bg-green-50"
                                : order.paymentStatus === "failed"
                                  ? "bg-red-50"
                                  : "bg-amber-50"
                            }`}
                          >
                            <Text
                              className="text-[9px] font-semibold uppercase"
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

                      <View className="items-end ml-4">
                        <Text className="text-neutral-400 text-[10px] font-semibold uppercase tracking-wider">
                          Total
                        </Text>

                        <Text className="text-black text-xl font-bold mt-1">
                          {formatCurrency(order.total)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* =========================
                      VIEW ORDER
                  ========================= */}

                  <View className="px-5 pb-5">
                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: "/order-details",
                          params: {
                            id: order._id,
                          },
                        })
                      }
                      className="bg-black rounded-full items-center justify-center flex-row"
                      style={{
                        minHeight: 48,
                      }}
                    >
                      <Text className="text-white font-semibold text-sm">
                        View Order
                      </Text>

                      <Ionicons
                        name="arrow-forward"
                        size={16}
                        color="#FFFFFF"
                        style={{
                          marginLeft: 8,
                        }}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
