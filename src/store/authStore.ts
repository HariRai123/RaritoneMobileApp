import { create } from "zustand";

export type User = {
  id: string;
  firebaseUid: string;
  name: string;
  email?: string;
  phone?: string;
  role: "user" | "admin" | "vendor";
  profileImage?: string;
  provider: "password" | "google" | "phone";
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type AuthStore = {
  user: User | null;
  isLoading: boolean;

  setUser: (user: User) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,

  isLoading: true,

  setUser: (user) =>
    set({
      user,
      isLoading: false,
    }),

  clearUser: () =>
    set({
      user: null,
      isLoading: false,
    }),

  setLoading: (loading) =>
    set({
      isLoading: loading,
    }),

  logout: () =>
    set({
      user: null,
      isLoading: false,
    }),
}));
