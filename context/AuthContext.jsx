"use client";

import { createContext, useState, useEffect, useContext, useCallback } from "react";
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

// All API calls go to the FastAPI backend.
export const FastAPI = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_FASTAPI_URL ||
    "http://127.0.0.1:8002/api/v1/",
});

// Origin of the API (no /api/v1), used for /media/... photo URLs.
export const API_ORIGIN = new URL(FastAPI.defaults.baseURL).origin;

export const mediaUrl = (path) => {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
};


const attachAccessToken = (config) => {
  if (typeof window !== "undefined") {
    const hasExplicitAuth =
      config.headers?.Authorization ||
      config.headers?.authorization;

    const token = localStorage.getItem("access_token");

    if (token && !hasExplicitAuth) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
};


FastAPI.interceptors.request.use(attachAccessToken, (error) =>
  Promise.reject(error)
);

// FastAPI errors put the message in `detail`, which may be a string, an
// object (e.g. {message, ...}) or a list (422 validation errors).
export const apiErrorMessage = (error, fallback = "Something went wrong.") => {
  if (error && !error.response && error.request) {
    return "Server unreachable. Check your Wi-Fi and Firewall.";
  }
  const data = error?.response?.data;
  const detail = data?.detail ?? data?.error ?? data?.message;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => d?.msg || String(d)).join(", ") || fallback;
  }
  if (detail && typeof detail === "object") {
    return detail.message || detail.error || fallback;
  }
  return fallback;
};

// Admin and member sessions share the same localStorage token, so the role
// decides which part of the app a token may use.
const ADMIN_PATHS = [
  "/dashboard",
  "/attendance",
  "/designation",
  "/department",
  "/employees",
  "/org-chart",
  "/tasks",
  "/geolocation",
  "/shifts",
];
const MEMBER_PATHS = ["/member"];
// A 401 on these pages is a failed login, not an expired session.
const PUBLIC_AUTH_PATHS = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/member-login",
];

const matchesPath = (path, prefixes) =>
  prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

const clearSession = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("org_id");
  localStorage.removeItem("user_id");
  localStorage.removeItem("user_mobile");
  localStorage.removeItem("user_role");
};

export const FastAPIGet = async (apiname) => {
  try {
    const { data } = await FastAPI.get(apiname);
    return data;
  } catch (error) {
    console.error("Error in FastAPIGet:", error);
    throw error;
  }
};

