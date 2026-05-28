<template>
  <section class="product-page mall-surface-page">
    <div class="catalog-shell">
      <aside class="catalog-sidebar">
        <div class="sidebar-head">
          <div class="sidebar-chip">CATEGORY</div>
          <h2 class="sidebar-title">{{ sidebarTitle }}</h2>
          <p class="sidebar-subtitle">{{ sidebarSubtitle }}</p>
        </div>

        <div class="sidebar-list">
          <button
            v-for="item in tabs"
            :key="item.key"
            class="sidebar-item"
            :class="{ active: activeTab === item.key }"
            @click="changeCategory(item.key)"
          >
            {{ item.label }}
          </button>
        </div>
      </aside>

      <div class="catalog-main">
        <div class="catalog-toolbar">
          <div>
            <div class="toolbar-chip">PRODUCTS</div>
            <h1 class="catalog-title">{{ pageTitle }}</h1>
          </div>
          <div class="catalog-total">共 {{ total }} 件商品</div>
        </div>

        <div ref="productPanel" class="catalog-panel">
          <div v-if="loading" class="product-grid">
            <div v-for="i in 8" :key="i" class="skeleton-card"></div>
          </div>
          <el-empty v-else-if="!products.length" description="暂无商品，换个分类看看" />
          <div v-else class="product-grid">
            <article v-for="item in products" :key="item.id" class="product-card" @click="goDetail(item)">
              <div class="cover-wrap">
                <img :src="resolveAssetUrl(item.coverUrl) || fallback" :alt="item.name" class="product-cover" />
              </div>
              <div class="product-body">
                <h3 class="product-name">{{ item.name }}</h3>
                <p class="product-subtitle">{{ item.subTitle || item.description || '高颜值潮玩收藏单品，适合展示与送礼。' }}</p>
                <div class="product-foot">
                  <span class="price">￥{{ formatPrice(item.price) }}</span>
                  <span class="product-type">{{ item.isBlindBox ? "盲盒" : "手办" }}</span>
                </div>
              </div>
            </article>
          </div>

          <div v-if="total > query.pageSize" class="pagination-wrap">
            <el-pagination background layout="prev, pager, next, total" :current-page="query.pageNum" :page-size="query.pageSize" :total="total" @current-change="changePage" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { api } from "../../api";
import { favoriteIdList, formatPrice } from "../../utils/mall";
import { resolveAssetUrl } from "../../utils/asset";
import {
  PRODUCT_CATEGORY_TABS,
  buildProductCategoryIdMap,
  getProductCategoryLabel,
  matchProductCategoryTab,
  normalizeProductCategoryTab
} from "../../utils/productCategoryTabs";

