import { api } from "../lib/axios";

export interface AnalyticsPeriod {
  start: string;
  end: string;
}

export const analyticsService = {
  getOverview: async (period = "30d") => {
    const response = await api.get(`/analytics/overview?period=${period}`);
    return response.data.data;
  },

  getTimeline: async (period = "7d", platform?: string) => {
    let url = `/analytics/timeline?period=${period}`;
    if (platform && platform !== "all") url += `&platform=${platform}`;
    const response = await api.get(url);
    return response.data.data;
  },

  getGrowth: async (period = "30d", platform?: string) => {
    let url = `/analytics/growth?period=${period}`;
    if (platform && platform !== "all") url += `&platform=${platform}`;
    const response = await api.get(url);
    return response.data.data;
  },

  getTopPosts: async (limit = 5, sortBy = "totalEngagement", platform?: string) => {
    let url = `/analytics/posts/top?limit=${limit}&sortBy=${sortBy}`;
    if (platform) url += `&platform=${platform}`;

    const response = await api.get(url);
    return response.data.data;
  },

  getPlatformPerformance: async (period = "30d") => {
    const response = await api.get(`/analytics/platforms?period=${period}`);
    return response.data.data;
  },

  getHeatmap: async () => {
    const response = await api.get(`/analytics/heatmap`);
    return response.data.data;
  },

  // Dashboard-specific methods
  getUpcomingPosts: async (limit = 3) => {
    const response = await api.get(
      `/posts?status=SCHEDULED&limit=${limit}&sortBy=scheduledAt&sortOrder=asc`,
    );
    return response.data.data;
  },

  getScheduledCount: async () => {
    const response = await api.get(`/posts?status=SCHEDULED&limit=1`);
    return response.data.data.total || 0;
  },
};
