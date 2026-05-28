import Vue from "vue";
import Router from "vue-router";
import store from "../store";
import { getToken } from "../utils/auth";

import Login from "../views/user/Login.vue";
import MallLayout from "../layout/MallLayout.vue";
import AdminLayout from "../layout/AdminLayout.vue";
import Home from "../views/mall/Home.vue";
import ProductList from "../views/mall/ProductList.vue";
import ProductDetail from "../views/mall/ProductDetail.vue";
import Cart from "../views/mall/Cart.vue";
import Orders from "../views/mall/Orders.vue";
import Checkout from "../views/mall/Checkout.vue";
import UserCenter from "../views/user/UserCenter.vue";
import Addresses from "../views/user/Addresses.vue";
import AdminDashboard from "../views/admin/Dashboard.vue";
import AdminProducts from "../views/admin/Products.vue";
import AdminOrders from "../views/admin/Orders.vue";
import AdminUsers from "../views/admin/Users.vue";
import AdminReviews from "../views/admin/Reviews.vue";
import AdminBrands from "../views/admin/Brands.vue";
import AdminConsultations from "../views/admin/Consultations.vue";
import HomeConfig from "../views/admin/HomeConfig.vue";
import OperationLogs from "../views/admin/OperationLogs.vue";
import Register from "../views/user/Register.vue";
import ForgotPassword from "../views/user/ForgotPassword.vue";

const ProductListPage = () => import("../views/product/ProductList.vue");
const ProductDetailPage = () => import("../views/product/ProductDetail.vue");
const FavoritePage = () => import("../views/favorite/Favorite.vue");

Vue.use(Router);

const router = new Router({
  mode: "history",
  routes: [
    { path: "/", redirect: "/login" },
    { path: "/login", component: Login },
    { path: "/register", component: Register },
    { path: "/forgot-password", component: ForgotPassword },
    {
      path: "/product/list",
      redirect: to => ({ path: "/mall/products", query: to.query })
    },
    {
      path: "/product/detail/:id",
      redirect: to => ({ path: `/mall/product/${to.params.id}`, query: to.query })
    },
    { path: "/cart", redirect: "/mall/cart", meta: { auth: true } },
    { path: "/favorite", redirect: "/mall/favorites", meta: { auth: true } },
    {
      path: "/mall",
      component: MallLayout,
      children: [
        { path: "", component: Home },
        { path: "products", component: ProductList },
        { path: "product/:id", component: ProductDetail },
        { path: "checkout", component: Checkout, meta: { auth: true } },
        { path: "cart", component: Cart, meta: { auth: true } },
        { path: "orders", component: Orders, meta: { auth: true } },
        { path: "profile", component: UserCenter, meta: { auth: true } },
        { path: "addresses", component: Addresses, meta: { auth: true } },
        { path: "favorites", component: FavoritePage, meta: { auth: true } },
        { path: "brands", component: () => import("../views/mall/Brands.vue") },
        { path: "brand/:id", component: () => import("../views/mall/BrandDetail.vue") }
      ]
    },
    {
      path: "/admin",
      component: AdminLayout,
      meta: { auth: true, admin: true },
      children: [
        { path: "", component: AdminDashboard },
        { path: "products", component: AdminProducts },
        { path: "orders", component: AdminOrders },
        { path: "users", component: AdminUsers },
        { path: "reviews", component: AdminReviews },
        { path: "consultations", component: AdminConsultations },
        { path: "brands", component: AdminBrands },
        { path: "home-config", component: HomeConfig },
        { path: "operation-logs", component: OperationLogs }
      ]
    }
  ]
});

router.beforeEach((to, from, next) => {
  const token = getToken();
  const needAuth = to.matched.some(r => r.meta && r.meta.auth);
  const needAdmin = to.matched.some(r => r.meta && r.meta.admin);
  if (needAuth && !token) return next("/login");
  if (needAdmin && !store.getters.isAdmin) return next("/mall");
  if ((to.path === "/login" || to.path === "/register" || to.path === "/forgot-password") && token) {
    return next(store.getters.isAdmin ? "/admin" : "/mall");
  }
  return next();
});

export default router;