export default {
  name: "ProductListPage",
  data() {
    return {
      loading: false,
      products: [],
      total: 0,
      favoriteIds: [],
      fallback: "https://dummyimage.com/600x600/f8eef2/9c96a5&text=Toy",
      tabs: PRODUCT_CATEGORY_TABS,
      categoryIdMap: {},
      allProducts: [],
      query: { tab: "all", brandId: "", pageNum: 1, pageSize: 12 }
    };
  },
  computed: {
    activeTab() {
      return normalizeProductCategoryTab(this.query.tab);
    },
    activeCategoryName() {
      return getProductCategoryLabel(this.activeTab);
    },
    activeBrandId() {
      const brandId = this.query.brandId || this.$route.query.brandId;
      return brandId ? String(brandId) : "";
    },
    brandName() {
      return String(this.$route.query.brandName || "").trim();
    },
    isBrandMode() {
      return !!this.activeBrandId;
    },
    pageTitle() {
      if (this.isBrandMode) return this.brandName || "IP 商品";
      return this.activeCategoryName;
    },
    sidebarTitle() {
      return this.isBrandMode ? "IP 筛选" : "商品分类";
    },
    sidebarSubtitle() {
      return this.isBrandMode
        ? `当前 IP：${this.brandName || this.activeBrandId}`
        : "浏览分类并快速切换相关商品";
    }
  },
  watch: {
    "$route.query.tab": {
      immediate: true,
      handler(value) {
        this.query.tab = normalizeProductCategoryTab(value);
        this.query.pageNum = 1;
        if (this.allProducts.length) this.applyFilters();
      }
    },
    "$route.query.keyword": {
      immediate: true,
      handler() {
        this.query.pageNum = 1;
        if (this.allProducts.length) this.applyFilters();
      }
    },
    "$route.query.brandId": {
      immediate: true,
      handler(value) {
        this.query.brandId = value ? String(value) : "";
        this.query.pageNum = 1;
        if (this.allProducts.length) this.applyFilters();
      }
    },
    "$route.query.brandName": {
      immediate: true,
      handler() {
        if (this.allProducts.length) this.applyFilters();
      }
    }
  },
  async created() {
    await this.initPage();
  },
  methods: {
    formatPrice,
    resolveAssetUrl,
    async initPage() {
      this.loading = true;
      try {
        const productParams = { pageNum: 1, pageSize: 1000 };
        if (this.activeBrandId) productParams.brandId = this.activeBrandId;
        const tasks = [api.productList(productParams), api.categories()];
        if (this.$store.getters.isLogin) tasks.push(api.favoriteList());
        const [productRes, categoryRes, favorites = []] = await Promise.all(tasks);
        this.favoriteIds = favoriteIdList(favorites);
        this.categoryIdMap = buildProductCategoryIdMap(categoryRes || []);
        this.allProducts = (productRes.records || []).map(item => ({
          ...item,
          isFavorite: this.favoriteIds.includes(item.id)
        }));
        this.query.tab = normalizeProductCategoryTab(this.$route.query.tab);
        this.query.brandId = this.$route.query.brandId ? String(this.$route.query.brandId) : "";
        this.applyFilters();
        this.syncRouteQuery();
      } finally {
        this.loading = false;
      }
    },
    applyFilters() {
      const keyword = String(this.$route.query.keyword || "").trim().toLowerCase();
      const filtered = this.allProducts.filter(item => {
        const matchedTab = matchProductCategoryTab(item, this.activeTab, this.categoryIdMap);
        if (!matchedTab) return false;
        if (this.activeBrandId) {
          const itemBrandId = String(item.brandId || item.brandID || item.brand_id || "");
          if (itemBrandId && itemBrandId !== this.activeBrandId) return false;
        }
        if (!keyword) return true;
        const name = String(item.name || "").toLowerCase();
        const subtitle = String(item.subTitle || item.description || "").toLowerCase();
        return name.includes(keyword) || subtitle.includes(keyword);
      });
      this.total = filtered.length;
      const start = (this.query.pageNum - 1) * this.query.pageSize;
      this.products = filtered.slice(start, start + this.query.pageSize);
    },
    scrollToProductPanel() {
      this.$nextTick(() => {
        const panel = this.$refs.productPanel;
        if (!panel || typeof panel.scrollIntoView !== "function") return;
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    },
    changeCategory(tab) {
      const nextTab = normalizeProductCategoryTab(tab);
      const nextQuery = {};
      if (nextTab !== "all") nextQuery.tab = nextTab;
      if (this.activeBrandId) {
        nextQuery.brandId = this.activeBrandId;
        if (this.brandName) nextQuery.brandName = this.brandName;
      }

      this.query.tab = nextTab;
      this.query.pageNum = 1;
      this.applyFilters();
      this.scrollToProductPanel();

      const currentQuery = JSON.stringify(this.$route.query || {});
      const targetQuery = JSON.stringify(nextQuery);
      if (this.$route.path === "/mall/products" && currentQuery === targetQuery) {
        return;
      }
      this.$router.push({ path: "/mall/products", query: nextQuery });
    },
    changePage(page) {
      this.query.pageNum = page;
      this.applyFilters();
      this.scrollToProductPanel();
    },
    syncRouteQuery() {
      const nextQuery = {};
      if (this.query.tab !== "all") nextQuery.tab = this.query.tab;
      if (this.activeBrandId) {
        nextQuery.brandId = this.activeBrandId;
        if (this.brandName) nextQuery.brandName = this.brandName;
      }
      if (this.$route.path === "/mall/products" && JSON.stringify(this.$route.query || {}) === JSON.stringify(nextQuery)) return;
      this.$router.replace({ path: "/mall/products", query: nextQuery }).catch(() => {});
    },
    refreshTitle() {
      // no-op: computed values handle title changes, method kept for readability
    },
    goDetail(product) {
      this.$router.push(`/mall/product/${product.id}`);
    }
  }
};
</script>

<style scoped>
.product-page { display:grid; gap:20px; }
.catalog-shell { display:grid; grid-template-columns:210px minmax(0, 1fr); gap:22px; align-items:start; }
.catalog-sidebar,.catalog-panel,.catalog-toolbar { background:#fff; border:1px solid #f1e8ec; border-radius:28px; box-shadow:0 18px 44px rgba(35, 34, 67, 0.06); }
.catalog-sidebar { padding:24px 18px; }
.sidebar-head { padding:0 6px; }
.sidebar-chip,.toolbar-chip { display:inline-flex; padding:7px 12px; border-radius:999px; background:#fff3f7; color:#ff5f92; font-size:11px; font-weight:800; letter-spacing:1.4px; }
.sidebar-title,.catalog-title { margin:14px 0 0; color:#222739; font-weight:900; }
.sidebar-title { font-size:28px; }
.sidebar-subtitle { margin:10px 0 0; color:#8a92a4; font-size:12px; line-height:1.8; }
.sidebar-list { margin-top:22px; border-left:1px solid #f0edf1; }
.sidebar-item { position:relative; width:100%; padding:14px 14px 14px 18px; border:none; background:transparent; color:#9ba3b3; font-size:15px; font-weight:700; text-align:left; cursor:pointer; transition:color .2s ease, background .2s ease; }
.sidebar-item::before { content:""; position:absolute; left:-1px; top:50%; width:2px; height:0; background:#2d3142; transform:translateY(-50%); transition:height .2s ease; }
.sidebar-item:hover { color:#5d6476; background:#fffafc; }
.sidebar-item.active { color:#202536; background:#fff; font-weight:900; }
.sidebar-item.active::before { height:28px; }
.catalog-main { display:grid; gap:16px; }
.catalog-toolbar { display:flex; align-items:flex-end; justify-content:space-between; gap:16px; padding:22px 26px; }
.catalog-title { font-size:34px; }
.catalog-total { color:#7f8798; font-size:14px; font-weight:700; }
.catalog-panel { padding:24px; }
.product-grid { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:18px; }
.product-card { border:none; border-radius:22px; background:transparent; cursor:pointer; transition:transform .22s ease; }
.product-card:hover { transform:translateY(-4px); }
.cover-wrap { border-radius:20px; background:linear-gradient(180deg, #fffaf8 0%, #fff3ee 100%); overflow:hidden; }
.product-cover { display:block; width:100%; aspect-ratio:1 / 1; object-fit:cover; }
.product-body { padding:12px 2px 0; }
.product-name { margin:0; color:#222739; font-size:16px; font-weight:900; line-height:1.45; display:-webkit-box; overflow:hidden; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
.product-subtitle { margin:8px 0 0; color:#8b93a4; font-size:12px; line-height:1.7; display:-webkit-box; overflow:hidden; -webkit-line-clamp:2; -webkit-box-orient:vertical; min-height:40px; }
.product-foot { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:12px; }
.price { color:#111827; font-size:22px; font-weight:900; }
.product-type { color:#9da5b4; font-size:12px; font-weight:700; }
.skeleton-card { height:280px; border-radius:22px; background:linear-gradient(90deg,#fff0f4 0%,#fff8fb 50%,#fff0f4 100%); background-size:200% 100%; animation:shimmer 1.4s linear infinite; }
.pagination-wrap { display:flex; justify-content:center; margin-top:26px; }
@keyframes shimmer { 0% { background-position:200% 0; } 100% { background-position:-200% 0; } }
@media (max-width:1280px) {
  .product-grid { grid-template-columns:repeat(2, minmax(0, 1fr)); }
}
@media (max-width:980px) {
  .catalog-shell { grid-template-columns:1fr; }
  .sidebar-list { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:8px; border-left:none; }
  .sidebar-item { border-radius:16px; padding:12px 14px; background:#fff8fb; }
  .sidebar-item::before { display:none; }
}
@media (max-width:720px) {
  .catalog-sidebar,.catalog-panel,.catalog-toolbar { border-radius:22px; }
  .catalog-sidebar,.catalog-panel { padding:18px; }
  .catalog-toolbar { padding:18px; align-items:flex-start; flex-direction:column; }
  .sidebar-title,.catalog-title { font-size:26px; }
  .sidebar-list,.product-grid { grid-template-columns:1fr; }
}
</style>
