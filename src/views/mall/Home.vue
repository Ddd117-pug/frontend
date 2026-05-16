<template>
  <div class="home-page mall-surface-page">
    <HomeHeroCarousel
      :slides="heroSlides"
      @browse="goProducts"
      @action="handleSlideAction"
    />

    <section v-if="bannerConfigs.length" class="config-banner-section mall-hover-lift">
      <div class="config-banner-section__head">
        <div>
          <div class="config-banner-section__chip">HOME CONFIG</div>
          <h2 class="config-banner-section__title">首页运营位</h2>
          <p class="config-banner-section__desc">后台维护的 Banner 与专题配置会实时同步到前台首页。</p>
        </div>
        <button class="config-banner-section__more" @click="goProducts">去逛逛</button>
      </div>
      <div class="config-banner-grid">
        <article
          v-for="item in bannerConfigs"
          :key="item.id"
          class="config-banner-card"
          :style="item.style"
          @click="handleConfigClick(item)"
        >
          <div class="config-banner-card__body">
            <div class="config-banner-card__tag">{{ item.tag }}</div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.subtitle }}</p>
          </div>
          <img v-if="item.imageUrl" :src="resolveImage(item.imageUrl)" :alt="item.title" />
        </article>
      </div>
    </section>

    <HomeModuleSection
      v-for="module in homeModules"
      :key="module.key"
      :chip="module.chip"
      :title="module.title"
      :badge="module.badge"
      :items="module.items"
      :loading="module.loading"
      @more="() => goModule(module)"
      @detail="goDetail"
      @favorite="toggleFavorite"
      @add-cart="addToCart"
    />

    <HomeFooterBar />
  </div>
</template>

<script>
import { api } from "../../api";
import HomeHeroCarousel from "../../components/HomeHeroCarousel.vue";
import HomeModuleSection from "../../components/HomeModuleSection.vue";
import HomeFooterBar from "../../components/HomeFooterBar.vue";
import { requireLogin } from "../../utils/mall";
import { getHomeCategoryRoute } from "../../utils/productCategoryTabs";
import { resolveAssetUrl } from "../../utils/asset";

const DEFAULT_SLIDES = [
  {
    id: 1,
    tag: "SWEET BEAN",
    title: "小甜豆追光记忆系列",
    desc: "暖萌造型搭配柔和配色，适合日常摆拍、桌面陈列与治愈系收藏展示。",
    background: "linear-gradient(135deg, #ffb26f 0%, #ffd39a 52%, #fff1cf 100%)",
    image: "/images/banners/banner1.jpg",
    imageClass: "focus-top",
    buttonText: "立即抢购",
    actionType: "product",
    targetNames: ["小甜豆追光记忆系列"]
  },
  {
    id: 2,
    tag: "HATSUNE MIKU",
    title: "初音未来·错位彼方系列毛绒玩偶",
    desc: "高颜值潮玩收藏单品，兼顾展示与陪伴感，适合首页主推的人气治愈款。",
    background: "linear-gradient(135deg, #79bbff 0%, #9be4ff 52%, #dff8ff 100%)",
    image: "/images/banners/banner2.jpg",
    imageClass: "focus-center",
    buttonText: "立即抢购",
    actionType: "product",
    targetNames: ["初音未来-错位彼方系列毛绒玩偶", "初音未来·错位彼方系列毛绒玩偶", "错位彼方系列毛绒玩偶"]
  },
  {
    id: 3,
    tag: "CRAYON SHINCHAN",
    title: "蜡笔小新 POP CUBE-2 系列",
    desc: "方块造型趣味十足，适合陈列展示与盲抽收藏，是首页热卖推荐款之一。",
    background: "linear-gradient(135deg, #ff9966 0%, #ffc363 48%, #ffe6a1 100%)",
    image: "/images/banners/banner3.jpg",
    imageClass: "focus-top",
    buttonText: "立即抢购",
    actionType: "product",
    targetNames: ["蜡笔小新POP CUBE-2系列", "蜡笔小新 POP CUBE-2 系列", "POP CUBE-2系列"]
  }
];

