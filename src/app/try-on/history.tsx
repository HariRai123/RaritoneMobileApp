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
    useWindowDimensions,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getTryOnHistory, type TryOnSession } from "../../services/tryonApi";

export default function TryOnHistoryScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [results, setResults] = useState<TryOnSession[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [loadingMore, setLoadingMore] = useState(false);

  const [error, setError] = useState("");

  const [page, setPage] = useState(1);

  const [hasNextPage, setHasNextPage] = useState(false);

  const isSmallPhone = width < 360;
  const isTablet = width >= 768;

  const horizontalPadding = isTablet ? 32 : isSmallPhone ? 14 : 20;

  /* ==========================================
     FETCH HISTORY
  ========================================== */

  const fetchHistory = useCallback(
    async (requestedPage = 1, append = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await getTryOnHistory(requestedPage, 10);

        const newResults = response?.results || [];

        setResults((current) =>
          append ? [...current, ...newResults] : newResults,
        );

        setPage(response?.pagination?.page || requestedPage);

        setHasNextPage(Boolean(response?.pagination?.hasNextPage));
      } catch (err: any) {
        console.error(
          "TRY-ON HISTORY ERROR:",
          err?.response?.data || err?.message || err,
        );

        setError(
          err?.response?.data?.error?.message ||
            err?.response?.data?.message ||
            err?.message ||
            "Unable to load your try-on history.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  /* ==========================================
     REFRESH
  ========================================== */

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHistory(1);
  };

  /* ==========================================
     LOAD MORE
  ========================================== */

  const handleLoadMore = () => {
    if (loadingMore || !hasNextPage) {
      return;
    }

    fetchHistory(page + 1, true);
  };

  /* ==========================================
     OPEN RESULT
  ========================================== */

  const openSession = (item: TryOnSession) => {
    const sessionId = item.id || item._id;

    if (!sessionId) {
      return;
    }

    router.push(`/try-on/result/${sessionId}`);
  };

  /* ==========================================
     DATE
  ========================================== */

  const formatDate = (date?: string) => {
    if (!date) {
      return "Unknown date";
    }

    try {
      return new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Unknown date";
    }
  };

  /* ==========================================
     STATUS
  ========================================== */

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "completed":
        return "checkmark-circle";

      case "failed":
        return "close-circle";

      case "processing":
        return "sync";

      case "pending":
        return "time";

      default:
        return "help-circle";
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "completed":
        return "#4ADE80";

      case "failed":
        return "#F87171";

      case "processing":
      case "pending":
        return "#FACC15";

      default:
        return "#737373";
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case "completed":
        return "Completed";

      case "failed":
        return "Failed";

      case "processing":
        return "Processing";

      case "pending":
        return "Pending";

      default:
        return "Unknown";
    }
  };

  /* ==========================================
     PRODUCT
  ========================================== */

  const getProduct = (item: TryOnSession) => {
    if (item.product && typeof item.product === "object") {
      return item.product;
    }

    if (item.productId && typeof item.productId === "object") {
      return item.productId;
    }

    return null;
  };

  /* ==========================================
     LOADING
  ========================================== */

  if (loading && results.length === 0) {
    return (
      <SafeAreaView
        className="flex-1 bg-black"
        edges={["top", "left", "right"]}
      >
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 rounded-3xl bg-white items-center justify-center">
            <ActivityIndicator size="large" color="black" />
          </View>

          <Text className="text-white text-xl font-bold mt-6">
            Loading Try-On History
          </Text>

          <Text className="text-neutral-500 text-center mt-2">
            Retrieving your previous virtual try-ons...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /* ==========================================
     SCREEN
  ========================================== */

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top", "left", "right"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="white"
          />
        }
        onMomentumScrollEnd={(event) => {
          const { contentOffset, contentSize, layoutMeasurement } =
            event.nativeEvent;

          const distanceFromBottom =
            contentSize.height - (contentOffset.y + layoutMeasurement.height);

          if (distanceFromBottom < 300) {
            handleLoadMore();
          }
        }}
        contentContainerStyle={{
          paddingHorizontal: horizontalPadding,
          paddingTop: isTablet ? 28 : 18,
          paddingBottom: 100,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 900,
            alignSelf: "center",
          }}
        >
          {/* =====================================
              HEADER
          ===================================== */}

          <View className="flex-row items-center mb-7">
            <Pressable
              onPress={() => router.back()}
              className="w-11 h-11 rounded-full bg-neutral-900 border border-neutral-800 items-center justify-center"
            >
              <Ionicons name="arrow-back" size={21} color="white" />
            </Pressable>

            <View className="ml-4 flex-1">
              <Text className="text-white text-2xl font-bold">
                Try-On History
              </Text>

              <Text className="text-neutral-500 text-sm mt-1">
                Your previous virtual try-ons
              </Text>
            </View>

            <View className="w-11 h-11 rounded-full bg-white items-center justify-center ml-3">
              <Ionicons name="sparkles" size={21} color="black" />
            </View>
          </View>

          {/* =====================================
              ERROR
          ===================================== */}

          {error ? (
            <View className="rounded-2xl bg-red-950 border border-red-900 p-4 mb-5">
              <View className="flex-row items-start">
                <Ionicons
                  name="alert-circle-outline"
                  size={22}
                  color="#F87171"
                />

                <View className="flex-1 ml-3">
                  <Text className="text-red-300 font-bold">
                    Unable to load history
                  </Text>

                  <Text className="text-red-200 text-sm mt-1 leading-5">
                    {error}
                  </Text>

                  <Pressable
                    onPress={() => fetchHistory(1)}
                    className="self-start mt-3 bg-white rounded-full px-5 py-2.5"
                  >
                    <Text className="text-black text-xs font-bold">
                      Try Again
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : null}

          {/* =====================================
              EMPTY STATE
          ===================================== */}

          {!loading && results.length === 0 ? (
            <View className="rounded-3xl bg-neutral-950 border border-neutral-800 p-8 items-center mt-4">
              <View className="w-24 h-24 rounded-full bg-neutral-900 items-center justify-center">
                <Ionicons name="sparkles-outline" size={42} color="#525252" />
              </View>

              <Text className="text-white text-2xl font-bold mt-6 text-center">
                No Try-Ons Yet
              </Text>

              <Text className="text-neutral-500 text-center mt-3 leading-6">
                Try on a product to see how it looks on you. Your results will
                appear here.
              </Text>

              <Pressable
                onPress={() => router.push("/(tabs)")}
                className="bg-white rounded-full px-8 py-4 mt-7"
              >
                <Text className="text-black font-bold">Explore Products</Text>
              </Pressable>
            </View>
          ) : null}

          {/* =====================================
              HISTORY LIST
          ===================================== */}

          <View>
            {results.map((item, index) => {
              const itemId = item.id || item._id || String(index);

              const product = getProduct(item);

              const statusColor = getStatusColor(item.status);

              const isCompleted = item.status === "completed";

              const image =
                isCompleted && item.resultImageReference
                  ? item.resultImageReference
                  : product?.image;

              return (
                <Pressable
                  key={itemId}
                  onPress={() => openSession(item)}
                  className="rounded-3xl bg-neutral-950 border border-neutral-800 overflow-hidden mb-4"
                >
                  {/* IMAGE */}

                  <View
                    className={
                      isTablet
                        ? "h-[360px]"
                        : isSmallPhone
                          ? "h-[300px]"
                          : "h-[340px]"
                    }
                  >
                    {image ? (
                      <Image
                        source={{
                          uri: image,
                        }}
                        className="w-full h-full bg-neutral-900"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="flex-1 bg-neutral-900 items-center justify-center">
                        <Ionicons
                          name="image-outline"
                          size={45}
                          color="#525252"
                        />

                        <Text className="text-neutral-600 text-sm mt-3">
                          No image available
                        </Text>
                      </View>
                    )}

                    {/* STATUS */}

                    <View className="absolute top-4 left-4">
                      <View className="rounded-full bg-black/90 border border-neutral-700 px-3 py-2">
                        <View className="flex-row items-center">
                          <Ionicons
                            name={getStatusIcon(item.status) as any}
                            size={15}
                            color={statusColor}
                          />

                          <Text
                            className="text-xs font-bold ml-1.5"
                            style={{
                              color: statusColor,
                            }}
                          >
                            {getStatusText(item.status)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* ARROW */}

                    <View className="absolute right-4 bottom-4 w-11 h-11 rounded-full bg-white items-center justify-center">
                      <Ionicons name="arrow-forward" size={20} color="black" />
                    </View>
                  </View>

                  {/* DETAILS */}

                  <View className="p-5">
                    <View className="flex-row items-start">
                      <View className="flex-1">
                        <Text
                          className="text-white text-lg font-bold"
                          numberOfLines={2}
                        >
                          {product?.name || "Virtual Try-On"}
                        </Text>

                        {product?.brand ? (
                          <Text className="text-neutral-500 text-sm mt-1">
                            {product.brand}
                          </Text>
                        ) : null}
                      </View>

                      {product?.price !== undefined ? (
                        <Text className="text-white font-bold ml-3">
                          ₹{Number(product.price).toLocaleString("en-IN")}
                        </Text>
                      ) : null}
                    </View>

                    {/* META */}

                    <View className="flex-row items-center mt-5 pt-4 border-t border-neutral-800">
                      <View className="flex-row items-center flex-1">
                        <Ionicons
                          name="calendar-outline"
                          size={16}
                          color="#737373"
                        />

                        <Text className="text-neutral-500 text-xs ml-2">
                          {formatDate(item.createdAt)}
                        </Text>
                      </View>

                      {item.processingTime !== null &&
                      item.processingTime !== undefined ? (
                        <View className="flex-row items-center">
                          <Ionicons
                            name="time-outline"
                            size={16}
                            color="#737373"
                          />

                          <Text className="text-neutral-500 text-xs ml-2">
                            {item.processingTime.toFixed(1)}s
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {/* FAILED MESSAGE */}

                    {item.status === "failed" && item.errorMessage ? (
                      <View className="mt-4 rounded-xl bg-red-950/60 p-3">
                        <Text
                          className="text-red-300 text-xs leading-5"
                          numberOfLines={2}
                        >
                          {item.errorMessage}
                        </Text>
                      </View>
                    ) : null}

                    {/* COMPLETED LABEL */}

                    {isCompleted ? (
                      <View className="flex-row items-center mt-4">
                        <Ionicons name="sparkles" size={15} color="#A3A3A3" />

                        <Text className="text-neutral-400 text-xs ml-2">
                          Tap to view your AI generated result
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* =====================================
              LOAD MORE
          ===================================== */}

          {loadingMore ? (
            <View className="py-6 items-center">
              <ActivityIndicator size="small" color="white" />

              <Text className="text-neutral-600 text-xs mt-2">
                Loading more...
              </Text>
            </View>
          ) : null}

          {!hasNextPage && results.length > 0 ? (
            <Text className="text-neutral-700 text-xs text-center mt-4">
              You've reached the end of your try-on history.
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
