import { create } from "zustand";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  profileImage?: string;
};

type AuthStore = {
  token: string | null;
  user: User | null;

  setAuth: (token: string, user: User) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  token: null,
  user: null,

  setAuth: (token, user) => {
    set({
      token,
      user,
    });
  },

  logout: () => {
    set({
      token: null,
      user: null,
    });
  },
}));
