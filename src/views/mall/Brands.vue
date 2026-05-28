<template>
  <section class="brand-gallery-page mall-surface-page">
    <div class="brand-hero mall-hover-lift">
      <div>
        <div class="brand-chip">IP</div>
        <h1 class="brand-title">IP馆</h1>
        <p class="brand-subtitle">浏览 IP 并进入对应商品列表。</p>
        <div class="brand-stats">
          <span class="brand-stat">共 {{ totalBrands }} 个 IP</span>
          <span class="brand-stat brand-stat--accent">当前显示 {{ visibleBrands.length }} 个 IP</span>
        </div>
      </div>
      <el-input
        v-model="keyword"
        clearable
        placeholder="搜索 IP 名称"
        class="brand-search"
        @input="filterBrands"
      >
        <el-button slot="append" icon="el-icon-search"></el-button>
      </el-input>
    </div>

    <div class="brand-grid">
      <article v-for="brand in visibleBrands" :key="brand.id" class="brand-card mall-hover-lift" @click="goBrandProducts(brand)">
        <div class="brand-logo-wrap">
          <img v-if="brand.logo" :src="resolveAssetUrl(brand.logo)" :alt="brand.name" class="brand-logo" />
          <div v-else class="brand-logo-fallback">{{ brand.name ? brand.name.charAt(0) : 'I' }}</div>
        </div>
        <div class="brand-card__body">
          <h3 class="brand-name">{{ brand.name }}</h3>
          <p class="brand-desc">{{ brand.description || '潮玩收藏 IP' }}</p>
          <span class="brand-count">{{ brand.productCount || 0 }} 件商品</span>
        </div>
      </article>
    </div>

    <el-empty v-if="!loading && !visibleBrands.length" description="没有找到匹配的 IP" />
  </section>
</template>

<script>
import { api } from "../../api";
import { resolveAssetUrl } from "../../utils/asset";

export default {
  name: "BrandGalleryPage",
  data() {
    return {
      loading: false,
      keyword: "",
      allBrands: [],
      visibleBrands: []
    };
  },
  computed: {
    totalBrands() {
      return (this.allBrands || []).length;
    }
  },
  async created() {
    await this.loadBrands();
  },
  methods: {
    resolveAssetUrl,
    async loadBrands() {
      this.loading = true;
      try {
        const res = await api.brands();
        this.allBrands = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        this.filterBrands();
      } finally {
        this.loading = false;
      }
    },
    filterBrands() {
      const keyword = String(this.keyword || "").trim().toLowerCase();
      this.visibleBrands = (this.allBrands || [])
        .filter(item => {
          const name = String(item.name || "").toLowerCase();
          return !keyword || name.includes(keyword);
        })
        .sort((a, b) => Number(b.productCount || 0) - Number(a.productCount || 0));
    },
    goBrandProducts(brand) {
      this.$router.push({ path: "/mall/products", query: { brandId: brand.id, brandName: brand.name } });
    }
  }
};
</script>

<style scoped>
.brand-gallery-page { display:grid; gap:20px; }
.brand-hero { display:flex; justify-content:space-between; gap:20px; padding:28px; border-radius:28px; background:linear-gradient(135deg, rgba(255,95,149,.12) 0%, rgba(255,164,66,.12) 52%, rgba(56,217,255,.12) 100%); border:1px solid var(--mall-card-border); box-shadow:var(--mall-shadow); }
.brand-chip { display:inline-flex; padding:7px 12px; border-radius:999px; background:#fff; color:#ff5f92; font-size:11px; font-weight:800; letter-spacing:1.4px; }
.brand-title { margin:12px 0 0; color:#202536; font-size:32px; font-weight:900; }
.brand-subtitle { margin:10px 0 0; color:#6f7789; font-size:14px; line-height:1.8; }
.brand-stats { display:flex; gap:10px; flex-wrap:wrap; margin-top:12px; }
.brand-stat { display:inline-flex; padding:7px 12px; border-radius:999px; background:#eef8ff; color:#2b6cb0; font-size:12px; font-weight:800; }
.brand-stat--accent { background:#fff3f7; color:#ff5f92; }
.brand-search { width:320px; align-self:flex-start; }
.brand-search :deep(.el-input__inner) { border-radius:14px 0 0 14px; }
.brand-search :deep(.el-input-group__append) { border-radius:0 14px 14px 0; }
.brand-grid { display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:18px; }
.brand-card { overflow:hidden; border-radius:24px; background:var(--mall-card-bg); border:1px solid var(--mall-card-border); box-shadow:var(--mall-shadow); cursor:pointer; }
.brand-logo-wrap { height:180px; background:linear-gradient(180deg, #fff8fb 0%, #fff 100%); display:grid; place-items:center; }
.brand-logo { max-width:100%; max-height:100%; object-fit:contain; }
.brand-logo-fallback { width:88px; height:88px; border-radius:50%; display:grid; place-items:center; background:linear-gradient(135deg, #ff5f95 0%, #ff9d42 55%, #38d9ff 100%); color:#fff; font-size:34px; font-weight:900; }
.brand-card__body { padding:18px; display:grid; gap:8px; }
.brand-name { margin:0; color:#202536; font-size:18px; font-weight:900; }
.brand-desc { margin:0; color:#6f7789; font-size:13px; line-height:1.6; min-height:42px; }
.brand-count { display:inline-flex; justify-self:start; padding:6px 10px; border-radius:999px; background:#eef8ff; color:#2b6cb0; font-size:12px; font-weight:800; white-space:nowrap; }
@media (max-width: 1200px) { .brand-grid { grid-template-columns:repeat(3, minmax(0, 1fr)); } }
@media (max-width: 860px) { .brand-hero { flex-direction:column; } .brand-search { width:100%; } .brand-grid { grid-template-columns:repeat(2, minmax(0, 1fr)); } }
@media (max-width: 560px) { .brand-grid { grid-template-columns:1fr; } .brand-hero { border-radius:22px; } }
</style>
