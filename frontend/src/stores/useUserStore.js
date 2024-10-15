import { create } from "zustand";
import axios from "../lib/axios.js";
import { toast } from "react-hot-toast";

export const useUserStore = create((set,get) => ({
  user: null,
  loading: false,
  checkingAuth: true,

  signup: async ({ name, email, password, confirmPassword }) => {
    set({ loading: true });

    if (password != confirmPassword) {
      set({ loading: false });
      return toast.error("Passwords doesn't match.");
    }
    if (password.length < 6) {
      set({ loading: false });
      return toast.error("Password should contain atleast 6 characters.");
    }
    if (password.length > 15) {
      set({ loading: false });
      return toast.error("Password should be less than 15 characters.");
    }
    try {
      const res = await axios.post("/auth/signup", { name, email, password });
      set({ user: res.data, loading: false });
      toast.success("SignUp SuccessFul, Welcome to our Store 😊");
    } catch (error) {
      set({ loading: false });
      return toast.error(error.response.data.message || "An Error Occured.");
    } finally {
      set({ loading: false });
    }
  },
  login: async (email, password) => {
    set({ loading: true });
    if (email == "" || password == "") {
      set({ loading: false });
      return toast.error("Missing Credentails.");
    }
    try {
      const res = await axios.post("/auth/login", { email, password });
      const data = await res.data;
      set({ loading: false, user: res.data });
      toast.success("Login Successful");
    } catch (error) {
      set({ loading: false });
      return toast.error(error.response.data.message || "An Error Occured.");
    } finally {
      set({ loading: false });
    }
  },
  logout: async () => {
    try {
      await axios.post("/auth/logout");
      set({ user: null });
    } catch (error) {
      toast.error("Error logging out");
    }
  },
  checkAuth: async () => {
    set({ checkingAuth: true });
    try {
      const res = await axios.get("/auth/profile");
      set({ user: res.data, checkingAuth: false });
    } catch (error) {
      set({ checkingAuth: false, user: null });
    }
  },
  refreshToken: async () => {
    if (get().checkingAuth) return;
    set({ checkingAuth: true });
    try {
      const response = await axios.post("/auth/refresh-token");
      set({ checkingAuth: false });
      return response.data;
    } catch (error) {
      set({ user: null, checkingAuth: false });
      throw error;
    }
  },
}));

// Axios Interceptors for refreshing the access token every 15 mins

let refreshPromise = null;

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        if (refreshPromise) {
          await refreshPromise;
          return axios(originalRequest);
        }
        refreshPromise = useUserStore.getState().refreshToken();
        await refreshPromise;
        refreshPromise = null;
        return axios(originalRequest);
      } catch (refreshError) {
        useUserStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
