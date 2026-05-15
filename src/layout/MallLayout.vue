<template>
  <div>
    <el-header height="74px" class="mall-header">
      <div class="container topbar">
        <div class="logo" @click="$router.push('/mall')">
          <div class="logo-badge">T</div>
          <div class="logo-text">
            <div class="logo-cn">潮玩商城</div>
            <div class="logo-en">TOY POP UNIVERSE</div>
          </div>
        </div>

        <div class="nav-main">
          <button class="nav-pill" :class="{ active: isActive('/mall') }" @click="$router.push('/mall')">首页</button>
          <button class="nav-pill" :class="{ active: isActive('/mall/products') }" @click="$router.push('/mall/products')">
            <span>商品</span>
            <span v-if="productNavSubLabel" class="nav-pill-sub">/ {{ productNavSubLabel }}</span>
          </button>
          <button class="nav-pill" :class="{ active: isActive('/mall/brands') }" @click="$router.push('/mall/brands')">品牌馆</button>
          <button class="nav-pill" :class="{ active: isActive('/mall/favorites') || isActive('/favorite') }" @click="$router.push('/mall/favorites')">收藏</button>
          <button class="nav-pill" :class="{ active: isActive('/mall/cart') }" @click="$router.push('/mall/cart')">
            <el-badge :value="cartCount" :hidden="!cartCount" class="cart-badge">购物车</el-badge>
          </button>
          <button class="nav-pill" :class="{ active: isActive('/mall/orders') }" @click="$router.push('/mall/orders')">订单</button>
          <button class="nav-pill" :class="{ active: isActive('/mall/profile') || isActive('/mall/addresses') }" @click="$router.push('/mall/profile')">个人中心</button>
          <button v-if="isAdmin" class="nav-pill nav-pill-admin" :class="{ active: isActive('/admin') }" @click="$router.push('/admin')">后台管理</button>
        </div>

        <div class="nav-actions">
          <el-input
            v-model="keyword"
            size="mini"
            clearable
            placeholder="搜索商品"
            class="search-input"
            @keyup.enter.native="goSearch"
          >
            <el-button slot="append" icon="el-icon-search" :loading="searchLoading" @click="goSearch"></el-button>
          </el-input>
          <el-button v-if="!isLogin" size="mini" class="auth-btn" @click="$router.push('/login')">登录</el-button>
          <el-button v-else size="mini" class="logout-btn" @click="logout">退出</el-button>
        </div>
      </div>
    </el-header>
    <div class="container page-body">
      <router-view />
    </div>
  </div>
</template>

<script>
import { api } from "../api";
import { getProductCategoryLabel, normalizeProductCategoryTab } from "../utils/productCategoryTabs";

export default {
  data() {
    return {
      keyword: "",
      cartCount: 0,
      searchLoading: false
    };
  },
  computed: {
    isLogin() {
      return this.$store.getters.isLogin;
    },
    isAdmin() {
      return this.$store.getters.isAdmin;
    },
    productNavSubLabel() {
      if (!this.isActive('/mall/products')) return "";
      const tab = normalizeProductCategoryTab(this.$route.query.tab);
      return getProductCategoryLabel(tab);
    }
  },
  watch: {
    "$route.query.keyword": {
      immediate: true,
      handler(value) {
        this.keyword = value || "";
      }
    },
    isLogin: {
      immediate: true,
      handler() {
        this.loadCartCount();
      }
    }
  },
  created() {
    this.$root.$on("cart-updated", this.loadCartCount);
  },
  beforeDestroy() {
    this.$root.$off("cart-updated", this.loadCartCount);
  },
  methods: {
    isActive(path) {
      if (path === "/mall") {
        return this.$route.path === "/mall";
      }
      return this.$route.path.startsWith(path);
    },
    async loadCartCount() {
      if (!this.isLogin) {
        this.cartCount = 0;
        return;
      }
      try {
        const list = await api.cartList();
        this.cartCount = Array.isArray(list) ? list.reduce((sum, item) => sum + (item.num || 0), 0) : 0;
      } catch (e) {
        this.cartCount = 0;
      }
    },
    async goSearch() {
      const keyword = this.keyword.trim();
      const normalizedKeyword = keyword.toLowerCase();
      const nextQuery = keyword ? { keyword } : {};
      if (!keyword) {
        if (this.$route.path === "/mall/products" && JSON.stringify(this.$route.query || {}) === JSON.stringify(nextQuery)) {
          return;
        }
        this.$router.push({ path: "/mall/products", query: nextQuery });
        return;
      }
      this.searchLoading = true;
      try {
        const res = await api.productList({ pageNum: 1, pageSize: 1000, keyword });
        const records = Array.isArray(res?.records) ? res.records : [];
        const exactMatches = records.filter(item => {
          const name = String(item.name || "").toLowerCase();
          return name === normalizedKeyword;
        });
        if (exactMatches.length === 1 && exactMatches[0].id) {
          this.$router.push(`/mall/product/${exactMatches[0].id}`);
          return;
        }
        this.$router.push({ path: "/mall/products", query: nextQuery });
        if (!records.length) {
          this.$message.warning("未找到相关商品，已为你展示搜索结果");
        }
      } finally {
        this.searchLoading = false;
      }
    },
    logout() {
      this.$store.commit("CLEAR_AUTH");
      this.cartCount = 0;
      if (this.$route.path !== "/login") {
        this.$router.push("/login");
      }
    }
  }
};
</script>

