import { create } from "zustand";

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

type CartStore = {
  items: CartItem[];

  addToCart: (product: Omit<CartItem, "quantity">) => void;
  removeFromCart: (id: string) => void;
  increaseQuantity: (id: string) => void;
  decreaseQuantity: (id: string) => void;
  clearCart: () => void;

  getTotalItems: () => number;
  getTotalPrice: () => number;
};

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],

  addToCart: (product) => {
    const existingItem = get().items.find((item) => item._id === product._id);

    if (existingItem) {
      set({
        items: get().items.map((item) =>
          item._id === product._id
            ? {
                ...item,
                quantity: Math.min(item.quantity + 1, item.stock),
              }
            : item,
        ),
      });

      return;
    }

    set({
      items: [
        ...get().items,
        {
          ...product,
          quantity: 1,
        },
      ],
    });
  },

  removeFromCart: (id) => {
    set({
      items: get().items.filter((item) => item._id !== id),
    });
  },

  increaseQuantity: (id) => {
    set({
      items: get().items.map((item) =>
        item._id === id
          ? {
              ...item,
              quantity: Math.min(item.quantity + 1, item.stock),
            }
          : item,
      ),
    });
  },

  decreaseQuantity: (id) => {
    set({
      items: get()
        .items.map((item) =>
          item._id === id
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    });
  },

  clearCart: () => {
    set({
      items: [],
    });
  },

  getTotalItems: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },

  getTotalPrice: () => {
    return get().items.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
  },
}));
