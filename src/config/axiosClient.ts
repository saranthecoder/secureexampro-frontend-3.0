import axios from "axios";
import BASE_URL from "./api";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface TrafficNode {
  _id?: string;
  name: string;
  url: string;
  isPrimary?: boolean;
  isActive: boolean;
  status: string;
  responseTime?: number;
  cpuUsage?: number;
  memoryUsage?: number;
  weight?: number;
}

let trafficNodesCache: TrafficNode[] = [];

export const setTrafficNodesCache = (nodes: TrafficNode[]) => {
  trafficNodesCache = nodes;
};

export const getTrafficNodesCache = () => trafficNodesCache;

// Axios Interceptor for Automatic Node Failover
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response || [502, 503, 504].includes(error.response.status)) {
      const currentBase = axiosInstance.defaults.baseURL || BASE_URL;
      const fallbackNode = trafficNodesCache.find(
        (s) => s.isActive && s.status === "online" && s.url !== currentBase
      );

      if (fallbackNode) {
        const cleanBase = fallbackNode.url.endsWith("/api")
          ? fallbackNode.url
          : `${fallbackNode.url.replace(/\/$/, "")}/api`;

        console.warn(`[Traffic Manager] Node ${currentBase} down. Switching to fallback node: ${cleanBase}`);
        axiosInstance.defaults.baseURL = cleanBase;

        if (error.config) {
          error.config.baseURL = cleanBase;
          return axiosInstance(error.config);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
