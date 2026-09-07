import { Ionicons } from "@expo/vector-icons";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useCartStore } from "../../store/cartStore";

export default function CartScreen() {
  const { width } = useWindowDimensions();

  const items = useCartStore((state) => state.items);
  const increaseQuantity = useCartStore((state) => state.increaseQuantity);
  const decreaseQuantity = useCartStore((state) => state.decreaseQuantity);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);

  const isTablet = width >= 768;
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  if (items.length === 0) {
    return (
      <View className="flex-1 bg-black items-center justify-center px-8">
        <View className="w-20 h-20 rounded-full bg-neutral-900 items-center justify-center mb-6">
          <Ionicons name="cart-outline" size={38} color="#737373" />
        </View>

        <Text className="text-white text-2xl font-bold">
          Your cart is empty
        </Text>

        <Text className="text-neutral-500 text-center mt-3 text-base">
          Looks like you haven't added anything to your cart yet.
        </Text>

        <Pressable
          className="bg-white rounded-full px-8 py-4 mt-8"
          onPress={() => {}}
        >
          <Text className="text-black font-bold">Start Shopping</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: isTablet ? 32 : 20,
          paddingBottom: 180,
        }}
      >
        <View className="mb-8">
          <Text className="text-white text-3xl font-bold">Your Cart</Text>

          <Text className="text-neutral-500 mt-2">
            {totalItems} {totalItems === 1 ? "item" : "items"}
          </Text>
        </View>

        <View className={isTablet ? "flex-row flex-wrap justify-between" : ""}>
          {items.map((item) => (
            <View
              key={item._id}
              className={`bg-neutral-950 border border-neutral-900 rounded-3xl p-4 mb-4 ${
                isTablet ? "w-[48.5%]" : "w-full"
              }`}
            >
              <View className="flex-row">
                <Image
                  source={{ uri: item.image }}
                  className="w-28 h-32 rounded-2xl bg-neutral-900"
                  resizeMode="cover"
                />

                <View className="flex-1 ml-4">
                  <View className="flex-row justify-between">
                    <View className="flex-1 pr-2">
                      <Text
                        className="text-neutral-500 text-xs uppercase"
                        numberOfLines={1}
                      >
                        {item.brand}
                      </Text>

                      <Text
                        className="text-white font-semibold text-base mt-1"
                        numberOfLines={2}
                      >
                        {item.name}
                      </Text>
                    </View>

                    <Pressable
                      onPress={() => removeFromCart(item._id)}
                      className="w-9 h-9 rounded-full bg-neutral-900 items-center justify-center"
                    >
                      <Ionicons
                        name="trash-outline"
                        size={17}
                        color="#A3A3A3"
                      />
                    </Pressable>
                  </View>

                  <Text className="text-white font-bold text-lg mt-4">
                    ₹{item.price.toLocaleString("en-IN")}
                  </Text>

                  <View className="flex-row items-center justify-between mt-4">
                    <View className="flex-row items-center bg-neutral-900 rounded-full">
                      <Pressable
                        onPress={() => decreaseQuantity(item._id)}
                        className="w-9 h-9 items-center justify-center"
                      >
                        <Ionicons name="remove" size={17} color="#FFFFFF" />
                      </Pressable>

                      <Text className="text-white font-semibold px-2">
                        {item.quantity}
                      </Text>

                      <Pressable
                        onPress={() => increaseQuantity(item._id)}
                        className="w-9 h-9 items-center justify-center"
                      >
                        <Ionicons name="add" size={17} color="#FFFFFF" />
                      </Pressable>
                    </View>

                    <Text className="text-neutral-400 text-sm">
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View className="bg-neutral-950 border border-neutral-900 rounded-3xl p-5 mt-4">
          <Text className="text-white text-xl font-bold mb-5">
            Order Summary
          </Text>

          <View className="flex-row justify-between mb-3">
            <Text className="text-neutral-500">Items ({totalItems})</Text>

            <Text className="text-neutral-300">
              ₹{totalPrice.toLocaleString("en-IN")}
            </Text>
          </View>

          <View className="flex-row justify-between mb-3">
            <Text className="text-neutral-500">Delivery</Text>

            <Text className="text-green-500">FREE</Text>
          </View>

          <View className="h-[1px] bg-neutral-800 my-3" />

          <View className="flex-row justify-between">
            <Text className="text-white text-lg font-bold">Total</Text>

            <Text className="text-white text-xl font-bold">
              ₹{totalPrice.toLocaleString("en-IN")}
            </Text>
          </View>

          <Pressable
            className="bg-white rounded-full py-4 mt-6 items-center"
            onPress={() => {}}
          >
            <Text className="text-black font-bold text-base">
              Proceed to Checkout
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
