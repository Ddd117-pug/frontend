import axios from "axios";
import { Message } from "element-ui";
import { clearAuth, getToken } from "../utils/auth";

const service = axios.create({
  baseURL: "/api",
  timeout: 15000
});

service.interceptors.request.use(config => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

service.interceptors.response.use(
  response => {
    const res = response.data || {};
    if (res.code === 0) return res.data;
    Message.error(res.message || "请求失败");
    return Promise.reject(new Error(res.message || "Request failed"));
  },
  error => {
    const status = error?.response?.status;
    if (status === 401) {
      clearAuth();
      Message.error("登录已失效，请重新登录");
      window.location.href = "/login";
    } else {
      Message.error(error.message || "网络错误");
    }
    return Promise.reject(error);
  }
);

export default service;

