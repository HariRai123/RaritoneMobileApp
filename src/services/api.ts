import axios from "axios";

const API_URL = "https://raritone-fullstack.onrender.com/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    Accept: "application/json",
  },
});

export default api;