export const FastAPIPost = async (apiname, body) => {
  try {
    const { data } = await FastAPI.post(apiname, body);
    return data;
  } catch (error) {
    console.error("Error in FastAPIPost:", error);
    throw error;
  }
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error) => {
      const path =
        typeof window !== "undefined" ? window.location.pathname : "";
      const isEmbedded =
        typeof window !== "undefined" && window.self !== window.top;
      const isLoginPage = PUBLIC_AUTH_PATHS.includes(path);
      const status = error.response?.status;

      // Only a 401 indicates an invalid/expired credential. A 404 or 500
      // must not clear the user's session.
      if (status === 401 && !isLoginPage && !isEmbedded) {
        clearSession();
        setUser(null);
        router.push(matchesPath(path, MEMBER_PATHS) ? "/member-login" : "/");
        toast({
          variant: "destructive",
          title: "Session Expired",
          description: "Please log in again.",
        });
      }

      // A member token reached an organization-only endpoint (e.g. the
      // admin pages were open while a member logged in). Send the member
      // back to their portal instead of leaving the page half-loaded.
      if (
        status === 403 &&
        error.response?.data?.detail === "Organization access required" &&
        !isEmbedded &&
        matchesPath(path, ADMIN_PATHS)
      ) {
        localStorage.setItem("user_role", "employee");
        router.replace("/member");
      }

      return Promise.reject(error);
    };

    const fastApiInterceptor = FastAPI.interceptors.response.use(
      (response) => response,
      handleError
    );

    return () => {
      FastAPI.interceptors.response.eject(fastApiInterceptor);
    };
  }, [router, toast]);

  const loginUser = async ({ mobile_number, password }) => {
    setLoading(true);
    try {
      const formattedNumber = mobile_number.replace("+", "").trim();
      const { data } = await FastAPI.post("org/login", {
        mobile_number: formattedNumber,
        password,
      });

      if (data.access) {
        localStorage.setItem("access_token", data.access);
        if (data.refresh) localStorage.setItem("refresh_token", data.refresh);
        // Drop any member session left in this browser.
        localStorage.removeItem("user_id");
        if (data.org_id != null) localStorage.setItem("org_id", data.org_id);
        localStorage.setItem("user_role", data.role || "organization");
        localStorage.setItem("user_mobile", formattedNumber);
        setUser({
          mobile_number: formattedNumber,
          org_id: data.org_id,
          role: data.role || "organization",
        });

        toast({
          title: "Login successful",
          description: "Redirecting to your dashboard...",
        });
        return { success: true };
      }

      toast({
        variant: "destructive",
        title: "Login failed",
        description: "Invalid credentials",
      });
      return { success: false };
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      const errorMessage = apiErrorMessage(err, "Invalid credentials");

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

  
const loginMember = async ({
  mobile_number,
  session_id,
  pre_auth_token,
}) => {
  setLoading(true);

  try {
    const formattedNumber = mobile_number.replace(/\D/g, "").slice(-10);

    if (!session_id || !pre_auth_token) {
      return {
        success: false,
        message: "Face verification session is missing. Please try again.",
      };
    }

    const { data } = await FastAPI.post(
      "member/login/complete",
      { session_id },
      {
        headers: {
          Authorization: `Bearer ${pre_auth_token}`,
        },
      }
    );

    if (!data.access_token || !data.refresh_token) {
      return {
        success: false,
        message: "Login could not be completed. Please try again.",
      };
    }

    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    localStorage.removeItem("org_id");

    if (data.user_id != null) {
      localStorage.setItem("user_id", String(data.user_id));
    }

    localStorage.setItem("user_role", "employee");
    localStorage.setItem("user_mobile", formattedNumber);

    const profile = data.profile || {};
    const userName = profile.first_name
      ? `${profile.first_name} ${profile.last_name || ""}`.trim()
      : null;

    setUser({
      mobile_number: formattedNumber,
      user_id: data.user_id,
      role: "employee",
      name: userName,
      profile,
    });

    toast({
      title: "Member login successful",
      description: `Welcome back, ${userName || "Member"}`,
    });

    return {
      success: true,
      is_registered: data.is_registered,
    };
  } catch (err) {
    const serverError = apiErrorMessage(
      err,
      "Unable to complete member login."
    );

    toast({
      variant: "destructive",
      title: "Login failed",
      description: serverError,
    });

    return {
      success: false,
      message: serverError,
    };
  } finally {
    setLoading(false);
  }
};


  const registerUser = async ({ name, mobile_number, email }) => {
    try {
      const formattedNumber = mobile_number.replace("+", "").trim();
      const { data } = await FastAPI.post("org/signup", {
        name,
        mobile_number: formattedNumber,
        email,
      });

      if (data.generated_password) {
        return { success: true, generated_password: data.generated_password };
      }
      return {
        success: false,
        message: data?.error || "Registration failed",
      };
    } catch (error) {
      return {
        success: false,
        message: apiErrorMessage(
          error,
          "An error occurred during registration"
        ),
      };
    }
  };

  const loggedInCheck = useCallback(async () => {
    if (typeof window === "undefined") return;

    const accessToken = localStorage.getItem("access_token");
    const path = window.location.pathname;
    const isEmbedded = window.self !== window.top;
    const isPublicPath =
      PUBLIC_AUTH_PATHS.includes(path) ||
      matchesPath(path, ["/member", "/dashboard2", "/profile", "/verify", "/about"]);

    if (!accessToken) {
      setUser(null);
      setLoading(false);
      setAuthChecked(true);
      if (!isPublicPath && !isEmbedded) router.push("/");
      return;
    }

    try {
      // This endpoint is served by FastAPI. Do not call Django's old
      // /api/employee-details/ route here: it returns 404 after migration.
      const { data } = await FastAPI.get("auth/verify");

      const mobileNumber =
        data.mobile_number ||
        localStorage.getItem("user_mobile") ||
        "";

      const role =
        data.role ||
        (data.is_organization === false ? "employee" : null) ||
        localStorage.getItem("user_role");
      if (role) localStorage.setItem("user_role", role);

      const orgId = role === "employee" ? null : localStorage.getItem("org_id");
      const userId = localStorage.getItem("user_id");

      setUser((previousUser) => ({
        ...(previousUser || {}),
        mobile_number: mobileNumber.replace("+", "").trim(),
        ...(role ? { role } : {}),
        ...(orgId ? { org_id: orgId } : {}),
        ...(userId ? { user_id: userId } : {}),
      }));

      // A member token cannot use the organization endpoints (they return
      // 403), and an organization account has no employee profile.
      if (!isEmbedded) {
        if (role === "employee" && matchesPath(path, ADMIN_PATHS)) {
          router.replace("/member");
        } else if (role === "organization" && matchesPath(path, MEMBER_PATHS)) {
          router.replace("/dashboard");
        }
      }
    } catch (error) {
      console.error(
        "Error checking login status with FastAPI:",
        error.response?.data || error.message
      );

      // Do not clear credentials for a missing endpoint/server error.
      // A 401 means the token is invalid/expired; other failures may be
      // temporary or indicate a deployment/configuration issue.
      if (error.response?.status === 401) {
        clearSession();
        setUser(null);
        if (!isPublicPath && !isEmbedded) router.push("/");
      } else {
        const orgId = localStorage.getItem("org_id");
        const userId = localStorage.getItem("user_id");
        const mobileNumber = localStorage.getItem("user_mobile") || "";

        // Keep the session state while the verification endpoint is
        // temporarily unavailable, but log the error for diagnosis.
        setUser((previousUser) => ({
          ...(previousUser || {}),
          mobile_number: mobileNumber.replace("+", "").trim(),
          ...(orgId ? { org_id: orgId } : {}),
          ...(userId ? { user_id: userId } : {}),
        }));
      }
    } finally {
      setLoading(false);
      setAuthChecked(true);
    }
  }, [router]);

  useEffect(() => {
    loggedInCheck();
  }, [loggedInCheck]);

  const logoutUser = async () => {
    // Revoke this browser's refresh tokens on the server. Fire and forget:
    // signing out locally must not wait on, or fail with, the network.
    const storedRefresh = localStorage.getItem("refresh_token");
    if (storedRefresh) {
      FastAPI.post("auth/logout", { refresh: storedRefresh }).catch(() => {});
    }

    clearSession();

    setUser(null);
    setAuthChecked(false);
    setLoading(false);

    router.push("/");

    toast({
      title: "Logged out",
      description: "You have been logged out.",
    });
  };

  const accessToken =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;
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
        FastAPIGet,
        FastAPIPost,
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