<style scoped>
.mall-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(255, 255, 255, 0.84);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.75);
  box-shadow: 0 14px 38px rgba(35, 34, 67, 0.08);
}

.mall-header::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: linear-gradient(90deg, #ff5f95 0%, #ffa442 48%, #38d9ff 100%);
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  height: 74px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  cursor: pointer;
}

.logo-badge {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: linear-gradient(135deg, #ff5d90 0%, #ff8c42 52%, #ffd24d 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 900;
  box-shadow: 0 14px 28px rgba(255, 116, 123, 0.22);
}

.logo-cn {
  font-size: 22px;
  line-height: 1.05;
  font-weight: 900;
  color: #1f2033;
}

.logo-en {
  margin-top: 4px;
  font-size: 11px;
  letter-spacing: 1.8px;
  color: #8b92a3;
  font-weight: 700;
}

.nav-main {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
}

.nav-pill {
  border: none;
  height: 38px;
  padding: 0 16px;
  border-radius: 999px;
  background: transparent;
  color: #5e6578;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: transform 0.22s ease, box-shadow 0.22s ease, background 0.22s ease, color 0.22s ease;
}

.nav-pill-sub {
  opacity: 0.88;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.nav-pill:hover {
  transform: translateY(-1px) scale(1.02);
  background: rgba(255, 95, 149, 0.08);
  color: #ff5f92;
  box-shadow: 0 12px 24px rgba(255, 126, 110, 0.14);
}

.nav-pill.active {
  background: linear-gradient(90deg, #ff5f95 0%, #ff9d42 55%, #38d9ff 100%);
  color: #fff;
  box-shadow: 0 12px 24px rgba(255, 126, 110, 0.18);
}

.nav-pill-admin {
  color: #2e3653;
}

.cart-badge :deep(.el-badge__content.is-fixed) {
  top: 10px;
  right: -10px;
  background: #ff5f92;
  border: 2px solid #fff;
  box-shadow: 0 6px 12px rgba(255, 95, 146, 0.22);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.search-input {
  width: 240px;
}

.search-input :deep(.el-input__inner) {
  border-radius: 14px 0 0 14px;
  border: 1px solid #ebedf4;
  background: rgba(255, 255, 255, 0.92);
  color: #2c3140;
}

.search-input :deep(.el-input-group__append) {
  border-radius: 0 14px 14px 0;
  border: 1px solid #ebedf4;
  border-left: none;
  background: linear-gradient(90deg, #ff5f95 0%, #ff9d42 55%, #ffc447 100%);
  color: #fff;
  transition: transform 0.22s ease, box-shadow 0.22s ease, filter 0.22s ease;
}

.auth-btn,
.logout-btn {
  border: none;
  border-radius: 999px;
  height: 34px;
  padding: 0 16px;
  font-weight: 800;
  color: #fff;
  box-shadow: 0 12px 24px rgba(255, 117, 105, 0.18);
  transition: transform 0.22s ease, box-shadow 0.22s ease, filter 0.22s ease;
}

.auth-btn {
  background: linear-gradient(90deg, #1e2133 0%, #313756 100%);
}

.logout-btn {
  background: linear-gradient(90deg, #ff5f95 0%, #ff8d48 56%, #ffbf44 100%);
}

.auth-btn:hover,
.logout-btn:hover,
.search-input :deep(.el-input-group__append:hover) {
  transform: translateY(-1px) scale(1.02);
  box-shadow: 0 14px 28px rgba(255, 117, 105, 0.22);
}

.page-body {
  padding: 20px 0;
}

@media (max-width: 1200px) {
  .topbar {
    gap: 12px;
  }

  .search-input {
    width: 190px;
  }
}

@media (max-width: 980px) {
  .topbar {
    height: auto;
    padding: 14px 0;
    flex-wrap: wrap;
  }

  .nav-main {
    order: 3;
    width: 100%;
    padding-bottom: 4px;
  }
}

@media (max-width: 720px) {
  .logo-cn {
    font-size: 18px;
  }

  .logo-en {
    display: none;
  }

  .search-input {
    width: 150px;
  }
}
</style>
