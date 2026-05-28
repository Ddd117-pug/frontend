import request from "./request";

export const statsApi = {
  adminStatsOverview() { return request.get("/admin/stats/overview"); },
  adminStatsTrend() { return request.get("/admin/stats/trend7d"); },
  adminOrderStatusStats() { return request.get("/admin/stats/order-status"); },
  adminBrandSalesRank() { return request.get("/admin/stats/brand-sales"); },
  adminHotProductRank() { return request.get("/admin/stats/hot-products"); }
};
