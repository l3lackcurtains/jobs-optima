import axios from "axios";
import { getSession, signOut } from "next-auth/react";
import { toast } from "sonner";

// Browser calls go through the Next.js proxy rewrite (/api/proxy → internal backend).
// This keeps the backend off the public internet and avoids CORS issues.
const API_BASE_URL = "/api/proxy";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(async (config) => {
  if (typeof window !== "undefined") {
    const session = await getSession();
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        await signOut({ redirect: false });
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    // Surface AI access / credit / rate-limit errors with a user-friendly toast.
    // Backend returns: { code: 'INSUFFICIENT_CREDITS' | 'DAILY_LIMIT_REACHED' | 'NO_AI_ACCESS', message, resetsAt? }
    if (typeof window !== "undefined") {
      const data = error.response?.data;
      const code: string | undefined = data?.code ?? data?.message?.code;
      const message: string | undefined = data?.message?.message ?? data?.message;
      if (code === "INSUFFICIENT_CREDITS") {
        toast.error(message || "You're out of AI credits.", {
          action: {
            label: "Add API key",
            onClick: () => {
              window.location.href = "/settings";
            },
          },
        });
      } else if (code === "DAILY_LIMIT_REACHED") {
        toast.error(message || "Daily AI limit reached. Try again in 24 hours.");
      } else if (code === "NO_AI_ACCESS") {
        toast.error(message || "AI access not configured.", {
          action: {
            label: "Set up AI",
            onClick: () => {
              window.location.href = "/settings";
            },
          },
        });
      } else if (
        code === "INVALID_AI_PROVIDER" ||
        code === "INVALID_AI_MODEL" ||
        code === "PROVIDER_REQUIRED"
      ) {
        toast.error(message || "Invalid AI provider or model selection.");
      }
    }

    return Promise.reject(error);
  },
);