export default {
  name: "MallHome",
  components: { HomeHeroCarousel, HomeModuleSection, HomeFooterBar },
  data() {
    return {
      brands: [],
      hotFigures: [],
      newArrivals: [],
      blindBoxes: [],
      homeConfigs: [],
      loading: { brands: false, hot: false, new: false, box: false, config: false }
    };
  },
  computed: {
    totalBrands() {
      return this.brands.length;
    },
    bannerConfigs() {
      return this.homeConfigs
        .filter(item => ["banner", "topic"].includes(this.normalizeType(item.type)) && Number(item.status) === 1)
        .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
        .map(item => ({
          ...item,
          tag: (item.title || "HOME").slice(0, 16).toUpperCase(),
          style: item.imageUrl ? { backgroundImage: `linear-gradient(135deg, rgba(16,24,40,.20), rgba(16,24,40,.05)), url(${this.resolveImage(item.imageUrl)})`, backgroundSize: "cover", backgroundPosition: "center" } : {},
          imageUrl: item.imageUrl
        }));
    },
    heroSlides() {
      const configs = this.bannerConfigs.map((item, index) => ({
        id: item.id,
        tag: item.tag,
        title: item.title || `首页推荐 ${index + 1}`,
        desc: item.subtitle || "后台运营配置同步展示。",
        background: item.style.backgroundImage || DEFAULT_SLIDES[index % DEFAULT_SLIDES.length].background,
        image: item.imageUrl ? this.resolveImage(item.imageUrl) : DEFAULT_SLIDES[index % DEFAULT_SLIDES.length].image,
        imageClass: "focus-center",
        buttonText: item.targetType === "url" ? "立即查看" : "去逛逛",
        actionType: item.targetType || "route",
        targetUrl: item.targetValue || item.linkUrl || "",
        targetNames: item.targetValue ? [item.targetValue] : []
      }));
      return configs.length ? configs : DEFAULT_SLIDES;
    },
    homeModules() {
      const modules = this.homeConfigs
        .filter(item => ["module", "brand", "category"].includes(this.normalizeType(item.type)) && Number(item.status) === 1)
        .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
        .map((item, index) => ({
          key: item.id,
          chip: this.moduleChip(item),
          title: item.title || `推荐模块 ${index + 1}`,
          badge: item.subtitle || "HOT",
          items: this.moduleItems(item),
          loading: false,
          targetType: item.targetType,
          targetValue: item.targetValue,
          linkUrl: item.linkUrl,
          categoryRoute: item.targetValue || item.linkUrl || "",
          moduleType: this.normalizeType(item.type)
        }));
      const fallback = [
        { key: "hot", chip: "热门手办", title: "热门手办", badge: "HOT", items: this.hotFigures, loading: this.loading.hot, categoryRoute: "1", moduleType: "module" },
        { key: "new", chip: "新品首发", title: "新品首发", badge: "NEW", items: this.newArrivals, loading: this.loading.new, categoryRoute: "2", moduleType: "module" },
        { key: "box", chip: "惊喜盲盒", title: "惊喜盲盒", badge: "BOX", items: this.blindBoxes, loading: this.loading.box, categoryRoute: "3", moduleType: "module" }
      ];
      return modules.length ? modules : fallback;
    }
  },
  async created() {
    await this.loadHomeData();
    if (typeof window !== "undefined") {
      window.addEventListener("focus", this.refreshHomeConfigs);
    }
  },
  beforeDestroy() {
    if (typeof window !== "undefined") {
      window.removeEventListener("focus", this.refreshHomeConfigs);
    }
  },
  methods: {
    resolveImage(url) { return resolveAssetUrl(url); },
    normalizeType(type) { return String(type || "").toLowerCase(); },
    async refreshHomeConfigs() {
      await this.loadHomeConfigs();
    },
    async loadHomeData() {
      this.loading = { brands: true, hot: true, new: true, box: true, config: true };
      try {
        const requests = [
          api.homeConfig(),
          api.brands(),
          api.productList({ pageNum: 1, pageSize: 4, sortBy: "saleCount", sortOrder: "desc" }),
          api.productList({ pageNum: 1, pageSize: 4, sortBy: "createdAt", sortOrder: "desc" }),
          api.productList({ pageNum: 1, pageSize: 4, keyword: "盲盒", sortBy: "saleCount", sortOrder: "desc" })
        ];
        if (this.$store.getters.isLogin) requests.push(api.favoriteList());
        const [configRes, brandsRes, hotRes, newRes, boxRes, favorites = []] = await Promise.all(requests);
        const favoriteIds = new Set((favorites || []).map(item => item.id));
        const rawConfigs = Array.isArray(configRes) ? configRes : configRes?.data || configRes?.records || [];
        this.homeConfigs = rawConfigs.map(item => ({
          ...item,
          sortOrder: Number(item.sortOrder || item.sort_order || 0),
          imageUrl: item.imageUrl || item.image_url || "",
          targetType: item.targetType || item.target_type || "route",
          targetValue: item.targetValue || item.target_value || "",
          subtitle: item.subtitle || "",
          type: item.type || "module",
          status: Number(item.status ?? 1)
        }));
        this.brands = Array.isArray(brandsRes) ? brandsRes.slice(0, 6) : brandsRes?.records?.slice?.(0, 6) || [];
        this.hotFigures = this.decorateProducts(hotRes.records || hotRes?.data?.records || [], favoriteIds);
        this.newArrivals = this.decorateProducts(newRes.records || newRes?.data?.records || [], favoriteIds);
        this.blindBoxes = this.decorateProducts(boxRes.records || boxRes?.data?.records || [], favoriteIds);
      } finally {
        this.loading = { brands: false, hot: false, new: false, box: false, config: false };
      }
    },
    async loadHomeConfigs() {
      const res = await api.homeConfig();
      const rawConfigs = Array.isArray(res) ? res : res?.data || res?.records || [];
      this.homeConfigs = rawConfigs.map(item => ({
        ...item,
        sortOrder: Number(item.sortOrder || item.sort_order || 0),
        imageUrl: item.imageUrl || item.image_url || "",
        targetType: item.targetType || item.target_type || "route",
        targetValue: item.targetValue || item.target_value || "",
        subtitle: item.subtitle || "",
        type: item.type || "module",
        status: Number(item.status ?? 1)
      }));
    },
    decorateProducts(list, favoriteIds) {
      return list.map(item => ({ ...item, isFavorite: favoriteIds.has(item.id) }));
    },
    updateProductState(productId, updater) {
      ["hotFigures", "newArrivals", "blindBoxes"].forEach(key => {
        this[key] = this[key].map(item => (item.id === productId ? updater(item) : item));
      });
    },
    goProducts() { this.$router.push({ path: "/mall/products", query: { tab: "new-month" } }); },
    goBrands() { this.$router.push("/mall/brands"); },
    goBrandDetail(brand) { this.$router.push(`/mall/brand/${brand.id}`); },
    resolveBrandLogo(logo) { return resolveAssetUrl(logo); },
    goCategoryById(categoryId) { this.$router.push({ path: "/mall/products", query: { tab: getHomeCategoryRoute(categoryId) } }); },
    goBrandById(brandId) { this.$router.push(`/mall/brand/${brandId}`); },
    goModule(module) {
      const route = module.categoryRoute || module.targetValue || module.linkUrl || "";
      if (module.targetType === "url" && route) {
        if (/^https?:\/\//i.test(route)) {
          window.open(route, "_blank");
          return;
        }
        this.$router.push(route);
        return;
      }
      if (module.targetType === "brand" && route) {
        this.$router.push(`/mall/brand/${route}`);
        return;
      }
      if (module.targetType === "product" && route) {
        this.$router.push(`/mall/product/${route}`);
        return;
      }
      if (module.targetType === "category" && route) {
        this.goCategoryById(Number(route));
        return;
      }
      if (/^\d+$/.test(String(route))) {
        return this.goCategoryById(Number(route));
      }
      if (route) {
        this.$router.push(route);
        return;
      }
      this.goProducts();
    },
    handleSlideAction(slide) {
      if (slide.actionType === "product" && slide.targetUrl) {
        this.$router.push(`/mall/product/${slide.targetUrl}`);
        return;
      }
      if (slide.actionType === "brand" && slide.targetUrl) {
        this.goBrandById(slide.targetUrl);
        return;
      }
      if (slide.actionType === "category" && slide.targetUrl) {
        this.goCategoryById(Number(slide.targetUrl));
        return;
      }
      if (slide.actionType === "url" && slide.targetUrl) {
        if (/^https?:\/\//i.test(slide.targetUrl)) window.open(slide.targetUrl, "_blank");
        else this.$router.push(slide.targetUrl);
        return;
      }
      if (slide.actionType === "route" && slide.targetUrl) {
        this.$router.push(slide.targetUrl);
        return;
      }
      this.goProducts();
    },
    handleConfigClick(item) {
      if (item.targetType === "url" && item.targetValue) {
        if (/^https?:\/\//i.test(item.targetValue)) window.open(item.targetValue, "_blank");
        else this.$router.push(item.targetValue);
        return;
      }
      if (item.targetType === "brand" && item.targetValue) {
        this.goBrandById(item.targetValue);
        return;
      }
      if (item.targetType === "category" && item.targetValue) {
        this.goCategoryById(Number(item.targetValue));
        return;
      }
      if (item.targetType === "product" && item.targetValue) {
        this.$router.push(`/mall/product/${item.targetValue}`);
        return;
      }
      if (item.targetType === "route" && item.targetValue) {
        this.$router.push(item.targetValue);
        return;
      }
      this.goProducts();
    },
    moduleChip(module) {
      const type = this.normalizeType(module.type);
      const map = { banner: "Banner", topic: "专题", module: "推荐模块", brand: "品牌推荐", category: "分类推荐" };
      return map[type] || (module.title || "MODULE").slice(0, 16).toUpperCase();
    },
    moduleItems(module) {
      const type = this.normalizeType(module.type);
      const text = `${module.title || ""} ${module.subtitle || ""} ${module.targetValue || ""}`.toLowerCase();
      if (type === "brand") return this.brands;
      if (type === "category") return this.moduleCategoryItems(module);
      if (text.includes("盲盒")) return this.blindBoxes;
      if (text.includes("新品") || text.includes("new")) return this.newArrivals;
      if (text.includes("热门") || text.includes("hot")) return this.hotFigures;
      return this.hotFigures;
    },
    moduleCategoryItems(module) {
      const keywords = String(module.title || module.subtitle || module.targetValue || "").trim();
      if (keywords.includes("新品")) return this.newArrivals;
      if (keywords.includes("盲盒")) return this.blindBoxes;
      if (keywords.includes("品牌")) return this.brands;
      return this.hotFigures;
    },
    goDetail(product) { this.$router.push(`/mall/product/${product.id}`); },
    async addToCart(product) {
      if (!requireLogin(this, "请先登录后再加入购物车")) return;
      await api.cartAdd({ productId: product.id, num: 1 });
      this.$message.success("已加入购物车");
      this.$root.$emit("cart-updated");
    },
    async toggleFavorite(product) {
      if (!requireLogin(this, "请先登录后再收藏")) return;
      if (product.isFavorite) {
        await api.removeFavorite(product.id);
        this.$message.success("已取消收藏");
        this.updateProductState(product.id, item => ({ ...item, isFavorite: false }));
        return;
      }
      await api.addFavorite(product.id);
      this.$message.success("收藏成功");
      this.updateProductState(product.id, item => ({ ...item, isFavorite: true }));
    }
  }
};
</script>

<style scoped>
.home-page { display:grid; gap:24px; padding-bottom:16px; }
.home-page :deep(.home-hero-carousel),
.home-page :deep(.home-module-section) { border-radius:28px; overflow:hidden; box-shadow:var(--mall-shadow); }
.home-page :deep(button) { transition:transform .22s ease, box-shadow .22s ease, filter .22s ease; }
.home-page :deep(button:hover) { transform:translateY(-1px) scale(1.02); box-shadow:0 14px 28px rgba(255,122,92,.18); }
.config-banner-section, .brand-section { background:linear-gradient(135deg,#ffffff 0%,#fbfcff 100%); border:1px solid #eef1f6; border-radius:28px; padding:22px; box-shadow:var(--mall-shadow); }
.config-banner-section__head, .brand-section__head { display:flex; justify-content:space-between; gap:16px; align-items:flex-start; margin-bottom:18px; }
.config-banner-section__chip, .brand-section__chip { display:inline-flex; padding:7px 12px; border-radius:999px; background:#eef6ff; color:#3b82f6; font-size:11px; font-weight:800; letter-spacing:1.2px; }
.config-banner-section__title, .brand-section__title { margin:10px 0 0; color:#202536; font-size:24px; font-weight:900; }
.config-banner-section__desc, .brand-section__desc { margin:8px 0 0; color:#7b8395; line-height:1.7; }
.config-banner-section__more, .brand-section__more { border:none; border-radius:999px; padding:10px 16px; background:linear-gradient(135deg,#ff7a5c,#ff9d40); color:#fff; cursor:pointer; font-weight:700; }
.config-banner-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; }
.config-banner-card { min-height:170px; border-radius:22px; overflow:hidden; position:relative; padding:18px; display:flex; justify-content:space-between; align-items:flex-end; gap:12px; cursor:pointer; color:#fff; box-shadow:0 16px 34px rgba(15,23,42,.12); }
.config-banner-card img { width:120px; height:120px; object-fit:cover; border-radius:18px; border:1px solid rgba(255,255,255,.25); background:rgba(255,255,255,.14); }
.config-banner-card__body { max-width:calc(100% - 132px); }
.config-banner-card__tag { display:inline-flex; padding:6px 10px; border-radius:999px; background:rgba(255,255,255,.18); font-size:11px; font-weight:800; letter-spacing:1px; }
.config-banner-card h3 { margin:10px 0 0; font-size:22px; font-weight:900; }
.config-banner-card p { margin:8px 0 0; line-height:1.7; opacity:.92; }
@media (max-width: 1100px) { .config-banner-grid { grid-template-columns:1fr; } .config-banner-section__head, .brand-section__head { flex-direction:column; } }
</style>