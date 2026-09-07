import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MobileProductCard, { MobileProduct } from "../../components/MobileProductCard";
import { COLORS, RADIUS, SCREEN } from "../../constants/theme";
import api from "../../services/api";

const categories = [
  { label: "Women", image: require("../../../assets/images/home.jpg") },
  { label: "Men", image: require("../../../assets/images/home.jpg") },
  { label: "Kids", image: require("../../../assets/images/home.jpg") },
];

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [products, setProducts] = useState<MobileProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const horizontal = width >= 768 ? 40 : SCREEN.horizontalPadding;
  const gap = 12;
  const cardWidth = (width - horizontal * 2 - gap) / 2;

  useEffect(() => {
    let mounted = true;
    api.get("/products").then((response) => {
      if (mounted) setProducts(response.data.products || []);
    }).catch((error) => console.error("Home products error:", error))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const trending = useMemo(() => products.slice(0, 6), [products]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 34 }}>
        <View style={{ paddingHorizontal: horizontal, paddingTop: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View>
              <Text style={{ color: COLORS.muted, fontSize: 10, fontWeight: "700", letterSpacing: 2.2 }}>RARITONE</Text>
              <Text style={{ color: COLORS.primary, fontSize: 14, marginTop: 5 }}>Curated for your style</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(tabs)/profile")} style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="person-outline" size={19} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 18, height: Math.min(width * 1.18, 520), borderRadius: RADIUS.xxl, overflow: "hidden", backgroundColor: COLORS.surface }}>
            <Image source={require("../../../assets/images/home.jpg")} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
            <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: COLORS.overlay }} />
            <View style={{ position: "absolute", left: 22, right: 22, bottom: 24 }}>
              <View style={{ alignSelf: "flex-start", borderWidth: 1, borderColor: "rgba(255,255,255,0.35)", backgroundColor: "rgba(255,255,255,0.12)", borderRadius: RADIUS.pill, paddingHorizontal: 11, paddingVertical: 7 }}>
                <Text style={{ color: COLORS.white, fontSize: 9, fontWeight: "700", letterSpacing: 1.5 }}>SUMMER 2026</Text>
              </View>
              <Text style={{ color: COLORS.white, fontSize: 40, lineHeight: 40, fontWeight: "700", letterSpacing: -1.2, marginTop: 14 }}>Golden Hour{`\n`}Collection</Text>
              <Text style={{ color: "rgba(255,255,255,0.78)", fontSize: 13, lineHeight: 20, marginTop: 10, maxWidth: 300 }}>Everyday essentials, statement pieces and effortless silhouettes.</Text>
              <View style={{ flexDirection: "row", gap: 9, marginTop: 17 }}>
                <Pressable onPress={() => router.push("/(tabs)/shop")} style={{ backgroundColor: COLORS.white, borderRadius: RADIUS.pill, paddingHorizontal: 18, paddingVertical: 12 }}><Text style={{ color: COLORS.primary, fontWeight: "700", fontSize: 12 }}>Shop the edit</Text></Pressable>
                <Pressable onPress={() => router.push("/(tabs)/try-on")} style={{ backgroundColor: "rgba(255,255,255,0.14)", borderColor: "rgba(255,255,255,0.35)", borderWidth: 1, borderRadius: RADIUS.pill, paddingHorizontal: 15, paddingVertical: 12, flexDirection: "row", alignItems: "center" }}><Ionicons name="sparkles-outline" size={15} color={COLORS.white} /><Text style={{ color: COLORS.white, fontWeight: "700", fontSize: 12, marginLeft: 6 }}>Try-On</Text></Pressable>
              </View>
            </View>
          </View>

          <View style={{ marginTop: 18, borderRadius: RADIUS.lg, backgroundColor: COLORS.primary, padding: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flex: 1, paddingRight: 12 }}><Text style={{ color: "#AFAFA9", fontSize: 9, fontWeight: "700", letterSpacing: 1.5 }}>LIMITED TIME</Text><Text style={{ color: COLORS.white, fontSize: 16, fontWeight: "700", marginTop: 5 }}>Seasonal edit — up to 30% off</Text></View>
            <TouchableOpacity onPress={() => router.push("/(tabs)/shop")} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.white, alignItems: "center", justifyContent: "center" }}><Ionicons name="arrow-forward" size={17} color={COLORS.primary} /></TouchableOpacity>
          </View>
        </View>

        <View style={{ marginTop: 34 }}>
          <View style={{ paddingHorizontal: horizontal, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
            <View><Text style={{ color: COLORS.muted, fontSize: 10, fontWeight: "700", letterSpacing: 1.8 }}>SHOP BY CATEGORY</Text><Text style={{ color: COLORS.primary, fontSize: 25, fontWeight: "700", marginTop: 7 }}>Find your edit</Text></View>
            <TouchableOpacity onPress={() => router.push("/(tabs)/shop")}><Text style={{ color: COLORS.secondary, fontSize: 12, fontWeight: "600" }}>View all</Text></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: horizontal, gap: 12, marginTop: 16 }}>
            {categories.map((category) => <TouchableOpacity key={category.label} activeOpacity={0.9} onPress={() => router.push({ pathname: "/(tabs)/shop", params: { gender: category.label } })} style={{ width: Math.min(width * 0.31, 170), height: 150, borderRadius: RADIUS.lg, overflow: "hidden", backgroundColor: COLORS.surface }}><Image source={category.image} style={{ width: "100%", height: "100%" }} resizeMode="cover" /><View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.28)" }} /><Text style={{ position: "absolute", left: 14, bottom: 14, color: COLORS.white, fontSize: 17, fontWeight: "700" }}>{category.label}</Text></TouchableOpacity>)}
          </ScrollView>
        </View>

        <View style={{ marginTop: 36, paddingHorizontal: horizontal }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}><View><Text style={{ color: COLORS.muted, fontSize: 10, fontWeight: "700", letterSpacing: 1.8 }}>CURATED FOR YOU</Text><Text style={{ color: COLORS.primary, fontSize: 25, fontWeight: "700", marginTop: 7 }}>Trending now</Text></View><TouchableOpacity onPress={() => router.push("/(tabs)/shop")}><Text style={{ color: COLORS.secondary, fontSize: 12, fontWeight: "600" }}>See all</Text></TouchableOpacity></View>
          {loading ? <View style={{ paddingVertical: 70, alignItems: "center" }}><ActivityIndicator size="small" color={COLORS.primary} /><Text style={{ color: COLORS.muted, marginTop: 12, fontSize: 12 }}>Loading collection...</Text></View> : trending.length ? <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 18 }}>{trending.map((product) => <MobileProductCard key={product._id} product={product} width={cardWidth} onPress={() => router.push({ pathname: "/product/[id]", params: { id: product._id } })} />)}</View> : <View style={{ paddingVertical: 50, alignItems: "center" }}><Text style={{ color: COLORS.muted, fontSize: 13 }}>No products available right now.</Text></View>}
        </View>

        <View style={{ marginHorizontal: horizontal, marginTop: 18, borderRadius: RADIUS.xl, backgroundColor: COLORS.surface, padding: 22 }}><Ionicons name="sparkles-outline" size={22} color={COLORS.primary} /><Text style={{ color: COLORS.primary, fontSize: 23, fontWeight: "700", marginTop: 14 }}>See it before you buy.</Text><Text style={{ color: COLORS.secondary, fontSize: 13, lineHeight: 20, marginTop: 8 }}>Upload a photo, choose a garment and preview your look with Raritone AI Try-On.</Text><TouchableOpacity onPress={() => router.push("/(tabs)/try-on")} style={{ alignSelf: "flex-start", marginTop: 16, backgroundColor: COLORS.primary, borderRadius: RADIUS.pill, paddingHorizontal: 17, paddingVertical: 12 }}><Text style={{ color: COLORS.white, fontSize: 12, fontWeight: "700" }}>Open Try-On Studio</Text></TouchableOpacity></View>
      </ScrollView>
    </SafeAreaView>
  );
}
