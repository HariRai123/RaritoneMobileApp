import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    Image,
    Pressable,
    ScrollView,
    Text,
    View,
    useWindowDimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useWishlistStore } from "../store/wishlistStore";

export default function WishlistScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const items = useWishlistStore((state) => state.items);

  const removeFromWishlist = useWishlistStore(
    (state) => state.removeFromWishlist,
  );

  const clearWishlist = useWishlistStore((state) => state.clearWishlist);

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

  const columnGap = isSmallPhone ? 10 : 14;

  const cardWidth = isTablet
    ? Math.min((contentWidth - columnGap * 2) / 3, 330)
    : (contentWidth - columnGap) / 2;

  const imageHeight = cardWidth * 1.22;

  /* =======================================================
     PRICE
  ======================================================= */

  const getOldPrice = (price: number, discount?: number) => {
    const discountValue = Number(discount ?? 0);

    if (discountValue <= 0 || discountValue >= 100) {
      return price;
    }

    return Math.round(price / (1 - discountValue / 100));
  };

  /* =======================================================
     EMPTY STATE
  ======================================================= */

  if (items.length === 0) {
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
            className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100"
          >
            <Ionicons name="arrow-back" size={21} color="#111111" />
          </Pressable>

          <Text className="ml-4 text-xl font-bold text-black">Wishlist</Text>
        </View>

        {/* EMPTY */}

        <View className="flex-1 items-center justify-center px-6">
          <View className="h-24 w-24 items-center justify-center rounded-full bg-neutral-100">
            <Ionicons name="heart-outline" size={44} color="#737373" />
          </View>

          <Text className="mt-6 text-center text-2xl font-bold text-black">
            Your wishlist is empty
          </Text>

          <Text className="mt-3 max-w-sm text-center leading-6 text-neutral-500">
            Save the products you love and come back to them anytime.
          </Text>

          <Pressable
            onPress={() => router.push("/(tabs)/shop")}
            className="mt-8 rounded-full bg-black px-8 py-4"
          >
            <Text className="font-bold text-white">Start Shopping</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  /* =======================================================
     MAIN
  ======================================================= */

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-white">
      {/* =================================================
          HEADER
      ================================================= */}

      <View
        className="flex-row items-center justify-between border-b border-neutral-200"
        style={{
          paddingHorizontal: horizontalPadding,
          paddingVertical: 14,
        }}
      >
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100"
          >
            <Ionicons name="arrow-back" size={21} color="#111111" />
          </Pressable>

          <View className="ml-4">
            <Text className="text-xl font-bold text-black">Wishlist</Text>

            <Text className="mt-0.5 text-xs text-neutral-500">
              {items.length} {items.length === 1 ? "item" : "items"}
            </Text>
          </View>
        </View>

        {/* CLEAR */}

        {items.length > 0 && (
          <Pressable onPress={clearWishlist} hitSlop={8}>
            <Text className="text-sm font-semibold text-neutral-600">
              Clear All
            </Text>
          </Pressable>
        )}
      </View>

      {/* =================================================
          PRODUCTS
      ================================================= */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          width: contentWidth,
          alignSelf: "center",
          paddingTop: 22,
          paddingBottom: 120,
        }}
      >
        <View
          className="flex-row flex-wrap"
          style={{
            columnGap,
            rowGap: 28,
          }}
        >
          {items.map((item) => {
            const oldPrice = getOldPrice(item.price, item.discount);

            const hasDiscount =
              Number(item.discount ?? 0) > 0 && oldPrice > item.price;

            return (
              <View
                key={item._id}
                style={{
                  width: cardWidth,
                }}
              >
                {/* PRODUCT CARD */}

                <Pressable onPress={() => router.push(`/product/${item._id}`)}>
                  <View
                    className="relative overflow-hidden rounded-[18px]"
                    style={{
                      width: cardWidth,
                      height: imageHeight,
                      backgroundColor: "#F4F4F4",
                    }}
                  >
                    <Image
                      source={{
                        uri: item.image,
                      }}
                      style={{
                        width: "100%",
                        height: "100%",
                      }}
                      resizeMode="cover"
                    />

                    {/* REMOVE */}

                    <Pressable
                      onPress={(event) => {
                        event.stopPropagation();

                        removeFromWishlist(item._id);
                      }}
                      className="absolute right-3 top-3 h-9 w-9 items-center justify-center rounded-full bg-white"
                      hitSlop={5}
                      style={{
                        elevation: 2,
                        shadowColor: "#000",
                        shadowOpacity: 0.08,
                        shadowRadius: 5,
                        shadowOffset: {
                          width: 0,
                          height: 2,
                        },
                      }}
                    >
                      <Ionicons name="heart" size={19} color="#111111" />
                    </Pressable>

                    {/* STOCK */}

                    {Number(item.stock ?? 0) <= 0 && (
                      <View className="absolute bottom-3 left-3 rounded-full bg-black/80 px-3 py-1.5">
                        <Text className="text-[9px] font-bold text-white">
                          OUT OF STOCK
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* BRAND */}

                  {item.brand ? (
                    <Text
                      numberOfLines={1}
                      style={{
                        color: "#999999",
                        fontSize: 10,
                        fontWeight: "500",
                        marginTop: 9,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      {item.brand}
                    </Text>
                  ) : null}

                  {/* NAME */}

                  <Text
                    numberOfLines={2}
                    style={{
                      color: "#111111",
                      fontSize: isSmallPhone ? 13 : 14,
                      fontWeight: "500",
                      marginTop: item.brand ? 3 : 9,
                      lineHeight: isSmallPhone ? 18 : 20,
                    }}
                  >
                    {item.name}
                  </Text>

                  {/* PRICE */}

                  <View className="mt-1.5 flex-row items-center">
                    <Text
                      style={{
                        color: "#111111",
                        fontSize: isSmallPhone ? 14 : 15,
                        fontWeight: "700",
                      }}
                    >
                      ₹{Number(item.price).toLocaleString("en-IN")}
                    </Text>

                    {hasDiscount && (
                      <Text
                        numberOfLines={1}
                        style={{
                          color: "#999999",
                          fontSize: 10,
                          marginLeft: 6,
                          textDecorationLine: "line-through",
                        }}
                      >
                        ₹{oldPrice.toLocaleString("en-IN")}
                      </Text>
                    )}
                  </View>

                  {/* DISCOUNT */}

                  {Number(item.discount ?? 0) > 0 && (
                    <Text
                      style={{
                        color: "#16834A",
                        fontSize: 11,
                        fontWeight: "600",
                        marginTop: 3,
                      }}
                    >
                      {item.discount}% OFF
                    </Text>
                  )}
                </Pressable>

                {/* VIEW PRODUCT */}

                <Pressable
                  onPress={() => router.push(`/product/${item._id}`)}
                  className="mt-3 items-center justify-center rounded-full border border-black py-3"
                >
                  <Text className="text-xs font-semibold text-black">
                    View Product
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
