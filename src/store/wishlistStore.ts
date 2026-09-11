import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type WishlistProduct = {
  _id: string;
  productId?: string;
  name: string;
  price: number;
  image: string;
  brand?: string;
  stock?: number;
  discount?: number;
};

type WishlistState = {
  items: WishlistProduct[];

  isWishlisted: (productId: string) => boolean;

  addToWishlist: (product: WishlistProduct) => void;

  removeFromWishlist: (productId: string) => void;

  toggleWishlist: (product: WishlistProduct) => void;

  clearWishlist: () => void;

  getTotalWishlistItems: () => number;
};

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      isWishlisted: (productId) => {
        return get().items.some((item) => item._id === productId);
      },

      addToWishlist: (product) => {
        set((state) => {
          const alreadyExists = state.items.some(
            (item) => item._id === product._id,
          );

          if (alreadyExists) {
            return state;
          }

          return {
            items: [...state.items, product],
          };
        });
      },

      removeFromWishlist: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item._id !== productId),
        }));
      },

      toggleWishlist: (product) => {
        const exists = get().isWishlisted(product._id);

        if (exists) {
          get().removeFromWishlist(product._id);
        } else {
          get().addToWishlist(product);
        }
      },

      clearWishlist: () => {
        set({
          items: [],
        });
      },

      getTotalWishlistItems: () => {
        return get().items.length;
      },
    }),
    {
      name: "raritone-wishlist",

      storage: createJSONStorage(() => AsyncStorage),

      partialize: (state) => ({
        items: state.items,
      }),
    },
  ),
);
