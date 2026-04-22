"use client";

import { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const Axios = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
});

export const AxiosPost = async (apiname, body, method = "post") => {
  try {
    const { data } = await Axios.request({
      url: apiname,
      method: method.toLowerCase(),
      data: body,
    });
    return data;
  } catch (error) {
    console.error(`Error in Axios ${method}:`, error);
    throw error;
  }
};

export const AxiosGet = async (apiname) => {
  try {
    const { data } = await Axios.get(apiname);
    return data;
  } catch (error) {
    console.error("Error in AxiosGet:", error);
    throw error;
  }
};

export const AxiosPut = async (apiname, body) => {
  try {
    const { data } = await Axios.put(apiname, body);
    return data;
  } catch (error) {
    console.error("Error in AxiosPut:", error);
    throw error;
  }
};

export const AxiosDelete = async (apiname) => {
  try {
    const { data } = await Axios.delete(apiname);
    return data;
  } catch (error) {
    console.error("Error in AxiosDelete:", error);
    throw error;
  }
};

Axios.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

Axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      setUser(null);
      router.push("/");
      toast({
        variant: "destructive",
        title: "Session Expired",
        description: "Please log in again.",
      });
    }
    return Promise.reject(error);
  }
);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const loginUser = async ({ mobile_number, password }) => {
    setLoading(true);
    try {
      const formattedNumber = mobile_number.replace("+", "").trim();

      const { data } = await Axios.post("org/login/", {
        mobile_number: formattedNumber,
        password,
      });

      if (data.access) {
        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);
        localStorage.setItem("org_id", data.org_id);

        setUser({ mobile_number: formattedNumber, org_id: data.org_id });

        toast({
          title: "Login successful",
          description: "Redirecting to your dashboard...",
        });

        router.push("/dashboard");
        return { success: true };
      } else {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: "Invalid credentials",
        });
        return { success: false };
      }
    } catch (err) {
      console.error("Axios Error:", err.response?.data || err.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Server error, please try again later.",
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async ({ name, mobile_number }) => {
    try {
      const formattedNumber = mobile_number.replace("+", "").trim();

      const { data } = await Axios.post("org/signup/", {
        name,
        mobile_number: formattedNumber,
      });

      if (data.generated_password) {
        return { success: true, generated_password: data.generated_password };
      } else {
        return {
          success: false,
          message: data?.error || "Registration failed",
        };
      }
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "An error occurred during registration",
      };
    }
  };

  const loggedInCheck = async () => {
    const accessToken = localStorage.getItem("access_token");

    if (!accessToken) {
      setUser(null);
      setLoading(false);
      setAuthChecked(true);
      router.push("/");
      return;
    }

    try {
      const { data } = await Axios.get("employee-details/");
      if (data.user_id) {
        const formattedNumber = data.mobile_number.replace("+", "").trim();
        setUser({ mobile_number: formattedNumber, org_id: data.org_id });
      } else {
        localStorage.clear();
        setUser(null);
        router.push("/");
      }
    } catch (error) {
      console.error("Error checking login status:", error);
      localStorage.clear();
      setUser(null);
      router.push("/");
    } finally {
      setLoading(false);
      setAuthChecked(true);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      loggedInCheck();
    }
  }, [router]); // Re-run on route changes

  useEffect(() => {
    if (typeof window !== "undefined") {
      loggedInCheck();
    }
  }, []);

  const logoutUser = async () => {
    const accessToken = localStorage.getItem("access_token");

    try {
      if (accessToken) {
        await AxiosPost("org/logout/", { token: accessToken });
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        variant: "destructive",
        title: "Logout Error",
        description:
          "Failed to invalidate session on server. Forcing logout anyway.",
      });
    } finally {
      // Clear client-side session
      localStorage.clear();
      setUser(null);
      setAuthChecked(false); // Reset auth check to force revalidation

      // Redirect to login page
      router.push("/");
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    }
  };

  const accessToken =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const refreshToken =
    typeof window !== "undefined"
      ? localStorage.getItem("refresh_token")
      : null;
  const orgId =
    typeof window !== "undefined" ? localStorage.getItem("org_id") : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        loginUser,
        logoutUser,
        registerUser,
        AxiosPost,
        AxiosGet,
        AxiosPut,
        AxiosDelete,
        accessToken,
        refreshToken,
        orgId,
        loading,
        authChecked,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
