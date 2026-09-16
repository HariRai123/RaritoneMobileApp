import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type CartItem = {
  _id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  brand: string;
  stock: number;
  quantity: number;
};

type AddToCartProduct = Omit<CartItem, "quantity"> & {
  quantity?: number;
};

type CartStore = {
  items: CartItem[];

  addToCart: (product: AddToCartProduct) => void;

  removeFromCart: (id: string) => void;

  increaseQuantity: (id: string) => void;

  decreaseQuantity: (id: string) => void;

  setQuantity: (id: string, quantity: number) => void;

  clearCart: () => void;

  getTotalItems: () => number;

  getTotalPrice: () => number;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      /* =================================================
           ADD TO CART
        ================================================= */

      addToCart: (product) => {
        const requestedQuantity = Math.max(
          1,
          Math.floor(Number(product.quantity ?? 1)),
        );

        const existingItem = get().items.find(
          (item) => item._id === product._id,
        );

        if (existingItem) {
          const nextQuantity = Math.min(
            existingItem.quantity + requestedQuantity,
            existingItem.stock,
          );

          set({
            items: get().items.map((item) =>
              item._id === product._id
                ? {
                    ...item,
                    ...product,
                    quantity: nextQuantity,
                  }
                : item,
            ),
          });

          return;
        }

        const initialQuantity = Math.min(
          requestedQuantity,
          Math.max(1, Number(product.stock)),
        );

        set({
          items: [
            ...get().items,
            {
              ...product,
              quantity: initialQuantity,
            },
          ],
        });
      },

      /* =================================================
           REMOVE
        ================================================= */

      removeFromCart: (id) => {
        set({
          items: get().items.filter((item) => item._id !== id),
        });
      },

      /* =================================================
           INCREASE
        ================================================= */

      increaseQuantity: (id) => {
        set({
          items: get().items.map((item) => {
            if (item._id !== id) {
              return item;
            }

            const nextQuantity = Math.min(
              item.quantity + 1,
              Math.max(1, item.stock),
            );

            return {
              ...item,
              quantity: nextQuantity,
            };
          }),
        });
      },

      /* =================================================
           DECREASE
        ================================================= */

      decreaseQuantity: (id) => {
        set({
          items: get()
            .items.map((item) => {
              if (item._id !== id) {
                return item;
              }

              return {
                ...item,
                quantity: item.quantity - 1,
              };
            })
            .filter((item) => item.quantity > 0),
        });
      },

      /* =================================================
           SET QUANTITY
        ================================================= */

      setQuantity: (id, quantity) => {
        set({
          items: get()
            .items.map((item) => {
              if (item._id !== id) {
                return item;
              }

              const safeQuantity = Math.max(
                0,
                Math.min(Math.floor(Number(quantity)), Math.max(0, item.stock)),
              );

              return {
                ...item,
                quantity: safeQuantity,
              };
            })
            .filter((item) => item.quantity > 0),
        });
      },

      /* =================================================
           CLEAR
        ================================================= */

      clearCart: () => {
        set({
          items: [],
        });
      },

      /* =================================================
           TOTAL ITEMS
        ================================================= */

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      /* =================================================
           TOTAL PRICE
        ================================================= */

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0,
        );
      },
    }),

    /* ===================================================
         PERSISTENCE
      =================================================== */

    {
      name: "raritone-cart",

      storage: createJSONStorage(() => AsyncStorage),

      partialize: (state) => ({
        items: state.items,
      }),
    },
  ),
);
