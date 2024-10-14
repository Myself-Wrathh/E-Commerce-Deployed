import { create } from "zustand";
import axios from "../lib/axios.js";
import { toast } from "react-hot-toast";

export const useUserStore = create((set) => ({
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
}));
