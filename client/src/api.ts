/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ApiResponse } from "./types";

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE ||
  "https://paylater-be-657638641053.us-central1.run.app/api";

function setToken(token: string) {
  localStorage.setItem("paylater_token", token);
}

function getToken(): string | null {
  return localStorage.getItem("paylater_token");
}

function clearToken() {
  localStorage.removeItem("paylater_token");
  localStorage.removeItem("paylater_session");
  localStorage.removeItem("paylater_phone_number");
  localStorage.removeItem("paylater_name");
}

export class PayLaterAPI {
  // Register user (no OTP required)
  static async registerUser(
    phoneNumber: string,
    name: string
  ): Promise<ApiResponse<{ token: string; session: any }>> {
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, name }),
      });

      const data = await response.json();

      if (data.success && data.data?.token) {
        setToken(data.data.token);
        const gameSession = {
          userId: data.data.session?.userId || data.data.userId,
          startTime: Date.now(),
        };
        localStorage.setItem("paylater_session", JSON.stringify(gameSession));
        localStorage.setItem("paylater_phone_number", phoneNumber);
        localStorage.setItem("paylater_name", name);

        return {
          success: true,
          data: {
            token: data.data.token,
            session: gameSession,
          },
        };
      } else {
        return {
          success: false,
          error: data.message || "Failed to register",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: "Network error. Please try again.",
      };
    }
  }

  // Scan QR code for game
  static async scanQRCode(
    qrCode: string,
    activityType: "game" | "photo"
  ): Promise<ApiResponse<any>> {
    try {
      const token = getToken();
      if (!token) {
        return {
          success: false,
          error: "No authentication token found",
        };
      }

      const response = await fetch(`${API_BASE}/scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ qrCode, activityType }),
      });

      const data = await response.json();

      if (response.status === 401 || data.error?.includes("token") || data.message?.includes("token")) {
        clearToken();
        return {
          success: false,
          error: "Session expired. Please register again.",
        };
      }

      // If response is not successful, ensure error field is set
      if (!data.success && !data.error && data.message) {
        data.error = data.message;
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: "Failed to scan QR code",
      };
    }
  }

  // Get user's redemption QR code
  static async getUserQRCode(): Promise<ApiResponse<{
    redemptionQRCode: string;
    isRedeemed: boolean;
    redeemedAt: string | null;
    gameProgress: any;
  }>> {
    try {
      const token = getToken();
      if (!token) {
        return {
          success: false,
          error: "No authentication token found",
        };
      }

      const response = await fetch(`${API_BASE}/user/qr-code`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.status === 401 || data.error?.includes("token")) {
        clearToken();
        return {
          success: false,
          error: "Session expired. Please register again.",
        };
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: "Failed to get QR code",
      };
    }
  }

  // Get user progress
  static async getProgress(): Promise<ApiResponse<any>> {
    try {
      const token = getToken();
      if (!token) {
        return {
          success: false,
          error: "No authentication token found",
        };
      }

      const response = await fetch(`${API_BASE}/scan/progress`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.status === 401 || data.error?.includes("token")) {
        clearToken();
        return {
          success: false,
          error: "Session expired. Please register again.",
        };
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: "Failed to get progress",
      };
    }
  }

  // Admin: Login
  static async adminLogin(password: string): Promise<ApiResponse<{ authenticated: boolean }>> {
    try {
      const response = await fetch(`${API_BASE}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("adminAuthenticated", "true");
        localStorage.setItem("adminLoginTime", Date.now().toString());
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: "Network error. Please try again.",
      };
    }
  }

  // Admin: Get users
  static async adminGetUsers(page: number = 1, search: string = ""): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE}/admin/users?page=${page}&search=${encodeURIComponent(search)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: "Failed to get users",
      };
    }
  }

  // Admin: Scan QR code
  static async adminScanQR(qrCode: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE}/admin/scan-qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCode }),
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: "Failed to scan QR code",
      };
    }
  }

  // Admin: Get statistics
  static async adminGetStatistics(): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE}/admin/statistics`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: "Failed to get statistics",
      };
    }
  }

  // Logout
  static async logout() {
    try {
      clearToken();
    } catch (error) {
      // Silent fail
    }
  }
}

