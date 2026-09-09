import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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

type OrderUser = {
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
};

type Order = {
  _id: string;
  user?: OrderUser;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
};

type Filter =
  | "all"
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

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

const FILTERS: {
  key: Filter;
  label: string;
}[] = [
  {
    key: "all",
    label: "All",
  },
  {
    key: "pending",
    label: "Pending",
  },
  {
    key: "confirmed",
    label: "Confirmed",
  },
  {
    key: "shipped",
    label: "Shipped",
  },
  {
    key: "delivered",
    label: "Delivered",
  },
  {
    key: "cancelled",
    label: "Cancelled",
  },
];

export default function AdminOrdersScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const isTablet = width >= 768;
  const isLargeScreen = width >= 1024;

  const horizontalPadding = isLargeScreen ? 56 : isTablet ? 40 : 20;

  const contentMaxWidth = isLargeScreen ? 1200 : 1000;

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
        month: "short",
        year: "numeric",
      });
    } catch {
      return date;
    }
  };

  const getStatusConfig = (status: string) => {
    return (
      STATUS_CONFIG[status?.toLowerCase()] || {
        label: status || "Pending",
        icon: "time-outline" as keyof typeof Ionicons.glyphMap,
        bg: "bg-neutral-100",
        text: "#525252",
      }
    );
  };

  /*
   * =========================
   * FETCH ALL ORDERS
   * =========================
   */

  const fetchOrders = useCallback(async () => {
    try {
      setError("");

      const response = await api.get("/admin/orders");

      console.log("ADMIN ORDERS RESPONSE:", response.data);

      setOrders(response.data?.orders || []);
    } catch (err: any) {
      console.log(
        "GET ADMIN ORDERS ERROR:",
        err?.response?.data || err?.message || err,
      );

      setError(err?.response?.data?.message || "Unable to load admin orders.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  /*
   * =========================
   * REFRESH
   * =========================
   */

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  /*
   * =========================
   * FILTERED ORDERS
   * =========================
   */

  const filteredOrders = useMemo(() => {
    if (filter === "all") {
      return orders;
    }

    return orders.filter((order) => order.status?.toLowerCase() === filter);
  }, [orders, filter]);

  /*
   * =========================
   * UPDATE ORDER STATUS
   * =========================
   */

  const updateStatus = async (orderId: string, status: string) => {
    try {
      setUpdatingOrderId(orderId);

      const response = await api.patch(`/admin/orders/${orderId}`, {
        status,
      });

      const updatedOrder = response.data?.order;

      if (!updatedOrder) {
        throw new Error("Updated order was not returned by the server.");
      }

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order._id === orderId ? updatedOrder : order,
        ),
      );
    } catch (err: any) {
      console.log(
        "UPDATE ORDER STATUS ERROR:",
        err?.response?.data || err?.message || err,
      );

      setError(
        err?.response?.data?.message || "Unable to update order status.",
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  /*
   * =========================
   * STATUS ACTION
   * =========================
   */

  const handleNextStatus = (order: Order) => {
    const current = order.status?.toLowerCase();

    if (current === "pending") {
      updateStatus(order._id, "confirmed");
      return;
    }

    if (current === "confirmed") {
      updateStatus(order._id, "shipped");
      return;
    }

    if (current === "shipped") {
      updateStatus(order._id, "delivered");
      return;
    }
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
            Loading admin orders...
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
        <View
          className="flex-1 items-center justify-center"
          style={{
            paddingHorizontal: horizontalPadding,
          }}
        >
          <View className="w-16 h-16 rounded-full bg-red-50 items-center justify-center">
            <Ionicons name="alert-circle-outline" size={30} color="#DC2626" />
          </View>

          <Text className="text-black text-xl font-bold text-center mt-5">
            Couldn't load orders
          </Text>

          <Text className="text-neutral-500 text-sm text-center mt-2 max-w-md">
            {error}
          </Text>

          <Pressable
            onPress={fetchOrders}
            className="bg-black rounded-full px-8 mt-6 items-center justify-center"
            style={{
              minHeight: 50,
            }}
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </Pressable>
        </View>
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
                Admin Orders
              </Text>

              <Text
                className="text-neutral-500 mt-2"
                style={{
                  fontSize: isTablet ? 16 : 14,
                }}
              >
                Manage customer orders and delivery status
              </Text>
            </View>

            <Pressable
              onPress={handleRefresh}
              disabled={refreshing}
              className="w-11 h-11 rounded-full bg-neutral-100 items-center justify-center ml-3"
            >
              <Ionicons name="refresh-outline" size={20} color="#171717" />
            </Pressable>
          </View>

          {/* =========================
              SUMMARY CARDS
          ========================= */}

          <View
            className="flex-row mt-6"
            style={{
              gap: 10,
            }}
          >
            <View className="flex-1 bg-neutral-50 border border-neutral-200 rounded-2xl p-4">
              <Text className="text-neutral-500 text-xs">Total</Text>

              <Text className="text-black font-bold text-xl mt-1">
                {orders.length}
              </Text>
            </View>

            <View className="flex-1 bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <Text className="text-amber-700 text-xs">Pending</Text>

              <Text className="text-amber-900 font-bold text-xl mt-1">
                {orders.filter((order) => order.status === "pending").length}
              </Text>
            </View>

            <View className="flex-1 bg-green-50 border border-green-100 rounded-2xl p-4">
              <Text className="text-green-700 text-xs">Delivered</Text>

              <Text className="text-green-900 font-bold text-xl mt-1">
                {orders.filter((order) => order.status === "delivered").length}
              </Text>
            </View>
          </View>

          {/* =========================
              FILTERS
          ========================= */}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-6"
            contentContainerStyle={{
              paddingRight: 10,
            }}
          >
            {FILTERS.map((item) => {
              const active = filter === item.key;

              return (
                <Pressable
                  key={item.key}
                  onPress={() => setFilter(item.key)}
                  className={`rounded-full px-4 mr-2 ${
                    active ? "bg-black" : "bg-neutral-100"
                  }`}
                  style={{
                    minHeight: 40,
                    justifyContent: "center",
                  }}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      active ? "text-white" : "text-neutral-600"
                    }`}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* =========================
              ERROR BANNER
          ========================= */}

          {error ? (
            <View className="bg-red-50 border border-red-100 rounded-2xl p-4 mt-5 flex-row items-center">
              <Ionicons name="alert-circle-outline" size={20} color="#DC2626" />

              <Text className="text-red-700 text-xs ml-3 flex-1">{error}</Text>

              <Pressable onPress={() => setError("")}>
                <Ionicons name="close" size={18} color="#DC2626" />
              </Pressable>
            </View>
          ) : null}

          {/* =========================
              RESULT COUNT
          ========================= */}

          <View className="flex-row items-center justify-between mt-6 mb-4">
            <Text className="text-black font-bold text-lg">Orders</Text>

            <Text className="text-neutral-500 text-xs">
              {filteredOrders.length}{" "}
              {filteredOrders.length === 1 ? "order" : "orders"}
            </Text>
          </View>

          {/* =========================
              EMPTY FILTER
          ========================= */}

          {filteredOrders.length === 0 ? (
            <View className="border border-neutral-200 rounded-3xl p-8 items-center">
              <View className="w-16 h-16 rounded-full bg-neutral-100 items-center justify-center">
                <Ionicons name="file-tray-outline" size={28} color="#737373" />
              </View>

              <Text className="text-black font-bold text-lg mt-4 text-center">
                No orders found
              </Text>

              <Text className="text-neutral-500 text-sm text-center mt-2">
                There are no orders in this category.
              </Text>
            </View>
          ) : (
            /*
             * =========================
             * ORDER LIST
             * =========================
             */

            <View
              style={{
                flexDirection: isTablet ? "row" : "column",
                flexWrap: isTablet ? "wrap" : "nowrap",
                gap: 16,
              }}
            >
              {filteredOrders.map((order) => {
                const status = getStatusConfig(order.status);

                const updating = updatingOrderId === order._id;

                const itemCount =
                  order.items?.reduce((sum, item) => sum + item.quantity, 0) ||
                  0;

                const currentStatus = order.status?.toLowerCase();

                const canAdvance =
                  currentStatus === "pending" ||
                  currentStatus === "confirmed" ||
                  currentStatus === "shipped";

                const nextStatus =
                  currentStatus === "pending"
                    ? "Confirm"
                    : currentStatus === "confirmed"
                      ? "Ship"
                      : currentStatus === "shipped"
                        ? "Deliver"
                        : "";

                return (
                  <View
                    key={order._id}
                    style={{
                      width: isTablet ? "48.5%" : "100%",
                    }}
                    className="bg-white border border-neutral-200 rounded-3xl overflow-hidden"
                  >
                    {/* =========================
                          ORDER HEADER
                      ========================= */}

                    <View className="p-5">
                      <View className="flex-row items-start">
                        <View className="flex-1 pr-2">
                          <Text className="text-neutral-400 text-[10px] font-semibold uppercase tracking-wider">
                            Order
                          </Text>

                          <Text className="text-black font-bold text-base mt-1">
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

                      {/* Customer */}

                      <View className="flex-row items-center mt-5">
                        <View className="w-10 h-10 rounded-full bg-neutral-100 items-center justify-center">
                          <Text className="text-black font-bold">
                            {order.user?.name?.charAt(0)?.toUpperCase() || "U"}
                          </Text>
                        </View>

                        <View className="flex-1 ml-3">
                          <Text
                            className="text-black font-semibold text-sm"
                            numberOfLines={1}
                          >
                            {order.user?.name || "Customer"}
                          </Text>

                          <Text
                            className="text-neutral-500 text-xs mt-1"
                            numberOfLines={1}
                          >
                            {order.user?.email || order.shippingAddress?.email}
                          </Text>
                        </View>
                      </View>

                      <View className="h-[1px] bg-neutral-100 my-5" />

                      {/* Order information */}

                      <View className="flex-row">
                        <View className="flex-1">
                          <Text className="text-neutral-400 text-[10px] font-semibold uppercase tracking-wider">
                            Date
                          </Text>

                          <Text className="text-black text-xs font-medium mt-1">
                            {formatDate(order.createdAt)}
                          </Text>
                        </View>

                        <View className="flex-1">
                          <Text className="text-neutral-400 text-[10px] font-semibold uppercase tracking-wider">
                            Items
                          </Text>

                          <Text className="text-black text-xs font-medium mt-1">
                            {itemCount}
                          </Text>
                        </View>

                        <View className="items-end">
                          <Text className="text-neutral-400 text-[10px] font-semibold uppercase tracking-wider">
                            Total
                          </Text>

                          <Text className="text-black text-base font-bold mt-1">
                            {formatCurrency(order.total)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* =========================
                          PRODUCTS PREVIEW
                      ========================= */}

                    <View className="border-t border-neutral-100 px-5 py-4">
                      <Text className="text-neutral-400 text-[10px] font-semibold uppercase tracking-wider mb-3">
                        Products
                      </Text>

                      {order.items?.slice(0, 2).map((item, index) => (
                        <View
                          key={`${order._id}-${index}`}
                          className="flex-row items-center"
                          style={{
                            marginTop: index === 0 ? 0 : 10,
                          }}
                        >
                          <View className="w-11 h-11 rounded-xl bg-neutral-100 overflow-hidden items-center justify-center">
                            {item.image ? (
                              <Image
                                source={{
                                  uri: item.image,
                                }}
                                className="w-11 h-11"
                                resizeMode="cover"
                              />
                            ) : (
                              <Ionicons
                                name="image-outline"
                                size={18}
                                color="#A3A3A3"
                              />
                            )}
                          </View>

                          <View className="flex-1 ml-3">
                            <Text
                              className="text-black text-xs font-medium"
                              numberOfLines={1}
                            >
                              {item.name}
                            </Text>

                            <Text className="text-neutral-500 text-[11px] mt-1">
                              Qty: {item.quantity}
                            </Text>
                          </View>

                          <Text className="text-black text-xs font-semibold">
                            {formatCurrency(item.price * item.quantity)}
                          </Text>
                        </View>
                      ))}

                      {order.items?.length > 2 ? (
                        <Text className="text-neutral-500 text-[11px] mt-3">
                          +{order.items.length - 2} more items
                        </Text>
                      ) : null}
                    </View>

                    {/* =========================
                          PAYMENT
                      ========================= */}

                    <View className="border-t border-neutral-100 px-5 py-4">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <Ionicons
                            name={
                              order.paymentMethod === "cod"
                                ? "cash-outline"
                                : "card-outline"
                            }
                            size={17}
                            color="#525252"
                          />

                          <Text className="text-neutral-600 text-xs font-medium ml-2">
                            {order.paymentMethod === "cod"
                              ? "Cash on Delivery"
                              : "Online Payment"}
                          </Text>
                        </View>

                        <View
                          className={`rounded-full px-2.5 py-1 ${
                            order.paymentStatus === "paid"
                              ? "bg-green-50"
                              : order.paymentStatus === "failed"
                                ? "bg-red-50"
                                : "bg-amber-50"
                          }`}
                        >
                          <Text
                            className="text-[9px] font-bold uppercase"
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

                    {/* =========================
                          ACTIONS
                      ========================= */}

                    <View className="border-t border-neutral-100 p-5">
                      <View className="flex-row">
                        <Pressable
                          onPress={() =>
                            router.push({
                              pathname: "/order-details",
                              params: {
                                id: order._id,
                              },
                            })
                          }
                          className="flex-1 border border-neutral-200 rounded-full items-center justify-center flex-row"
                          style={{
                            minHeight: 46,
                          }}
                        >
                          <Ionicons
                            name="eye-outline"
                            size={17}
                            color="#171717"
                          />

                          <Text className="text-black font-semibold text-xs ml-2">
                            View
                          </Text>
                        </Pressable>

                        {canAdvance ? (
                          <Pressable
                            disabled={updating}
                            onPress={() => handleNextStatus(order)}
                            className={`flex-1 rounded-full items-center justify-center flex-row ml-2 ${
                              updating ? "bg-neutral-400" : "bg-black"
                            }`}
                            style={{
                              minHeight: 46,
                            }}
                          >
                            {updating ? (
                              <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                              <>
                                <Ionicons
                                  name="arrow-forward-outline"
                                  size={17}
                                  color="#FFFFFF"
                                />

                                <Text className="text-white font-semibold text-xs ml-2">
                                  {nextStatus}
                                </Text>
                              </>
                            )}
                          </Pressable>
                        ) : null}
                      </View>

                      {/* Cancel */}

                      {currentStatus !== "cancelled" &&
                      currentStatus !== "delivered" ? (
                        <Pressable
                          disabled={updating}
                          onPress={() => updateStatus(order._id, "cancelled")}
                          className="items-center justify-center mt-3"
                          style={{
                            minHeight: 38,
                          }}
                        >
                          <Text className="text-red-600 text-xs font-semibold">
                            Cancel Order
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
