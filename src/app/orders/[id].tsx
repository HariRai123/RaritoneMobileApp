import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useCallback, useEffect, useMemo, useState } from "react";

import api from "../../services/api";

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

type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

type Order = {
  _id: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
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
  blue: "#2563EB",
  purple: "#7C3AED",
};

/* =========================================================
   HELPERS
========================================================= */

const formatPrice = (price: number) => {
  return `₹${Number(price).toLocaleString("en-IN")}`;
};

const formatDateTime = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const getStatusLabel = (status: OrderStatus) => {
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

const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case "pending":
      return COLORS.orange;
    case "confirmed":
      return COLORS.blue;
    case "shipped":
      return COLORS.purple;
    case "delivered":
      return COLORS.green;
    case "cancelled":
      return COLORS.red;
    default:
      return COLORS.secondary;
  }
};

const getStatusIcon = (status: OrderStatus): keyof typeof Ionicons.glyphMap => {
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

/* =========================================================
   SCREEN
========================================================= */

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{
    id?: string;
  }>();

  const router = useRouter();

  const { width } = useWindowDimensions();

  const insets = useSafeAreaInsets();

  /* =======================================================
     STATE
  ======================================================= */

  const [order, setOrder] = useState<Order | null>(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [cancelling, setCancelling] = useState(false);

  const [error, setError] = useState(false);

  /* =======================================================
     RESPONSIVE
  ======================================================= */

  const isSmallPhone = width < 360;

  const isTablet = width >= 768;

  const horizontalPadding = isSmallPhone ? 16 : isTablet ? 32 : 20;

  /* =======================================================
     FETCH ORDER
  ======================================================= */

  const fetchOrder = useCallback(
    async (showLoader = true) => {
      if (!id) {
        setOrder(null);
        setLoading(false);
        return;
      }

      try {
        if (showLoader) {
          setLoading(true);
        }

        setError(false);

        const response = await api.get(`/orders/${id}`);

        const fetchedOrder = response.data?.order;

        if (!fetchedOrder) {
          setOrder(null);
          return;
        }

        setOrder(fetchedOrder);
      } catch (err) {
        console.error("GET ORDER ERROR:", err);

        setOrder(null);
        setError(true);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id],
  );

  /* =======================================================
     INITIAL FETCH
  ======================================================= */

  useEffect(() => {
    void fetchOrder();
  }, [fetchOrder]);

  /* =======================================================
     AUTO REFRESH
  ======================================================= */

  useEffect(() => {
    const interval = setInterval(() => {
      void fetchOrder(false);
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchOrder]);

  /* =======================================================
     MANUAL REFRESH
  ======================================================= */

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrder(false);
  };

  /* =======================================================
     STATUS COLOR
  ======================================================= */

  const statusColor = useMemo(() => {
    if (!order) {
      return COLORS.black;
    }

    return getStatusColor(order.status);
  }, [order]);

  /* =======================================================
     CAN CANCEL
  ======================================================= */

  const canCancel =
    order?.status === "pending" || order?.status === "confirmed";

  /* =======================================================
     CANCEL ORDER
  ======================================================= */

  const handleCancelOrder = () => {
    if (!order) {
      return;
    }

    if (!canCancel) {
      Alert.alert(
        "Cancellation unavailable",
        order.status === "shipped"
          ? "This order has already been shipped and cannot be cancelled."
          : order.status === "delivered"
            ? "A delivered order cannot be cancelled."
            : order.status === "cancelled"
              ? "This order is already cancelled."
              : "This order cannot be cancelled.",
      );

      return;
    }

    Alert.alert("Cancel Order", "Are you sure you want to cancel this order?", [
      {
        text: "Keep Order",
        style: "cancel",
      },
      {
        text: "Cancel Order",
        style: "destructive",
        onPress: async () => {
          try {
            setCancelling(true);

            await api.patch(`/orders/${order._id}/cancel`);

            await fetchOrder(false);

            Alert.alert(
              "Order Cancelled",
              "Your order has been cancelled successfully.",
            );
          } catch (cancelError: any) {
            console.error("CANCEL ORDER ERROR:", cancelError);

            Alert.alert(
              "Unable to Cancel",
              cancelError?.response?.data?.message ||
                cancelError?.message ||
                "Unable to cancel this order. Please try again.",
            );
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
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

        <Text className="mt-3 text-xs text-neutral-500">Loading order...</Text>
      </SafeAreaView>
    );
  }

  /* =======================================================
     ERROR / NOT FOUND
  ======================================================= */

  if (error || !order) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center bg-white px-6"
        edges={["top"]}
      >
        <View className="h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
          <Ionicons
            name={error ? "cloud-offline-outline" : "receipt-outline"}
            size={30}
            color="#737373"
          />
        </View>

        <Text className="mt-5 text-xl font-bold text-black">
          {error ? "Couldn't load order" : "Order not found"}
        </Text>

        <Text className="mt-2 text-center text-sm leading-6 text-neutral-500">
          {error
            ? "Please check your connection and try again."
            : "This order may no longer be available."}
        </Text>

        <View className="mt-7 flex-row">
          {error && (
            <Pressable
              onPress={() => void fetchOrder()}
              className="rounded-full bg-black px-6 py-3.5"
            >
              <Text className="font-bold text-white">Try Again</Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => router.back()}
            className={`rounded-full border border-neutral-300 px-6 py-3.5 ${
              error ? "ml-3" : ""
            }`}
          >
            <Text className="font-bold text-black">Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  /* =======================================================
     MAIN
  ======================================================= */

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* =================================================
          HEADER
      ================================================= */}

      <View
        className="flex-row items-center border-b border-neutral-200"
        style={{
          paddingHorizontal: horizontalPadding,
          paddingTop: 10,
          paddingBottom: 11,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100"
          hitSlop={6}
        >
          <Ionicons name="arrow-back" size={20} color="#111111" />
        </Pressable>

        <View className="ml-4 flex-1">
          <Text numberOfLines={1} className="text-xl font-bold text-black">
            Order Details
          </Text>

          <Text numberOfLines={1} className="mt-0.5 text-xs text-neutral-400">
            Order ID: {order._id}
          </Text>
        </View>

        <Pressable
          onPress={() => void fetchOrder()}
          className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100"
          hitSlop={5}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={COLORS.black} />
          ) : (
            <Ionicons name="refresh-outline" size={19} color="#111111" />
          )}
        </Pressable>
      </View>

      {/* =================================================
          CONTENT
      ================================================= */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        onScrollEndDrag={() => {
          if (!refreshing) {
            return;
          }

          void handleRefresh();
        }}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingHorizontal: horizontalPadding,
          paddingTop: 20,
          paddingBottom: Math.max(insets.bottom, 20) + 30,
        }}
      >
        {/* =================================================
            STATUS CARD
        ================================================= */}

        <View
          className="rounded-3xl p-5"
          style={{
            backgroundColor: `${statusColor}10`,
            borderWidth: 1,
            borderColor: `${statusColor}30`,
          }}
        >
          <View className="flex-row items-center">
            <View
              className="h-12 w-12 items-center justify-center rounded-full"
              style={{
                backgroundColor: `${statusColor}18`,
              }}
            >
              <Ionicons
                name={getStatusIcon(order.status)}
                size={25}
                color={statusColor}
              />
            </View>

            <View className="ml-3 flex-1">
              <Text
                className="text-lg font-bold"
                style={{
                  color: statusColor,
                }}
              >
                {getStatusLabel(order.status)}
              </Text>

              <Text className="mt-1 text-xs text-neutral-500">
                Placed on {formatDateTime(order.createdAt)}
              </Text>
            </View>
          </View>

          {/* CANCELLED MESSAGE */}

          {order.status === "cancelled" && (
            <View className="mt-4 flex-row items-center rounded-2xl bg-red-50 px-3 py-3">
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={COLORS.red}
              />

              <Text className="ml-2 flex-1 text-xs leading-5 text-red-700">
                This order has been cancelled.
              </Text>
            </View>
          )}

          {/* PROGRESS */}

          {order.status !== "cancelled" && (
            <View className="mt-5">
              <OrderProgress status={order.status} />
            </View>
          )}
        </View>

        {/* =================================================
            ORDER ITEMS
        ================================================= */}

        <View className="mt-6">
          <SectionHeader icon="bag-outline" title="Order Items" />

          <View className="overflow-hidden rounded-3xl border border-neutral-200">
            {order.items.map((item, index) => {
              const itemTotal = item.price * item.quantity;

              return (
                <Pressable
                  key={`${order._id}-${index}`}
                  onPress={() => {
                    const productId =
                      typeof item.product === "string"
                        ? item.product
                        : item.product?._id;

                    if (productId) {
                      router.push(`/product/${productId}`);
                    }
                  }}
                  className={`p-4 ${
                    index < order.items.length - 1
                      ? "border-b border-neutral-200"
                      : ""
                  }`}
                >
                  <View className="flex-row">
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
                        numberOfLines={1}
                        className="text-xs uppercase text-neutral-400"
                      >
                        {item.product &&
                        typeof item.product === "object" &&
                        item.product.brand
                          ? item.product.brand
                          : "RARITONE"}
                      </Text>

                      <Text
                        numberOfLines={2}
                        className="mt-1 text-base font-semibold text-black"
                      >
                        {item.name}
                      </Text>

                      <Text className="mt-1 text-xs text-neutral-400">
                        {formatPrice(item.price)} each
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

                    <View className="ml-2 justify-center">
                      <Ionicons
                        name="chevron-forward"
                        size={17}
                        color="#A3A3A3"
                      />
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* =================================================
            DELIVERY ADDRESS
        ================================================= */}

        <View className="mt-6">
          <SectionHeader icon="location-outline" title="Delivery Address" />

          <View className="rounded-3xl border border-neutral-200 p-5">
            <Text className="text-base font-bold text-black">
              {order.shippingAddress.firstName} {order.shippingAddress.lastName}
            </Text>

            <Text className="mt-2 text-sm leading-6 text-neutral-500">
              {order.shippingAddress.address}
            </Text>

            <Text className="text-sm leading-6 text-neutral-500">
              {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
              {order.shippingAddress.pincode}
            </Text>

            <View className="mt-4 border-t border-neutral-100 pt-4">
              <View className="flex-row items-center">
                <Ionicons name="call-outline" size={16} color="#737373" />

                <Text className="ml-2 text-sm text-neutral-600">
                  {order.shippingAddress.phone}
                </Text>
              </View>

              <View className="mt-2 flex-row items-center">
                <Ionicons name="mail-outline" size={16} color="#737373" />

                <Text
                  numberOfLines={1}
                  className="ml-2 flex-1 text-sm text-neutral-600"
                >
                  {order.shippingAddress.email}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* =================================================
            PAYMENT
        ================================================= */}

        <View className="mt-6">
          <SectionHeader icon="card-outline" title="Payment" />

          <View className="rounded-3xl border border-neutral-200 p-5">
            <View className="flex-row items-center">
              <View className="h-11 w-11 items-center justify-center rounded-full bg-neutral-100">
                <Ionicons
                  name={
                    order.paymentMethod === "cod"
                      ? "cash-outline"
                      : "card-outline"
                  }
                  size={21}
                  color="#111111"
                />
              </View>

              <View className="ml-4 flex-1">
                <Text className="font-bold text-black">
                  {order.paymentMethod === "cod"
                    ? "Cash on Delivery"
                    : "Online Payment"}
                </Text>

                <Text className="mt-1 text-xs text-neutral-500">
                  Payment status: {order.paymentStatus}
                </Text>
              </View>

              <View className="rounded-full bg-neutral-100 px-3 py-2">
                <Text className="text-xs font-semibold capitalize text-neutral-700">
                  {order.paymentStatus}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* =================================================
            PRICE SUMMARY
        ================================================= */}

        <View className="mt-6">
          <SectionHeader icon="receipt-outline" title="Price Summary" />

          <View className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5">
            <View className="flex-row justify-between">
              <Text className="text-neutral-500">Products</Text>

              <Text className="font-medium text-neutral-800">
                {formatPrice(
                  order.items.reduce(
                    (sum, item) => sum + item.price * item.quantity,
                    0,
                  ),
                )}
              </Text>
            </View>

            <View className="mt-3 flex-row justify-between">
              <Text className="text-neutral-500">Delivery</Text>

              <Text className="font-semibold text-green-600">FREE</Text>
            </View>

            <View className="my-4 h-px bg-neutral-200" />

            <View className="flex-row justify-between">
              <Text className="text-lg font-bold text-black">Total</Text>

              <Text className="text-xl font-bold text-black">
                {formatPrice(order.total)}
              </Text>
            </View>
          </View>
        </View>

        {/* =================================================
            ORDER INFORMATION
        ================================================= */}

        <View className="mt-6">
          <SectionHeader
            icon="information-circle-outline"
            title="Order Information"
          />

          <View className="rounded-3xl border border-neutral-200 p-5">
            <InfoRow label="Order ID" value={order._id} />

            <InfoRow
              label="Placed On"
              value={formatDateTime(order.createdAt)}
            />

            <InfoRow
              label="Order Status"
              value={getStatusLabel(order.status)}
            />

            <InfoRow
              label="Payment Method"
              value={
                order.paymentMethod === "cod"
                  ? "Cash on Delivery"
                  : "Online Payment"
              }
            />

            <InfoRow label="Payment Status" value={order.paymentStatus} last />
          </View>
        </View>

        {/* =================================================
            CANCEL ORDER
        ================================================= */}

        {canCancel && (
          <Pressable
            onPress={handleCancelOrder}
            disabled={cancelling}
            className="mt-6 flex-row items-center justify-center rounded-full border border-red-200 bg-red-50 py-4"
            style={{
              opacity: cancelling ? 0.6 : 1,
            }}
          >
            {cancelling ? (
              <>
                <ActivityIndicator size="small" color={COLORS.red} />

                <Text className="ml-2 text-sm font-bold text-red-600">
                  Cancelling Order...
                </Text>
              </>
            ) : (
              <>
                <Ionicons
                  name="close-circle-outline"
                  size={18}
                  color={COLORS.red}
                />

                <Text className="ml-2 text-sm font-bold text-red-600">
                  Cancel Order
                </Text>
              </>
            )}
          </Pressable>
        )}

        {/* =================================================
            CONTINUE SHOPPING
        ================================================= */}

        <Pressable
          onPress={() => router.push("/(tabs)/shop")}
          className="mt-4 flex-row items-center justify-center rounded-full border border-neutral-300 py-4"
        >
          <Ionicons name="bag-outline" size={18} color="#111111" />

          <Text className="ml-2 text-sm font-bold text-black">
            Continue Shopping
          </Text>
        </Pressable>

        <View
          style={{
            height: Math.max(insets.bottom, 10) + 10,
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHeader({
  icon,
  title,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
}) {
  return (
    <View className="mb-4 flex-row items-center">
      <View className="h-9 w-9 items-center justify-center rounded-full bg-black">
        <Ionicons name={icon} size={18} color="white" />
      </View>

      <Text className="ml-3 text-lg font-bold text-black">{title}</Text>
    </View>
  );
}

/* =========================================================
   INFO ROW
========================================================= */

function InfoRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center justify-between py-3 ${
        !last ? "border-b border-neutral-100" : ""
      }`}
    >
      <Text className="text-xs text-neutral-400">{label}</Text>

      <Text
        numberOfLines={1}
        className="ml-5 max-w-[65%] text-right text-xs font-medium capitalize text-neutral-700"
      >
        {value}
      </Text>
    </View>
  );
}

/* =========================================================
   ORDER PROGRESS
========================================================= */

function OrderProgress({ status }: { status: OrderStatus }) {
  const steps: {
    key: "pending" | "confirmed" | "shipped" | "delivered";
    label: string;
  }[] = [
    {
      key: "pending",
      label: "Placed",
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
  ];

  const currentIndex = steps.findIndex((step) => step.key === status);

  const safeIndex = currentIndex < 0 ? 0 : currentIndex;

  const progressColor =
    status === "delivered" ? COLORS.green : getStatusColor(status);

  return (
    <View className="flex-row items-start">
      {steps.map((step, index) => {
        const completed = index <= safeIndex;

        const active = index === safeIndex;

        return (
          <View key={step.key} className="flex-1 flex-row items-start">
            <View className="items-center">
              <View
                className="h-8 w-8 items-center justify-center rounded-full"
                style={{
                  backgroundColor: completed ? progressColor : "#D4D4D4",
                }}
              >
                <Ionicons
                  name={completed ? "checkmark" : "ellipse-outline"}
                  size={completed ? 15 : 10}
                  color={completed ? COLORS.white : "#A3A3A3"}
                />
              </View>

              <Text
                numberOfLines={1}
                className={`mt-2 text-center text-[9px] font-medium ${
                  active ? "text-black" : "text-neutral-400"
                }`}
              >
                {step.label}
              </Text>
            </View>

            {index < steps.length - 1 && (
              <View
                className="mx-1 mt-4 h-0.5 flex-1"
                style={{
                  backgroundColor:
                    index < safeIndex ? progressColor : "#E5E5E5",
                }}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}
