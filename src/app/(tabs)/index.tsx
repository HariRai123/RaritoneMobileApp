import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

/* =========================================================
   TYPES
========================================================= */

type HeroBanner = {
  id: string;
  image: string;
  eyebrow: string;
  title: string;
  subtitle: string;
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
  name: string;
  price: number;
  oldPrice: number;
  discount: string;
  image: string;
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
   HERO DATA
========================================================= */

const HERO_BANNERS: HeroBanner[] = [
  {
    id: "1",
    image:
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1400&q=85",
    eyebrow: "NEW COLLECTION",
    title: "Modern\nTradition",
    subtitle: "Timeless styles for\nthe new you",
  },
  {
    id: "2",
    image:
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1400&q=85",
    eyebrow: "FESTIVE EDIT",
    title: "Celebrate\nIn Style",
    subtitle: "Discover the latest\nfestive collection",
  },
  {
    id: "3",
    image:
      "https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=1400&q=85",
    eyebrow: "NEW ARRIVALS",
    title: "Everyday\nElegance",
    subtitle: "Styles made for\nevery moment",
  },
];

/* =========================================================
   CATEGORIES
========================================================= */

const CATEGORIES: Category[] = [
  {
    id: "1",
    name: "Women",
    image:
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=400&q=85",
  },
  {
    id: "2",
    name: "Men",
    image:
      "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?auto=format&fit=crop&w=400&q=85",
  },
  {
    id: "3",
    name: "Kids",
    image:
      "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=400&q=85",
  },
  {
    id: "4",
    name: "Footwear",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=85",
  },
  {
    id: "5",
    name: "Bags",
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=400&q=85",
  },
  {
    id: "6",
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
   PRODUCTS
========================================================= */

const PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Ribbed Crop Top",
    price: 799,
    oldPrice: 1199,
    discount: "33% OFF",
    image:
      "https://images.unsplash.com/photo-1564257577054-3e5ab1b5f0f6?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: "2",
    name: "Oversized T-Shirt",
    price: 899,
    oldPrice: 1299,
    discount: "31% OFF",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: "3",
    name: "Classic Sneakers",
    price: 2499,
    oldPrice: 3499,
    discount: "29% OFF",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: "4",
    name: "Structured Handbag",
    price: 1899,
    oldPrice: 2999,
    discount: "37% OFF",
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=700&q=85",
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

  const [currentBanner, setCurrentBanner] = useState(0);
  const [wishlist, setWishlist] = useState<string[]>([]);

  const heroRef = useRef<FlatList<HeroBanner>>(null);

  /* =======================================================
     RESPONSIVE VALUES
  ======================================================= */

  const horizontalPadding = Math.max(16, width * 0.05);

  const logoWidth = Math.min(width * 0.075, 38);
  const logoHeight = Math.min(width * 0.075, 38);

  const heroWidth = width - horizontalPadding * 2;

  const heroHeight = Math.min(Math.max(heroWidth * 0.68, 270), 360);

  const categorySize = Math.min(Math.max(width * 0.16, 58), 70);

  const productWidth = Math.min(Math.max(width * 0.41, 150), 175);

  const productImageHeight = productWidth * 1.27;

  const styleWidth = Math.min(Math.max(width * 0.38, 140), 160);

  const styleHeight = styleWidth * 1.35;

  /* =======================================================
     NAVIGATION
  ======================================================= */

  const openShop = () => {
    router.push("/(tabs)/shop");
  };

  const openProduct = (id: string) => {
    router.push(`/product/${id}`);
  };

  const openTryOn = () => {
    router.push("/try-on");
  };

  /* =======================================================
     WISHLIST
  ======================================================= */

  const toggleWishlist = (id: string) => {
    setWishlist((previous) => {
      if (previous.includes(id)) {
        return previous.filter((item) => item !== id);
      }

      return [...previous, id];
    });
  };

  /* =======================================================
     HERO SCROLL
  ======================================================= */

  const handleHeroScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;

    const index = Math.round(offsetX / width);

    setCurrentBanner(index);
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: COLORS.background,
      }}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 110,
        }}
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <View
          className="flex-row items-center justify-between"
          style={{
            paddingHorizontal: horizontalPadding,
            paddingTop: 10,
            paddingBottom: 12,
            backgroundColor: COLORS.background,
          }}
        >
          {/* BRAND */}

          <Pressable
            onPress={() => router.push("/")}
            className="flex-row items-center"
          >
            <Image
              source={require("../../../assets/images/raritone-logo.jpeg")}
              style={{
                width: logoWidth,
                height: logoHeight,
              }}
              resizeMode="contain"
            />

            <View className="ml-2">
              <Text
                style={{
                  color: COLORS.text,
                  fontSize: Math.min(width * 0.052, 21),
                  letterSpacing: Math.min(width * 0.012, 4),
                  fontWeight: "400",
                }}
              >
                RARITONE
              </Text>

              <Text
                style={{
                  color: COLORS.muted,
                  fontSize: Math.min(width * 0.018, 7),
                  letterSpacing: Math.min(width * 0.008, 3),
                  textAlign: "center",
                  marginTop: 1,
                }}
              >
                WEAR YOUR STORY
              </Text>
            </View>
          </Pressable>

          {/* HEADER ACTIONS */}

          <View className="flex-row items-center">
            {/* SEARCH */}

            <Pressable
              onPress={openShop}
              className="items-center justify-center"
              style={{
                width: 38,
                height: 38,
              }}
            >
              <Ionicons name="search-outline" size={24} color={COLORS.text} />
            </Pressable>

            {/* WISHLIST */}

            <Pressable
              onPress={openShop}
              className="ml-1 items-center justify-center"
              style={{
                width: 38,
                height: 38,
              }}
            >
              <Ionicons name="heart-outline" size={25} color={COLORS.text} />
            </Pressable>

            {/* CART */}

            <Pressable
              onPress={() => router.push("/cart")}
              className="relative ml-1 items-center justify-center"
              style={{
                width: 38,
                height: 38,
              }}
            >
              <Ionicons
                name="bag-handle-outline"
                size={25}
                color={COLORS.text}
              />

              <View
                className="absolute right-0 top-0 items-center justify-center rounded-full"
                style={{
                  width: 18,
                  height: 18,
                  backgroundColor: COLORS.black,
                }}
              >
                <Text className="text-[9px] font-bold text-white">3</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* =================================================
            SEARCH BAR
        ================================================= */}

        <Pressable
          onPress={openShop}
          className="mx-5 mb-5 flex-row items-center rounded-full"
          style={{
            minHeight: 50,
            paddingHorizontal: 16,
            backgroundColor: COLORS.soft,
          }}
        >
          <Ionicons name="search-outline" size={20} color={COLORS.secondary} />

          <Text
            numberOfLines={1}
            className="ml-3 flex-1"
            style={{
              color: COLORS.muted,
              fontSize: Math.min(width * 0.038, 15),
            }}
          >
            Search for products, brands and more...
          </Text>

          <Ionicons name="scan-outline" size={20} color={COLORS.secondary} />
        </Pressable>

        {/* =================================================
            HERO BANNER
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
                className="relative overflow-hidden rounded-[22px]"
                style={{
                  height: heroHeight,
                }}
              >
                {/* IMAGE */}

                <Image
                  source={{
                    uri: item.image,
                  }}
                  className="absolute inset-0 h-full w-full"
                  resizeMode="cover"
                />

                {/* LIGHT OVERLAY */}

                <View
                  className="absolute inset-0"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.16)",
                  }}
                />

                {/* HERO CONTENT */}

                <View
                  className="absolute"
                  style={{
                    left: heroWidth * 0.07,
                    top: heroHeight * 0.13,
                  }}
                >
                  <Text
                    style={{
                      color: "#222222",
                      fontSize: Math.min(width * 0.03, 12),
                      letterSpacing: Math.min(width * 0.012, 4),
                      fontWeight: "600",
                    }}
                  >
                    {item.eyebrow}
                  </Text>

                  <Text
                    style={{
                      color: "#111111",
                      marginTop: 14,
                      fontSize: Math.min(width * 0.09, 39),
                      lineHeight: Math.min(width * 0.092, 41),
                      fontWeight: "300",
                    }}
                  >
                    {item.title}
                  </Text>

                  <Text
                    style={{
                      color: "#333333",
                      marginTop: 13,
                      fontSize: Math.min(width * 0.038, 16),
                      lineHeight: Math.min(width * 0.052, 21),
                    }}
                  >
                    {item.subtitle}
                  </Text>

                  {/* SHOP BUTTON */}

                  <View
                    className="mt-5 flex-row items-center rounded-full"
                    style={{
                      paddingHorizontal: 19,
                      paddingVertical: 12,
                      alignSelf: "flex-start",
                      backgroundColor: COLORS.black,
                    }}
                  >
                    <Text className="mr-2 text-[13px] font-semibold text-white">
                      Shop Now
                    </Text>

                    <Ionicons
                      name="arrow-forward"
                      size={16}
                      color={COLORS.white}
                    />
                  </View>
                </View>
              </Pressable>
            </View>
          )}
        />

        {/* HERO DOTS */}

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

        <SectionHeader title="Shop Categories" onPress={openShop} />

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
              onPress={openShop}
              className="items-center"
              style={{
                width: categorySize + 12,
                marginRight: 13,
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
                style={{
                  color: COLORS.text,
                  fontSize: Math.min(width * 0.03, 12),
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
            PROMOTIONS
        ================================================= */}

        <SectionHeader title="What's New" onPress={openShop} />

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
                width: Math.min(width * 0.76, 290),
                height: 145,
                backgroundColor: promotion.background,
              }}
            >
              {/* TEXT */}

              <View className="absolute left-5 top-5 z-10">
                <Text
                  style={{
                    color: "#171717",
                    fontSize: 22,
                    lineHeight: 24,
                    fontWeight: "600",
                  }}
                >
                  {promotion.title}
                </Text>

                <Text
                  style={{
                    color: "#555555",
                    fontSize: 12,
                    marginTop: 6,
                  }}
                >
                  {promotion.subtitle}
                </Text>

                <View
                  className="mt-4 h-8 w-8 items-center justify-center rounded-full"
                  style={{
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

              {/* IMAGE */}

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

        <SectionHeader title="Trending Products" onPress={openShop} />

        <FlatList
          data={PRODUCTS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: horizontalPadding,
          }}
          ItemSeparatorComponent={() => <View style={{ width: 14 }} />}
          renderItem={({ item }) => {
            const liked = wishlist.includes(item.id);

            return (
              <Pressable
                onPress={() => openProduct(item.id)}
                style={{
                  width: productWidth,
                }}
              >
                {/* PRODUCT IMAGE */}

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

                  {/* WISHLIST */}

                  <Pressable
                    onPress={(event) => {
                      event.stopPropagation();
                      toggleWishlist(item.id);
                    }}
                    className="absolute right-3 top-3 items-center justify-center rounded-full bg-white"
                    style={{
                      width: 34,
                      height: 34,
                    }}
                  >
                    <Ionicons
                      name={liked ? "heart" : "heart-outline"}
                      size={19}
                      color={COLORS.text}
                    />
                  </Pressable>
                </View>

                {/* PRODUCT NAME */}

                <Text
                  numberOfLines={1}
                  style={{
                    color: COLORS.text,
                    fontSize: 14,
                    fontWeight: "500",
                    marginTop: 10,
                  }}
                >
                  {item.name}
                </Text>

                {/* PRICE */}

                <View className="mt-1 flex-row items-center">
                  <Text
                    style={{
                      color: COLORS.text,
                      fontSize: 15,
                      fontWeight: "700",
                    }}
                  >
                    ₹{item.price.toLocaleString("en-IN")}
                  </Text>

                  <Text
                    style={{
                      color: COLORS.muted,
                      fontSize: 11,
                      marginLeft: 7,
                      textDecorationLine: "line-through",
                    }}
                  >
                    ₹{item.oldPrice.toLocaleString("en-IN")}
                  </Text>
                </View>

                {/* DISCOUNT */}

                <Text
                  style={{
                    color: COLORS.green,
                    fontSize: 12,
                    fontWeight: "600",
                    marginTop: 3,
                  }}
                >
                  {item.discount}
                </Text>
              </Pressable>
            );
          }}
        />

        {/* =================================================
            SHOP BY STYLE
        ================================================= */}

        <SectionHeader title="Shop by Style" onPress={openShop} />

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
              {/* IMAGE */}

              <Image
                source={{
                  uri: style.image,
                }}
                className="absolute inset-0 h-full w-full"
                resizeMode="cover"
              />

              {/* DARK IMAGE OVERLAY */}

              <View
                className="absolute inset-0"
                style={{
                  backgroundColor: "rgba(0,0,0,0.25)",
                }}
              />

              {/* CONTENT */}

              <View className="absolute bottom-4 left-4 right-3">
                <Text
                  style={{
                    color: COLORS.white,
                    fontSize: 19,
                    lineHeight: 22,
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
          className="mx-5 mt-8 overflow-hidden rounded-[22px]"
          style={{
            backgroundColor: "#F0ECFA",
          }}
        >
          <View className="flex-row items-center px-4 py-5">
            {/* ICON */}

            <View className="mr-3 h-14 w-14 items-center justify-center rounded-[17px] bg-white">
              <Ionicons name="sparkles-outline" size={27} color="#9B4DCA" />
            </View>

            {/* TEXT */}

            <View className="flex-1">
              <Text
                style={{
                  color: "#171717",
                  fontSize: 17,
                  fontWeight: "700",
                }}
              >
                Raritone AI Try-On
              </Text>

              <Text
                style={{
                  color: "#666666",
                  fontSize: 11,
                  marginTop: 3,
                }}
              >
                See it on you before you buy
              </Text>
            </View>

            {/* BUTTON */}

            <View
              className="rounded-full px-4 py-3"
              style={{
                backgroundColor: COLORS.black,
              }}
            >
              <Text
                style={{
                  color: COLORS.white,
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                Try Now
              </Text>
            </View>
          </View>
        </Pressable>

        {/* =================================================
            TRUST FEATURES
        ================================================= */}

        <View
          className="mx-5 mt-7 flex-row border-y py-5"
          style={{
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
            BOTTOM BRAND SPACE
        ================================================= */}

        <View className="items-center px-5 pb-5 pt-8">
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
    </View>
  );
}

/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHeader({
  title,
  onPress,
}: {
  title: string;
  onPress: () => void;
}) {
  return (
    <View className="mt-8 mb-4 flex-row items-center justify-between px-5">
      <Text
        style={{
          color: "#111111",
          fontSize: 20,
          fontWeight: "700",
        }}
      >
        {title}
      </Text>

      <Pressable onPress={onPress} className="flex-row items-center">
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
    <View className="flex-1 items-center">
      <Ionicons name={icon} size={21} color="#222222" />

      <Text
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
