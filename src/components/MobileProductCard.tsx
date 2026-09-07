import { Ionicons } from "@expo/vector-icons";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { COLORS, RADIUS, SHADOW, SPACING } from "../constants/theme";

export type MobileProduct = {
  _id: string;
  name: string;
  price: number;
  image: string;
  brand: string;
  discount: number;
  subcategory: string;
  stock: number;
};

type Props = {
  product: MobileProduct;
  width: number;
  onPress: () => void;
  onWishlist?: () => void;
  wishlisted?: boolean;
};

export default function MobileProductCard({
  product,
  width,
  onPress,
  onWishlist,
  wishlisted = false,
}: Props) {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={{ width }}>
      <View style={{ marginBottom: SPACING.xl }}>
        <View
          style={{
            height: width * 1.18,
            borderRadius: RADIUS.lg,
            overflow: "hidden",
            backgroundColor: COLORS.surface,
            ...SHADOW.card,
          }}
        >
          <Image
            source={{ uri: product.image }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />

          {product.discount > 0 && (
            <View
              style={{
                position: "absolute",
                top: 10,
                left: 10,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: RADIUS.pill,
                backgroundColor: COLORS.white,
              }}
            >
              <Text style={{ color: COLORS.primary, fontSize: 10, fontWeight: "700" }}>
                {product.discount}% OFF
              </Text>
            </View>
          )}

          {onWishlist && (
            <TouchableOpacity
              onPress={onWishlist}
              hitSlop={8}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255,255,255,0.92)",
              }}
            >
              <Ionicons
                name={wishlisted ? "heart" : "heart-outline"}
                size={18}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={{ paddingTop: 12 }}>
          <Text
            numberOfLines={1}
            style={{
              color: COLORS.muted,
              fontSize: 10,
              fontWeight: "600",
              letterSpacing: 1.2,
              textTransform: "uppercase",
            }}
          >
            {product.brand}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              color: COLORS.primary,
              fontSize: 14,
              fontWeight: "600",
              marginTop: 6,
            }}
          >
            {product.name}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 5 }}>
            <Text style={{ color: COLORS.primary, fontSize: 14, fontWeight: "700" }}>
              ₹{product.price.toLocaleString("en-IN")}
            </Text>
            <Text style={{ color: COLORS.muted, fontSize: 12, marginLeft: 7 }}>
              {product.subcategory}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
