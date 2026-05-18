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
  baseURL: `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001'}/api/`,
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

// Moved interceptors inside the component to access hooks

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const interceptor = Axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // If we are already on a login page, don't trigger global redirect/clear
          const path = typeof window !== "undefined" ? window.location.pathname : "";
          const isEmbedded = typeof window !== "undefined" && window.self !== window.top;
          if (path !== "/" && path !== "/member-login" && !isEmbedded) {
            localStorage.clear();
            setUser(null);
            router.push("/");
            toast({
              variant: "destructive",
              title: "Session Expired",
              description: "Please log in again.",
            });
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      Axios.interceptors.response.eject(interceptor);
    };
  }, [router, toast]);

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

        //router.push("/dashboard");
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
      let errorMessage = "Invalid credentials";
      if (!err.response) {
        errorMessage = "Server unreachable. Check your Wi-Fi and Firewall.";
      } else if (err.response.data?.error) {
        errorMessage = err.response.data.error;
      }
      
      toast({
        variant: "destructive",
        title: "Login failed",
        description: errorMessage,
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const loginMember = async ({ mobile_number, password }) => {
    setLoading(true);
    try {
      const formattedNumber = mobile_number.replace("+", "").trim();

      const { data } = await Axios.post("member/login/", {
        mobile_number: formattedNumber,
        password,
      });

      if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        localStorage.setItem("user_id", data.user_id);
        localStorage.setItem("user_mobile", formattedNumber);

        const profile = data.profile || {};
        const userName = profile.first_name ? `${profile.first_name} ${profile.last_name || ''}` : null;

        setUser({ 
          mobile_number: formattedNumber, 
          user_id: data.user_id,
          name: userName,
          profile: profile
        });

        toast({
          title: "Member Login successful",
          description: `Welcome back, ${userName || 'Member'}`,
        });

        return { success: true, is_registered: data.is_registered };
      } else {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: data.error || "Invalid credentials",
        });
        return { success: false };
      }
    } catch (err) {
      console.error("Axios Error:", err.response?.data || err.message);
      let serverError = "Invalid credentials";
      if (!err.response) {
        serverError = "Server unreachable. Check your Wi-Fi and Firewall.";
      } else if (err.response.data?.error) {
        serverError = err.response.data.error;
      }

      toast({
        variant: "destructive",
        title: "Login failed",
        description: serverError,
      });
      return { success: false, message: serverError };
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async ({ name, mobile_number, email }) => {
    try {
      const formattedNumber = mobile_number.replace("+", "").trim();

      const { data } = await Axios.post("org/signup/", {
        name,
        mobile_number: formattedNumber,
        email,
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
      
      // Allow access to /member, /dashboard2, and /profile without redirecting to login for now
      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        if (path === "/member" || path === "/member-login" || path === "/dashboard2" || path === "/profile" || path === "/reset-password" || window.self !== window.top) {
          setLoading(false);
          setAuthChecked(true);
          return;
        }
      }
      
      router.push("/");
      return;
    }

    try {
      const { data } = await Axios.get("employee-details/");
      if (data.user_id) {
        const formattedNumber = data.mobile_number ? data.mobile_number.replace("+", "").trim() : "";
        const profile = data.profile || {};
        const userName = profile.first_name ? `${profile.first_name} ${profile.last_name || ''}` : null;
        
        setUser({ 
          mobile_number: formattedNumber, 
          org_id: data.org_id,
          user_id: data.user_id,
          name: userName,
          profile: profile
        });
      } else {
        localStorage.clear();
        setUser(null);
        if (typeof window !== "undefined") {
          const path = window.location.pathname;
          if (path === "/member" || path === "/member-login" || path === "/dashboard2" || path === "/profile" || path === "/reset-password" || window.self !== window.top) {
            return;
          }
        }
        router.push("/");
      }
    } catch (error) {
      console.error("Error checking login status:", error);
      localStorage.clear();
      setUser(null);
      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        if (path === "/member" || path === "/member-login" || path === "/dashboard2" || path === "/profile" || path === "/reset-password" || window.self !== window.top) {
          return;
        }
      }
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
        loginMember,
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
