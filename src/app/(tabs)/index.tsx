import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import type { ImageSourcePropType } from "react-native";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import api from "../../services/api";
import { useCartStore } from "../../store/cartStore";
import { useWishlistStore } from "../../store/wishlistStore";

/* =========================================================
   TYPES
========================================================= */

type HeroBanner = {
  id: string;
  image: ImageSourcePropType;
};

type Category = {
  id: string;
  name: string;
  image: string;
};

type Promotion = {
  id: string;
  title: string;
  subtitle: string;
  background: string;
  image: string;
};

type Product = {
  id: string;
  productId: string;
  name: string;
  price: number;
  oldPrice: number;
  discount: string;
  discountPercent: number;
  image: string;
  brand: string;
  stock: number;
  gender: string;
  category: string;
  subcategory: string;
};

type StyleCategory = {
  id: string;
  name: string;
  image: string;
};

/* =========================================================
   COLORS
========================================================= */

const COLORS = {
  background: "#FFFFFF",
  text: "#111111",
  secondary: "#666666",
  muted: "#999999",
  border: "#E9E9E9",
  soft: "#F5F5F5",
  green: "#16834A",
  white: "#FFFFFF",
  black: "#000000",
};

/* =========================================================
   HERO BANNERS
========================================================= */

const HERO_BANNERS: HeroBanner[] = [
  {
    id: "1",
    image: require("../../../assets/images/banner1.png"),
  },
  {
    id: "2",
    image: require("../../../assets/images/banner2.png"),
  },
  {
    id: "3",
    image: require("../../../assets/images/banner3.png"),
  },
  {
    id: "4",
    image: require("../../../assets/images/banner4.png"),
  },
  {
    id: "5",
    image: require("../../../assets/images/banner5.png"),
  },
];

/* =========================================================
   CATEGORIES
========================================================= */

const CATEGORIES: Category[] = [
  {
    id: "women",
    name: "Women",
    image:
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=400&q=85",
  },
  {
    id: "men",
    name: "Men",
    image:
      "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?auto=format&fit=crop&w=400&q=85",
  },
  {
    id: "kids",
    name: "Kids",
    image:
      "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=400&q=85",
  },
  {
    id: "footwear",
    name: "Footwear",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=85",
  },
  {
    id: "bags",
    name: "Bags",
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=400&q=85",
  },
  {
    id: "accessories",
    name: "Accessories",
    image:
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=400&q=85",
  },
];

/* =========================================================
   PROMOTIONS
========================================================= */

const PROMOTIONS: Promotion[] = [
  {
    id: "1",
    title: "Flat\n50% OFF",
    subtitle: "On Selected Styles",
    background: "#F8E4E4",
    image:
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=600&q=85",
  },
  {
    id: "2",
    title: "Fresh\nArrivals",
    subtitle: "Explore Now",
    background: "#E5F0E7",
    image:
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=600&q=85",
  },
  {
    id: "3",
    title: "Trending\nNow",
    subtitle: "Don't Miss Out",
    background: "#F7EBD8",
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=85",
  },
];

/* =========================================================
   SHOP BY STYLE
========================================================= */

const STYLES: StyleCategory[] = [
  {
    id: "1",
    name: "Casual\nLooks",
    image:
      "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: "2",
    name: "Streetwear",
    image:
      "https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: "3",
    name: "Ethnic\nWear",
    image:
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: "4",
    name: "Formal\nWear",
    image:
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=700&q=85",
  },
];

