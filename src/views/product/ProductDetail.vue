<template>
  <section class="product-detail-page mall-surface-page" v-loading="loading">
    <div v-if="detail.id" class="detail-layout">
      <div class="page-toolbar mall-hover-lift">
        <el-button class="back-button" icon="el-icon-arrow-left" plain @click="goBack">返回上一页</el-button>
      </div>
      <div class="gallery-panel mall-hover-lift">
        <div class="gallery-stage">
          <div class="thumb-rail">
            <button
              v-for="(image, index) in galleryImages"
              :key="`${image}-${index}`"
              class="thumb-button"
              :class="{ active: activeImage === image }"
              @click="activeImage = image"
            >
              <img :src="image" :alt="`${detail.name}-${index}`" class="thumb-image" />
            </button>
          </div>

          <div class="hero-image-wrap" @click="openPreview(activeImage || fallback)">
            <img :src="activeImage || fallback" :alt="detail.name" class="hero-image" />
            <div class="hero-image-tip">点击查看大图</div>
          </div>
        </div>
      </div>

      <div class="info-panel mall-hover-lift">
        <div class="info-topbar">
          <span class="detail-chip">商品详情</span>
        </div>

        <h1 class="detail-title">{{ detail.name }}</h1>
        <p class="detail-subtitle">{{ detail.subTitle || "商品详情" }}</p>

        <div class="price-card">
          <div>
            <div class="price-main">￥{{ formatPrice(detail.price) }}</div>
            <div v-if="detail.originalPrice" class="original-price">原价 ￥{{ formatPrice(detail.originalPrice) }}</div>
          </div>
          <div class="sales-text">已售 {{ detail.saleCount || 0 }}</div>
        </div>

        <div class="core-meta">
          <div class="meta-row">
            <span class="meta-label">材质</span>
            <span class="meta-value">{{ detail.material || "PVC / ABS" }}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">尺寸</span>
            <span class="meta-value">{{ detail.size || "以实物为准" }}</span>
          </div>
          <div v-if="styleOptions.length && !isDisplayCategory" class="style-display-block">
            <div class="style-display-head">
              <span class="meta-label">款式选择</span>
              <span class="style-display-hint">选择后将同步到购物车和立即购买</span>
            </div>
            <div class="selected-style-banner">
              <span class="selected-style-banner__label">当前已选</span>
              <span class="selected-style-banner__value">{{ selectedStyleOption || '请选择款式' }}</span>
            </div>
            <div class="style-card-grid">
              <button
                class="style-card"
                :class="{ active: selectedStyleIndex === index, disabled: isStyleOptionDisabled(item.title) }"
                v-for="(item, index) in styleOptions"
                :key="`${item.title}-${index}`"
                @click="selectStyleOption(index)"
              >
                <span class="style-card__badge" v-if="index === 0">推荐</span>
                <span class="style-card__title">{{ item.title }}</span>
                <span v-if="selectedStyleIndex === index" class="style-card__check">已选</span>
              </button>
            </div>
          </div>
          <div v-else class="style-empty-tip">当前商品暂未配置款式。</div>
          <div class="meta-row">
            <span class="meta-label">库存</span>
            <span class="meta-value">{{ detail.stock || 0 }}</span>
          </div>
        </div>

        <div class="quantity-row">
          <span class="meta-label quantity-label">数量</span>
          <el-input-number v-model="buyCount" :min="1" :max="maxBuyCount" size="mini" />
          <span class="stock-tip">有货</span>
        </div>

        <div class="action-row">
          <button class="action-primary" @click="addToCart">加入购物车</button>
          <button class="action-secondary" @click="buyNow">立即购买</button>
          <button class="action-ghost" :class="{ active: isFavorite }" @click="toggleFavorite">
            {{ isFavorite ? "已收藏" : "收藏" }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="detail.id" class="detail-tabs mall-hover-lift">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="用户评价" name="reviews">
          <div class="tab-panel">
            <el-empty v-if="!reviews.length" description="暂时还没有用户评价" />
            <div v-else class="review-list">
              <article v-for="item in reviews" :key="item.id" class="review-item">
                <div class="review-user-row">
                  <div>
                    <div class="review-user">{{ item.isAnonymous === 1 ? "匿名用户" : `用户 #${item.userId}` }}</div>
                    <div class="review-time">{{ formatReviewTime(item.createdAt) }}</div>
                  </div>
                  <el-rate :value="item.score || 5" disabled text-color="#ff8f1f" />
                </div>
                <div class="review-content">{{ item.content || "该用户未填写文字说明。" }}</div>
                <div v-if="parsePictures(item.pictures).length" class="review-images">
                  <img
                    v-for="(picture, index) in parsePictures(item.pictures)"
                    :key="`${item.id}-${index}`"
                    :src="picture"
                    :alt="`${detail.name}-review-${index}`"
                    class="review-image"
                  />
                </div>
              </article>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="参数信息" name="params">
          <div class="tab-panel param-list">
            <div class="param-item"><span>商品名称</span><strong>{{ detail.name }}</strong></div>
            <div class="param-item"><span>材质</span><strong>{{ detail.material || "PVC / ABS" }}</strong></div>
            <div class="param-item"><span>尺寸</span><strong>{{ detail.size || "以实物为准" }}</strong></div>
            <div class="param-item"><span>库存</span><strong>{{ detail.stock || 0 }}</strong></div>
            <div class="param-item"><span>销量</span><strong>{{ detail.saleCount || 0 }}</strong></div>
            <div v-if="categoryName" class="param-item"><span>所属分类</span><strong>{{ categoryName }}</strong></div>
            <div v-if="detail.styleDesc && !isDisplayCategory" class="param-item"><span>款式描述</span><strong>{{ detail.styleDesc }}</strong></div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="图文详情" name="detail">
          <div class="tab-panel rich-detail rich-detail--stacked">
            <p v-if="detail.description" class="rich-detail-text">{{ detail.description }}</p>
            <div v-if="detailTabImages.length" class="detail-image-stream">
              <figure
                v-for="(image, index) in detailTabImages"
                :key="`detail-${index}`"
                class="detail-image-frame"
              >
                <img
                  :src="image"
                  :alt="`${detail.name}-detail-${index}`"
                  class="detail-image detail-image--long"
                  @click="openPreview(image)"
                />
              </figure>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-empty v-else description="商品不存在或已下架" />

    <el-dialog :visible.sync="previewVisible" custom-class="product-preview-dialog" width="72%" append-to-body>
      <div class="preview-stage">
        <img :src="previewImage" alt="preview" class="preview-image" />
      </div>
    </el-dialog>
  </section>
</template>

<script>
import { api } from "../../api";
import { formatPrice, requireLogin } from "../../utils/mall";
import { resolveAssetUrl } from "../../utils/asset";

export default {
  name: "ProductDetailPage",
  data() {
    return {
      loading: false,
      detail: {},
      reviews: [],
      categories: [],
      isFavorite: false,
      activeImage: "",
      activeTab: "reviews",
      buyCount: 1,
      selectedStyleIndex: 0,
      previewVisible: false,
      previewImage: "",
      fallback: "https://dummyimage.com/720x720/f8eef2/9c96a5&text=Toy"
    };
  },
  computed: {
    galleryImages() {
      const detailImages = String(this.detail.bannerUrls || "")
        .split(",")
        .map(item => resolveAssetUrl(item.trim()))
        .filter(Boolean);
      const images = [resolveAssetUrl(this.detail.coverUrl), ...detailImages].filter(Boolean);
      return images.length ? Array.from(new Set(images)) : [this.fallback];
    },
    detailTabImages() {
      const detailImages = String(this.detail.detailImageUrls || "")
        .split(",")
        .map(item => resolveAssetUrl(item.trim()))
        .filter(Boolean);
      return detailImages.length ? detailImages : [];
    },
    categoryName() {
      const current = this.categories.find(item => Number(item.id) === Number(this.detail.categoryId));
      return current ? current.name : "";
    },
    styleOptions() {
      return String(this.detail.styleDesc || "")
        .split(/\r?\n|；|;/)
        .map(item => item.trim())
        .filter(Boolean)
        .map(item => ({ title: item }));
    },
    selectedStyleOption() {
      return this.styleOptions[this.selectedStyleIndex] ? this.styleOptions[this.selectedStyleIndex].title : "";
    },
    isDisplayCategory() {
      return this.categoryName === "收纳展示";
    },
    maxBuyCount() {
      return Math.max(1, Number(this.detail.stock) || 1);
    }
  },
  watch: {
    "$route.params.id": {
      immediate: true,
      handler() {
        this.loadDetail();
      }
    },
    selectedStyleOption(value) {
      const suggestedCount = this.parseStyleOptionCount(value);
      this.buyCount = suggestedCount || 1;
    },
    maxBuyCount(value) {
      if (this.buyCount > value) {
        this.buyCount = value;
      }
      if (this.selectedStyleIndex >= 0) {
        const suggestedCount = this.parseStyleOptionCount(this.selectedStyleOption);
        if (!suggestedCount || this.buyCount !== suggestedCount) {
          this.buyCount = Math.min(this.buyCount || 1, value);
        }
      }
    }
  },
  methods: {
    formatPrice,
    resolveAssetUrl,
    async loadDetail() {
      this.loading = true;
      try {
        const tasks = [api.productDetail(this.$route.params.id), api.reviewList(this.$route.params.id), api.categories()];
        if (this.$store.getters.isLogin) {
          tasks.push(api.favoriteList());
        }
        const [detail, reviews = [], categories = [], favorites = []] = await Promise.all(tasks);
        this.detail = detail || {};
        this.categories = Array.isArray(categories) ? categories : [];
        this.activeImage = (detail && (resolveAssetUrl(detail.coverUrl) || String(detail.bannerUrls || "").split(",").map(item => resolveAssetUrl(item.trim())).find(Boolean))) || this.fallback;
        this.reviews = (reviews || []).filter(item => item.status !== 0);
        this.isFavorite = (favorites || []).some(item => item.id === Number(this.$route.params.id));
        this.activeTab = "reviews";
        this.buyCount = 1;
        this.selectedStyleIndex = 0;
        if (!String(this.detail.styleDesc || "").trim()) {
          this.selectedStyleIndex = -1;
        }
      } finally {
        this.loading = false;
      }
    },
    parsePictures(value) {
      if (!value) return [];
      return String(value)
        .split(",")
        .map(item => resolveAssetUrl(item.trim()))
        .filter(Boolean);
    },
    formatReviewTime(value) {
      if (!value) return "刚刚发布";
      return String(value).replace("T", " ").slice(0, 16);
    },
    parseStyleOptionCount(value) {
      if (!value) return null;
      const match = String(value).match(/整盒\s*(\d+)\s*个|端盒\s*(\d+)\s*个|(\d+)\s*个整盒/);
      const count = Number(match && (match[1] || match[2] || match[3]));
      return Number.isFinite(count) && count > 0 ? count : null;
    },
    isStyleOptionDisabled(value) {
      const suggestedCount = this.parseStyleOptionCount(value);
      return !!(suggestedCount && suggestedCount > this.maxBuyCount);
    },
    getStyleOptionCountText(value) {
      const count = this.parseStyleOptionCount(value);
      return count ? `建议整盒 ${count} 件` : "";
    },
    selectStyleOption(index) {
      const option = this.styleOptions[index];
      if (!option) return;
      if (this.isStyleOptionDisabled(option.title)) {
        const suggestedCount = this.parseStyleOptionCount(option.title);
        this.$message.warning(`当前库存仅剩 ${this.maxBuyCount} 件，不支持 ${suggestedCount} 件整盒购买`);
        return;
      }
      this.selectedStyleIndex = index;
      const suggestedCount = this.parseStyleOptionCount(option.title);
      this.buyCount = suggestedCount || 1;
    },
    openPreview(image) {
      if (!image) return;
      this.previewImage = image;
      this.previewVisible = true;
    },
    async addToCart() {
      if (!requireLogin(this, "请先登录后再加入购物车")) return false;
      if (this.selectedStyleOption && this.isStyleOptionDisabled(this.selectedStyleOption)) {
        this.$message.warning("当前库存不足，暂不支持当前款式购买");
        return false;
      }
      await api.cartAdd({ productId: this.detail.id, num: this.buyCount, styleOption: this.selectedStyleOption || "" });
      this.$message.success(this.selectedStyleOption ? `已加入购物车：${this.selectedStyleOption}` : "已加入购物车");
      this.$root.$emit("cart-updated");
      return true;
    },
    async buyNow() {
      if (!requireLogin(this, "请先登录后再购买")) return;
      if (this.selectedStyleOption && this.isStyleOptionDisabled(this.selectedStyleOption)) {
        this.$message.warning("当前库存不足，暂不支持当前款式购买");
        return;
      }
      const query = {
        productId: this.detail.id,
        num: this.buyCount,
        styleOption: this.selectedStyleOption || "",
        source: "direct"
      };
      this.$router.push({ path: "/mall/checkout", query }).catch(() => {});
    },
    async toggleFavorite() {
      if (!requireLogin(this, "请先登录后再收藏")) return;
      if (this.isFavorite) {
        await api.removeFavorite(this.detail.id);
        this.isFavorite = false;
        this.$message.success("已取消收藏");
        return;
      }
      await api.addFavorite(this.detail.id);
      this.isFavorite = true;
      this.$message.success("收藏成功");
    },
    goBack() {
      if (window.history.length > 1) {
        this.$router.back();
        return;
      }
      this.$router.push("/mall/products");
    }
  }
};
</script>

<style scoped>
.product-detail-page { display:grid; gap:22px; }
.page-toolbar { display:flex; align-items:center; justify-content:flex-start; padding:18px 24px; border:1px solid var(--mall-card-border); border-radius:28px; background:var(--mall-card-bg); box-shadow:var(--mall-shadow); }
.back-button { border-radius:999px; }

@media (min-width: 1101px) {
  .page-toolbar { grid-column: 1 / -1; }
}
.detail-layout { display:grid; grid-template-columns:minmax(420px, 0.92fr) minmax(420px, 1.08fr); gap:22px; align-items:start; }
.gallery-panel,.info-panel,.detail-tabs { background:var(--mall-card-bg); border:1px solid var(--mall-card-border); border-radius:28px; box-shadow:var(--mall-shadow); padding:24px; }
.gallery-panel { background:linear-gradient(180deg, rgba(255,250,252,0.96) 0%, rgba(255,255,255,0.98) 100%); }
.gallery-stage { display:grid; grid-template-columns:92px minmax(0, 1fr); gap:18px; align-items:start; }
.thumb-rail { display:grid; gap:12px; max-height:540px; overflow:auto; padding-right:6px; }
.thumb-rail::-webkit-scrollbar { width:6px; }
.thumb-rail::-webkit-scrollbar-thumb { background:rgba(255,132,164,.35); border-radius:999px; }
.thumb-button { position:relative; width:84px; height:84px; padding:4px; border:none; border-radius:22px; overflow:hidden; background:linear-gradient(180deg, #fff6fa 0%, #ffffff 100%); cursor:pointer; box-shadow:inset 0 0 0 1px rgba(242,231,236,.95), 0 10px 20px rgba(31,34,51,.06); transition:transform .22s ease, box-shadow .22s ease, filter .22s ease; }
.thumb-button:hover { transform:translateY(-2px); box-shadow:inset 0 0 0 1px rgba(255,111,134,.24), 0 14px 28px rgba(31,34,51,.1); }
.thumb-button.active { transform:translateX(2px); box-shadow:0 0 0 2px rgba(255,111,134,.32), 0 16px 30px rgba(255,117,105,.18); }
.thumb-image,.hero-image,.detail-image,.review-image,.preview-image { display:block; width:100%; height:100%; object-fit:cover; }
.hero-image-wrap { position:relative; min-height:540px; border-radius:30px; overflow:hidden; background:radial-gradient(circle at top left, rgba(255,255,255,.96), rgba(247,236,243,.88) 42%, rgba(241,247,255,.94) 100%); box-shadow:inset 0 0 0 1px rgba(255,255,255,.72); display:flex; align-items:center; justify-content:center; cursor:zoom-in; }
.hero-image-wrap::after { content:""; position:absolute; inset:auto 0 0 0; height:88px; background:linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,250,252,.9) 100%); pointer-events:none; }
.hero-image { position:relative; z-index:1; width:100%; height:100%; object-fit:contain; padding:18px; }
.hero-image-tip { position:absolute; right:18px; bottom:18px; z-index:2; padding:8px 14px; border-radius:999px; background:rgba(37,42,61,.68); color:#fff; font-size:12px; font-weight:700; letter-spacing:.4px; backdrop-filter:blur(10px); }
.info-topbar { display:flex; gap:10px; flex-wrap:wrap; }
.detail-chip { display:inline-flex; padding:8px 14px; border-radius:999px; background:#fff2f6; color:#ff5f92; font-size:11px; font-weight:800; letter-spacing:1.2px; }
.detail-chip-blind { background:rgba(255, 194, 125, 0.2); color:#ff7d4a; }
.detail-title { margin:18px 0 0; color:#202536; font-size:34px; line-height:1.2; font-weight:900; }
.detail-subtitle { margin:12px 0 0; color:#6d7687; font-size:14px; line-height:1.8; }
.price-card { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-top:22px; padding:18px 20px; border-radius:22px; background:linear-gradient(135deg, #fff8f2 0%, #fff4fa 100%); }
.price-main { color:#ff6b56; font-size:40px; font-weight:900; }
.original-price { margin-top:6px; color:#99a2b2; font-size:13px; text-decoration:line-through; }
.sales-text { color:#7d8497; font-size:13px; font-weight:700; }
.core-meta { display:grid; gap:12px; margin-top:18px; }
.meta-row { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:14px 16px; border-radius:18px; background:#fffafc; box-shadow:inset 0 0 0 1px #f4e8ee; }
.meta-label { color:#8b93a6; font-size:13px; }
.meta-value { color:#252a3d; font-size:15px; font-weight:800; text-align:right; }
.style-display-block { display:grid; gap:12px; margin-top:18px; }
.style-display-head { display:flex; align-items:center; justify-content:space-between; gap:12px; }
.style-card-grid { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:12px; }
.style-card { position:relative; display:flex; align-items:center; width:100%; min-height:58px; padding:14px 16px; border:none; border-radius:18px; background:#fff; box-shadow:inset 0 0 0 1px #e9e1e7; color:#1f2435; cursor:pointer; text-align:left; }
.style-card.disabled { opacity:.55; cursor:not-allowed; background:#faf8f9; }
.style-card.active { box-shadow:0 0 0 2px rgba(255,111,134,.22), inset 0 0 0 1px rgba(255,111,134,.28); background:linear-gradient(135deg, #fffafc 0%, #fff7f0 100%); }
.style-card__badge { position:absolute; top:-9px; left:16px; padding:2px 8px; border-radius:999px; background:#ff7b22; color:#fff; font-size:11px; font-weight:700; }
.style-card__title { font-size:14px; font-weight:700; line-height:1.5; }
.style-empty-tip { padding:14px 16px; border-radius:16px; background:#fff8f2; color:#c36a3a; font-size:13px; line-height:1.7; box-shadow:inset 0 0 0 1px #f5dfd1; }
.quantity-row { display:flex; align-items:center; gap:12px; margin-top:20px; }
.quantity-label { min-width:40px; }
.stock-tip { color:#7d8497; font-size:13px; }
.action-row { display:flex; gap:12px; margin-top:24px; }
.action-primary,.action-secondary,.action-ghost { height:46px; padding:0 22px; border:none; border-radius:999px; cursor:pointer; font-size:14px; font-weight:900; }
.action-primary { color:#fff; background:var(--mall-primary); box-shadow:0 14px 26px rgba(255, 117, 105, 0.22); }
.action-secondary { color:#2e3345; background:#fff; border:1px solid #ececf4; }
.action-ghost { color:#ff5f92; background:#fff3f8; border:1px solid #ffd9e5; }
.action-ghost.active { color:#fff; background:linear-gradient(90deg, #ff5f95 0%, #ff8d48 100%); }
.tab-panel { padding:8px 4px 4px; }
.review-list { display:grid; gap:16px; }
.review-item { padding:18px 20px; border-radius:20px; background:linear-gradient(135deg,#fff7f1 0%,#fffbfd 56%,#f2fcff 100%); box-shadow:inset 0 0 0 1px #f0ebef; }
.review-user-row { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
.review-user { color:#252a3d; font-size:15px; font-weight:900; }
.review-time { margin-top:6px; color:#8b93a6; font-size:12px; }
.review-content { margin-top:12px; color:#60697b; font-size:14px; line-height:1.9; white-space:pre-wrap; }
.review-images,.detail-image-list { display:flex; flex-wrap:wrap; gap:12px; margin-top:14px; }
.review-image { width:120px; height:120px; border-radius:16px; background:#fff; box-shadow:0 10px 24px rgba(31, 34, 51, 0.08); }
.param-list { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:14px; }
.param-item { display:flex; align-items:center; justify-content:space-between; gap:18px; padding:16px 18px; border-radius:18px; background:#fffafc; box-shadow:inset 0 0 0 1px #f2e8ee; }
.param-item span { color:#8b93a6; font-size:13px; }
.param-item strong { color:#252a3d; font-size:15px; font-weight:900; text-align:right; }
.rich-detail-text { color:#60697b; font-size:14px; line-height:1.95; white-space:pre-wrap; }
.rich-detail--stacked { display:grid; gap:18px; }
.detail-image-stream { display:grid; gap:18px; }
.detail-image-frame { margin:0; overflow:hidden; border-radius:22px; background:linear-gradient(180deg, #fff9fb 0%, #fff 100%); box-shadow:0 18px 32px rgba(31, 34, 51, 0.08), inset 0 0 0 1px #f2e8ee; }
.detail-image { width:220px; height:220px; border-radius:18px; background:#fff7fb; }
.detail-image--long { display:block; width:100%; height:auto; min-height:280px; max-height:none; border-radius:0; background:#fff; object-fit:cover; cursor:zoom-in; }
.preview-stage { display:flex; align-items:center; justify-content:center; min-height:72vh; padding:8px; background:radial-gradient(circle at top, rgba(255,250,252,.9) 0%, rgba(241,247,255,.9) 100%); border-radius:26px; overflow:hidden; }
.preview-image { width:100%; height:100%; max-height:72vh; object-fit:contain; }
@media (max-width:1100px) { .detail-layout { grid-template-columns:1fr; } .gallery-stage { grid-template-columns:1fr; } .thumb-rail { grid-template-columns:repeat(auto-fit, minmax(78px, 1fr)); max-height:none; overflow:visible; padding-right:0; } .thumb-button { width:100%; } .hero-image-wrap { min-height:420px; } }
@media (max-width:720px) { .gallery-panel,.info-panel,.detail-tabs { padding:18px; border-radius:22px; } .gallery-stage { grid-template-columns:1fr; } .thumb-rail { grid-template-columns:repeat(4, minmax(0, 1fr)); gap:10px; } .thumb-button { width:100%; height:72px; border-radius:18px; } .hero-image-wrap { min-height:300px; border-radius:22px; } .hero-image { padding:10px; } .hero-image-tip { right:12px; bottom:12px; padding:6px 12px; font-size:11px; } .detail-title { font-size:28px; } .price-card,.quantity-row,.review-user-row,.action-row { flex-direction:column; align-items:flex-start; } .param-list { grid-template-columns:1fr; } .detail-image { width:100%; height:240px; } .detail-image-frame { border-radius:18px; } .preview-stage { min-height:60vh; border-radius:18px; } }
</style>
