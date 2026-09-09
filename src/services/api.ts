import axios from "axios";

import { auth } from "../config/firebase";

const API_URL = "https://raritone-fullstack.onrender.com/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,

  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;

    if (user) {
      const token = await user.getIdToken();

      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  },
);

export default api;