/* =========================================================
   HOME SCREEN
========================================================= */

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [currentBanner, setCurrentBanner] = useState(0);

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productError, setProductError] = useState("");

  const heroRef = useRef<FlatList<HeroBanner>>(null);

  /* =======================================================
     CART
  ======================================================= */

  const totalCartItems = useCartStore((state) => state.getTotalItems());

  /* =======================================================
     WISHLIST
  ======================================================= */

  const wishlistItems = useWishlistStore((state) => state.items);

  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);

  /* =======================================================
     RESPONSIVE
  ======================================================= */

  const isSmallScreen = width < 360;
  const isLargeScreen = width >= 430;
  const isTablet = width >= 600;

  const horizontalPadding = isSmallScreen
    ? 14
    : Math.min(Math.max(width * 0.05, 16), 28);

  /* =======================================================
     HEADER
  ======================================================= */

  const logoWidth = isSmallScreen ? 30 : isLargeScreen ? 40 : 36;

  const logoHeight = logoWidth;

  const headerIconSize = isSmallScreen ? 21 : isLargeScreen ? 24 : 23;

  const headerActionSize = isSmallScreen ? 34 : 38;

  const brandMaxWidth = Math.max(
    115,
    width - horizontalPadding * 2 - headerActionSize * 3 - 20,
  );

  /* =======================================================
     HERO
  ======================================================= */

  const heroWidth = Math.max(1, width - horizontalPadding * 2);

  const heroAspectRatio = 1.75;

  const heroHeight = Math.max(1, heroWidth / heroAspectRatio);

  /* =======================================================
     CATEGORIES
  ======================================================= */

  const categorySize = isSmallScreen
    ? 58
    : Math.min(Math.max(width * 0.16, 60), 70);

  const categoryItemWidth = categorySize + 14;

  /* =======================================================
     PRODUCTS
  ======================================================= */

  const productWidth = isTablet
    ? 190
    : isSmallScreen
      ? Math.max(142, width * 0.41)
      : Math.min(Math.max(width * 0.41, 150), 180);

  const productImageHeight = productWidth * 1.27;

  /* =======================================================
     STYLES
  ======================================================= */

  const styleWidth = isTablet
    ? 180
    : isSmallScreen
      ? 140
      : Math.min(Math.max(width * 0.38, 145), 170);

  const styleHeight = styleWidth * 1.35;

  /* =======================================================
     PROMOTIONS
  ======================================================= */

  const promotionWidth = isTablet
    ? 330
    : isSmallScreen
      ? Math.max(240, width * 0.76)
      : Math.min(Math.max(width * 0.76, 260), 320);

  const promotionHeight = isSmallScreen ? 132 : 145;

  /* =======================================================
     NAVIGATION
  ======================================================= */

  const openShop = () => {
    router.push("/(tabs)/shop");
  };

  const openCategory = (category: string) => {
    router.push({
      pathname: "/(tabs)/shop",
      params: {
        category,
      },
    });
  };

  const openProduct = (id: string) => {
    router.push(`/product/${id}`);
  };

  const openWishlist = () => {
    router.push("/wishlist");
  };

  const openTryOn = () => {
    router.push("/try-on");
  };

  /* =======================================================
     FETCH PRODUCTS
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    const fetchProducts = async () => {
      try {
        if (!mounted) {
          return;
        }

        setLoadingProducts(true);
        setProductError("");

        const response = await api.get("/products");

        const rawProducts = Array.isArray(response.data?.products)
          ? response.data.products
          : Array.isArray(response.data)
            ? response.data
            : [];

        const mappedProducts: Product[] = rawProducts
          .map((item: any) => {
            const price = Number(item?.price ?? 0);

            const discountPercent = Number(item?.discount ?? 0);

            const oldPrice =
              discountPercent > 0 && discountPercent < 100
                ? Math.round(price / (1 - discountPercent / 100))
                : price;

            return {
              id: String(item?._id ?? item?.productId ?? ""),
              productId: String(item?.productId ?? ""),
              name: String(item?.name ?? "Product"),
              price,
              oldPrice,
              discount: discountPercent > 0 ? `${discountPercent}% OFF` : "",
              discountPercent,
              image: String(item?.image ?? ""),
              brand: String(item?.brand ?? ""),
              stock: Number(item?.stock ?? 0),
              gender: String(item?.gender ?? ""),
              category: String(item?.category ?? ""),
              subcategory: String(item?.subcategory ?? ""),
            };
          })
          .filter((item: Product) =>
            Boolean(item.id && item.name && item.image),
          );

        if (!mounted) {
          return;
        }

        setProducts(mappedProducts);
      } catch (error: any) {
        console.error("Home products fetch error:", error);

        if (!mounted) {
          return;
        }

        setProducts([]);

        setProductError(
          error?.response?.data?.message ||
            error?.message ||
            "Unable to load products.",
        );
      } finally {
        if (mounted) {
          setLoadingProducts(false);
        }
      }
    };

    void fetchProducts();

    return () => {
      mounted = false;
    };
  }, []);

  /* =======================================================
     HERO SCROLL
  ======================================================= */

  const handleHeroScroll = (event: any) => {
    const offsetX = event?.nativeEvent?.contentOffset?.x ?? 0;

    const index = Math.round(offsetX / width);

    if (index >= 0 && index < HERO_BANNERS.length) {
      setCurrentBanner(index);
    }
  };

  /* =======================================================
     WISHLIST
  ======================================================= */

  const isProductWishlisted = (id: string) => {
    return wishlistItems.some((wishlistItem) => wishlistItem._id === id);
  };

  const handleWishlistToggle = (item: Product) => {
    toggleWishlist({
      _id: item.id,
      productId: item.productId,
      name: item.name,
      price: item.price,
      image: item.image,
      brand: item.brand,
      stock: item.stock,
      discount: item.discountPercent,
    });
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <SafeAreaView
      className="flex-1"
      edges={["top"]}
      style={{
        backgroundColor: COLORS.background,
      }}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.background}
        translucent={false}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingBottom: 110 + Math.max(insets.bottom, 12),
        }}
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <View
          className="flex-row items-center justify-between"
          style={{
            paddingHorizontal: horizontalPadding,
            paddingTop: Math.max(4, Math.max(insets.top, 4) * 0.15),
            paddingBottom: isSmallScreen ? 10 : 12,
            minHeight: logoHeight + (isSmallScreen ? 16 : 20),
            backgroundColor: COLORS.background,
          }}
        >
          <Pressable
            onPress={() => router.push("/")}
            className="flex-row items-center"
            style={{
              maxWidth: brandMaxWidth,
              flexShrink: 1,
              minHeight: 44,
            }}
            hitSlop={6}
          >
            <Image
              source={require("../../../assets/images/raritone-logo.jpeg")}
              style={{
                width: logoWidth,
                height: logoHeight,
                flexShrink: 0,
              }}
              resizeMode="contain"
            />

            <View
              className="ml-2"
              style={{
                flexShrink: 1,
                minWidth: 0,
              }}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.72}
                style={{
                  color: COLORS.text,
                  fontSize: isSmallScreen ? 17 : isLargeScreen ? 21 : 19,
                  letterSpacing: isSmallScreen ? 2 : Math.min(width * 0.012, 4),
                  fontWeight: "400",
                  flexShrink: 1,
                }}
              >
                RARITONE
              </Text>

              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.65}
                style={{
                  color: COLORS.muted,
                  fontSize: isSmallScreen ? 6 : 7,
                  letterSpacing: isSmallScreen ? 1.6 : 3,
                  textAlign: "center",
                  marginTop: 1,
                }}
              >
                WEAR YOUR STORY
              </Text>
            </View>
          </Pressable>

          <View
            className="flex-row items-center"
            style={{
              flexShrink: 0,
            }}
          >
            {/* SEARCH */}

            <Pressable
              onPress={openShop}
              className="items-center justify-center"
              style={{
                width: headerActionSize,
                height: headerActionSize,
              }}
              hitSlop={4}
            >
              <Ionicons
                name="search-outline"
                size={headerIconSize}
                color={COLORS.text}
              />
            </Pressable>

            {/* WISHLIST */}

            <Pressable
              onPress={openWishlist}
              className="items-center justify-center"
              style={{
                width: headerActionSize,
                height: headerActionSize,
              }}
              hitSlop={4}
            >
              <View className="relative items-center justify-center">
                <Ionicons
                  name={wishlistItems.length > 0 ? "heart" : "heart-outline"}
                  size={headerIconSize + 1}
                  color={COLORS.text}
                />

                {wishlistItems.length > 0 && (
                  <View
                    className="absolute items-center justify-center rounded-full"
                    style={{
                      right: -8,
                      top: -6,
                      minWidth: isSmallScreen ? 15 : 17,
                      height: isSmallScreen ? 15 : 17,
                      paddingHorizontal: 3,
                      backgroundColor: COLORS.black,
                    }}
                  >
                    <Text
                      style={{
                        color: COLORS.white,
                        fontSize: isSmallScreen ? 7 : 8,
                        fontWeight: "700",
                      }}
                    >
                      {wishlistItems.length > 99 ? "99+" : wishlistItems.length}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>

            {/* CART */}

            <Pressable
              onPress={() => router.push("/cart")}
              className="relative items-center justify-center"
              style={{
                width: headerActionSize,
                height: headerActionSize,
              }}
              hitSlop={4}
            >
              <Ionicons
                name="bag-handle-outline"
                size={headerIconSize + 1}
                color={COLORS.text}
              />

              {totalCartItems > 0 && (
                <View
                  className="absolute items-center justify-center rounded-full"
                  style={{
                    right: 0,
                    top: 0,
                    minWidth: isSmallScreen ? 15 : 18,
                    height: isSmallScreen ? 15 : 18,
                    paddingHorizontal: 3,
                    backgroundColor: COLORS.black,
                  }}
                >
                  <Text
                    style={{
                      color: COLORS.white,
                      fontSize: isSmallScreen ? 8 : 9,
                      fontWeight: "700",
                    }}
                  >
                    {totalCartItems > 99 ? "99+" : totalCartItems}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {/* =================================================
            SEARCH BAR
        ================================================= */}

        <Pressable
          onPress={openShop}
          className="flex-row items-center rounded-full"
          style={{
            marginHorizontal: horizontalPadding,
            marginBottom: isSmallScreen ? 16 : 20,
            minHeight: isSmallScreen ? 46 : 50,
            paddingHorizontal: isSmallScreen ? 13 : 16,
            backgroundColor: COLORS.soft,
          }}
        >
          <Ionicons
            name="search-outline"
            size={isSmallScreen ? 18 : 20}
            color={COLORS.secondary}
          />

          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            className="ml-3 flex-1"
            style={{
              color: COLORS.muted,
              fontSize: Math.min(Math.max(width * 0.038, 12), 15),
            }}
          >
            Search for products, brands and more...
          </Text>

          <Ionicons
            name="scan-outline"
            size={isSmallScreen ? 18 : 20}
            color={COLORS.secondary}
          />
        </Pressable>

        {/* =================================================
            HERO
        ================================================= */}

        <FlatList
          ref={heroRef}
          data={HERO_BANNERS}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          onMomentumScrollEnd={handleHeroScroll}
          renderItem={({ item }) => (
            <View
              style={{
                width,
                paddingHorizontal: horizontalPadding,
              }}
            >
              <Pressable
                onPress={openShop}
                className="overflow-hidden rounded-[22px]"
                style={{
                  width: heroWidth,
                  height: heroHeight,
                  backgroundColor: "#F4F4F4",
                }}
              >
                <Image
                  source={item.image}
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                  resizeMode="contain"
                />
              </Pressable>
            </View>
          )}
        />

        {/* DOTS */}

        <View className="mt-3 flex-row items-center justify-center">
          {HERO_BANNERS.map((banner, index) => (
            <View
              key={banner.id}
              className="mx-1 rounded-full"
              style={{
                width: currentBanner === index ? 20 : 7,
                height: 7,
                backgroundColor:
                  currentBanner === index ? COLORS.black : "#D0D0D0",
              }}
            />
          ))}
        </View>

        {/* =================================================
            CATEGORIES
        ================================================= */}

        <SectionHeader
          title="Shop Categories"
          onPress={openShop}
          horizontalPadding={horizontalPadding}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: horizontalPadding,
          }}
        >
          {CATEGORIES.map((category) => (
            <Pressable
              key={category.id}
              onPress={() => openCategory(category.name)}
              className="items-center"
              style={{
                width: categoryItemWidth,
                marginRight: isSmallScreen ? 10 : 13,
              }}
            >
              <Image
                source={{
                  uri: category.image,
                }}
                style={{
                  width: categorySize,
                  height: categorySize,
                  borderRadius: categorySize / 2,
                  backgroundColor: "#F2F2F2",
                }}
                resizeMode="cover"
              />

              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                style={{
                  color: COLORS.text,
                  fontSize: isSmallScreen ? 10 : Math.min(width * 0.03, 12),
                  fontWeight: "500",
                  marginTop: 8,
                }}
              >
                {category.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* =================================================
            WHAT'S NEW
        ================================================= */}

        <SectionHeader
          title="What's New"
          onPress={openShop}
          horizontalPadding={horizontalPadding}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: horizontalPadding,
          }}
        >
          {PROMOTIONS.map((promotion) => (
            <Pressable
              key={promotion.id}
              onPress={openShop}
              className="relative mr-3 overflow-hidden rounded-[18px]"
              style={{
                width: promotionWidth,
                height: promotionHeight,
                backgroundColor: promotion.background,
              }}
            >
              <View
                className="absolute z-10"
                style={{
                  left: isSmallScreen ? 15 : 20,
                  top: isSmallScreen ? 15 : 20,
                  maxWidth: promotionWidth * 0.48,
                }}
              >
                <Text
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                  style={{
                    color: "#171717",
                    fontSize: isSmallScreen ? 19 : 22,
                    lineHeight: isSmallScreen ? 21 : 24,
                    fontWeight: "600",
                  }}
                >
                  {promotion.title}
                </Text>

                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                  style={{
                    color: "#555555",
                    fontSize: isSmallScreen ? 10 : 12,
                    marginTop: 6,
                  }}
                >
                  {promotion.subtitle}
                </Text>

                <View
                  className="mt-3 items-center justify-center rounded-full"
                  style={{
                    width: 32,
                    height: 32,
                    backgroundColor: COLORS.black,
                  }}
                >
                  <Ionicons
                    name="arrow-forward"
                    size={15}
                    color={COLORS.white}
                  />
                </View>
              </View>

              <Image
                source={{
                  uri: promotion.image,
                }}
                className="absolute right-0 h-full"
                style={{
                  width: "53%",
                }}
                resizeMode="cover"
              />
            </Pressable>
          ))}
        </ScrollView>

        {/* =================================================
            TRENDING PRODUCTS
        ================================================= */}

        <SectionHeader
          title="Trending Products"
          onPress={openShop}
          horizontalPadding={horizontalPadding}
        />

        {loadingProducts ? (
          <View
            className="items-center justify-center"
            style={{
              minHeight: productImageHeight + 100,
            }}
          >
            <ActivityIndicator size="small" color={COLORS.black} />

            <Text
              style={{
                color: COLORS.muted,
                fontSize: 12,
                marginTop: 10,
              }}
            >
              Loading products...
            </Text>
          </View>
        ) : products.length === 0 ? (
          <View
            style={{
              marginHorizontal: horizontalPadding,
              paddingVertical: 30,
              paddingHorizontal: 20,
              borderWidth: 1,
              borderColor: COLORS.border,
              borderRadius: 18,
              backgroundColor: COLORS.soft,
            }}
          >
            <View className="items-center">
              <Ionicons name="bag-outline" size={30} color={COLORS.secondary} />

              <Text
                style={{
                  color: COLORS.text,
                  fontSize: 16,
                  fontWeight: "700",
                  marginTop: 10,
                  textAlign: "center",
                }}
              >
                No products available
              </Text>

              <Text
                style={{
                  color: COLORS.secondary,
                  fontSize: 12,
                  marginTop: 5,
                  textAlign: "center",
                }}
              >
                {productError || "New products will appear here soon."}
              </Text>

              <Pressable
                onPress={openShop}
                className="mt-5 rounded-full px-6 py-3"
                style={{
                  backgroundColor: COLORS.black,
                }}
              >
                <Text
                  style={{
                    color: COLORS.white,
                    fontSize: 12,
                    fontWeight: "700",
                  }}
                >
                  Browse Shop
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <FlatList
            data={products.slice(0, 10)}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingHorizontal: horizontalPadding,
            }}
            ItemSeparatorComponent={() => (
              <View
                style={{
                  width: isSmallScreen ? 10 : 14,
                }}
              />
            )}
            renderItem={({ item }) => {
              const liked = isProductWishlisted(item.id);

              return (
                <Pressable
                  onPress={() => openProduct(item.id)}
                  style={{
                    width: productWidth,
                  }}
                >
                  <View
                    className="relative overflow-hidden rounded-[16px]"
                    style={{
                      backgroundColor: "#F4F4F4",
                      width: productWidth,
                      height: productImageHeight,
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

                    <Pressable
                      onPress={(event) => {
                        event.stopPropagation();
                        handleWishlistToggle(item);
                      }}
                      className="absolute right-3 top-3 items-center justify-center rounded-full bg-white"
                      style={{
                        width: isSmallScreen ? 31 : 34,
                        height: isSmallScreen ? 31 : 34,
                        elevation: 2,
                      }}
                      hitSlop={4}
                    >
                      <Ionicons
                        name={liked ? "heart" : "heart-outline"}
                        size={isSmallScreen ? 17 : 19}
                        color={COLORS.text}
                      />
                    </Pressable>

                    {item.stock <= 0 && (
                      <View className="absolute bottom-3 left-3 rounded-full bg-black/80 px-3 py-1.5">
                        <Text className="text-[9px] font-bold text-white">
                          OUT OF STOCK
                        </Text>
                      </View>
                    )}
                  </View>

                  {item.brand ? (
                    <Text
                      numberOfLines={1}
                      style={{
                        color: COLORS.muted,
                        fontSize: 10,
                        fontWeight: "500",
                        marginTop: 8,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      {item.brand}
                    </Text>
                  ) : null}

                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                    style={{
                      color: COLORS.text,
                      fontSize: isSmallScreen ? 13 : 14,
                      fontWeight: "500",
                      marginTop: item.brand ? 3 : 10,
                    }}
                  >
                    {item.name}
                  </Text>

                  <View className="mt-1 flex-row items-center">
                    <Text
                      style={{
                        color: COLORS.text,
                        fontSize: isSmallScreen ? 14 : 15,
                        fontWeight: "700",
                      }}
                    >
                      ₹{item.price.toLocaleString("en-IN")}
                    </Text>

                    {item.discountPercent > 0 && item.oldPrice > item.price && (
                      <Text
                        numberOfLines={1}
                        style={{
                          color: COLORS.muted,
                          fontSize: 11,
                          marginLeft: 6,
                          textDecorationLine: "line-through",
                        }}
                      >
                        ₹{item.oldPrice.toLocaleString("en-IN")}
                      </Text>
                    )}
                  </View>

                  {item.discount && (
                    <Text
                      style={{
                        color: COLORS.green,
                        fontSize: isSmallScreen ? 11 : 12,
                        fontWeight: "600",
                        marginTop: 3,
                      }}
                    >
                      {item.discount}
                    </Text>
                  )}
                </Pressable>
              );
            }}
          />
        )}

        {/* =================================================
            SHOP BY STYLE
        ================================================= */}

        <SectionHeader
          title="Shop by Style"
          onPress={openShop}
          horizontalPadding={horizontalPadding}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: horizontalPadding,
          }}
        >
          {STYLES.map((style) => (
            <Pressable
              key={style.id}
              onPress={openShop}
              className="relative mr-3 overflow-hidden rounded-[18px]"
              style={{
                width: styleWidth,
                height: styleHeight,
              }}
            >
              <Image
                source={{
                  uri: style.image,
                }}
                className="absolute inset-0 h-full w-full"
                resizeMode="cover"
              />

              <View
                className="absolute inset-0"
                style={{
                  backgroundColor: "rgba(0,0,0,0.25)",
                }}
              />

              <View
                className="absolute"
                style={{
                  bottom: 16,
                  left: 15,
                  right: 12,
                }}
              >
                <Text
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                  style={{
                    color: COLORS.white,
                    fontSize: isSmallScreen ? 16 : 19,
                    lineHeight: isSmallScreen ? 19 : 22,
                    fontWeight: "600",
                  }}
                >
                  {style.name}
                </Text>

                <View className="mt-2 flex-row items-center">
                  <Text
                    style={{
                      color: COLORS.white,
                      fontSize: 11,
                      fontWeight: "500",
                    }}
                  >
                    Explore
                  </Text>

                  <Ionicons
                    name="arrow-forward"
                    size={14}
                    color={COLORS.white}
                    style={{
                      marginLeft: 6,
                    }}
                  />
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        {/* =================================================
            AI TRY ON
        ================================================= */}

        <Pressable
          onPress={openTryOn}
          className="overflow-hidden rounded-[22px]"
          style={{
            marginHorizontal: horizontalPadding,
            marginTop: 32,
            backgroundColor: "#F0ECFA",
          }}
        >
          <View
            className="flex-row items-center"
            style={{
              paddingHorizontal: isSmallScreen ? 12 : 16,
              paddingVertical: isSmallScreen ? 15 : 20,
              minHeight: isSmallScreen ? 82 : 96,
            }}
          >
            <View
              className="items-center justify-center rounded-[17px] bg-white"
              style={{
                width: isSmallScreen ? 46 : 56,
                height: isSmallScreen ? 46 : 56,
                marginRight: isSmallScreen ? 9 : 12,
              }}
            >
              <Ionicons
                name="sparkles-outline"
                size={isSmallScreen ? 23 : 27}
                color="#9B4DCA"
              />
            </View>

            <View
              className="flex-1"
              style={{
                minWidth: 0,
              }}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.68}
                style={{
                  color: "#171717",
                  fontSize: isSmallScreen ? 14 : 17,
                  fontWeight: "700",
                }}
              >
                Raritone AI Try-On
              </Text>

              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.65}
                style={{
                  color: "#666666",
                  fontSize: isSmallScreen ? 9 : 11,
                  marginTop: 3,
                }}
              >
                See it on you before you buy
              </Text>
            </View>

            <View
              className="items-center justify-center rounded-full"
              style={{
                paddingHorizontal: isSmallScreen ? 11 : 16,
                paddingVertical: isSmallScreen ? 9 : 12,
                minHeight: 38,
                backgroundColor: COLORS.black,
              }}
            >
              <Text
                style={{
                  color: COLORS.white,
                  fontSize: isSmallScreen ? 10 : 12,
                  fontWeight: "600",
                }}
              >
                Try Now
              </Text>
            </View>
          </View>
        </Pressable>

        {/* =================================================
            TRUST
        ================================================= */}

        <View
          className="flex-row border-y py-5"
          style={{
            marginHorizontal: horizontalPadding,
            marginTop: 28,
            borderColor: COLORS.border,
          }}
        >
          <TrustItem
            icon="shield-checkmark-outline"
            title="Secure"
            subtitle="Payments"
          />

          <TrustItem icon="refresh-outline" title="Easy" subtitle="Returns" />

          <TrustItem icon="cube-outline" title="Fast" subtitle="Delivery" />
        </View>

        {/* =================================================
            BRAND
        ================================================= */}

        <View
          className="items-center"
          style={{
            paddingHorizontal: horizontalPadding,
            paddingBottom: 20,
            paddingTop: 32,
          }}
        >
          <Text
            style={{
              color: "#AAAAAA",
              fontSize: 9,
              letterSpacing: 4,
            }}
          >
            RARITONE
          </Text>

          <Text
            style={{
              color: "#C0C0C0",
              fontSize: 8,
              letterSpacing: 2,
              marginTop: 3,
            }}
          >
            WEAR YOUR STORY
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHeader({
  title,
  onPress,
  horizontalPadding,
}: {
  title: string;
  onPress: () => void;
  horizontalPadding: number;
}) {
  return (
    <View
      className="mt-8 mb-4 flex-row items-center justify-between"
      style={{
        paddingHorizontal: horizontalPadding,
      }}
    >
      <Text
        adjustsFontSizeToFit
        minimumFontScale={0.72}
        numberOfLines={1}
        style={{
          color: COLORS.text,
          fontSize: 20,
          fontWeight: "700",
          flexShrink: 1,
        }}
      >
        {title}
      </Text>

      <Pressable
        onPress={onPress}
        className="ml-3 flex-row items-center"
        style={{
          minHeight: 36,
          flexShrink: 0,
        }}
        hitSlop={6}
      >
        <Text
          style={{
            color: "#555555",
            fontSize: 12,
            fontWeight: "500",
            marginRight: 5,
          }}
        >
          See All
        </Text>

        <Ionicons name="arrow-forward" size={14} color="#222222" />
      </Pressable>
    </View>
  );
}

/* =========================================================
   TRUST ITEM
========================================================= */

function TrustItem({
  icon,
  title,
  subtitle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}) {
  return (
    <View
      className="flex-1 items-center"
      style={{
        minWidth: 0,
      }}
    >
      <Ionicons name={icon} size={21} color="#222222" />

      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        style={{
          color: "#222222",
          fontSize: 11,
          fontWeight: "600",
          marginTop: 6,
        }}
      >
        {title}
      </Text>

      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        style={{
          color: "#888888",
          fontSize: 9,
          marginTop: 2,
        }}
      >
        {subtitle}
      </Text>
    </View>
  );
}
