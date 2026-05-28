<template>
  <section class="brand-detail-page mall-surface-page" v-loading="loading">
    <div v-if="brand.id" class="brand-detail-page-inner">
      <div class="brand-hero mall-hover-lift">
        <div class="brand-logo-wrap">
          <img v-if="brand.logo" :src="resolveAssetUrl(brand.logo)" :alt="brand.name" class="brand-logo" />
          <div v-else class="brand-logo-fallback">{{ brand.name ? brand.name.charAt(0) : 'I' }}</div>
        </div>
        <div class="brand-copy">
          <h1 class="brand-title">{{ brand.name }}</h1>
          <p class="brand-subtitle">{{ brand.description || '潮玩收藏 IP' }}</p>
          <div class="brand-stats">
            <span class="brand-stat">{{ brand.productCount || 0 }} 件商品</span>
            <span class="brand-stat brand-stat--accent">{{ brand.description || 'IP 简介' }}</span>
          </div>
        </div>
      </div>

      <div class="brand-products-panel mall-hover-lift">
        <div class="panel-head">
          <h2 class="panel-title">IP 商品</h2>
          <el-button class="back-btn" plain @click="$router.push({ path: '/mall/brands' })">返回 IP 馆</el-button>
        </div>

        <el-empty v-if="loading && !products.length" description="正在加载 IP 商品" />
        <el-empty v-else-if="!products.length" description="该 IP 暂无商品" />

        <div v-else class="product-grid">
          <article v-for="item in products" :key="item.id" class="product-card" @click="goDetail(item)">
            <img :src="resolveAssetUrl(item.coverUrl) || fallback" :alt="item.name" class="product-cover" />
            <div class="product-body">
              <h3 class="product-name">{{ item.name }}</h3>
              <div class="product-foot">
                <span class="price">￥{{ formatPrice(item.price) }}</span>
              </div>
            </div>
          </article>
        </div>
        <div v-if="productTotal > productPageSize" class="pagination-wrap">
          <el-pagination background layout="prev, pager, next, total" :current-page="productPageNum" :page-size="productPageSize" :total="productTotal" @current-change="changeProductPage" />
        </div>
      </div>
    </div>

    <el-empty v-else description="IP 不存在或已停用" />
  </section>
</template>

<script>
import { api } from "../../api";
import { formatPrice } from "../../utils/mall";
import { resolveAssetUrl } from "../../utils/asset";

export default {
  name: "BrandDetailPage",
  data() {
    return {
      loading: false,
      brand: {},
      products: [],
      productPageNum: 1,
      productPageSize: 12,
      productTotal: 0,
      fallback: "https://dummyimage.com/600x600/f8eef2/9c96a5&text=Toy"
    };
  },
  watch: {
    "$route.params.id": {
      immediate: true,
      handler() {
        this.loadBrand();
      }
    }
  },
  methods: {
    formatPrice,
    resolveAssetUrl,
    async loadBrand() {
      this.loading = true;
      try {
        const id = this.$route.params.id;
        const [productsRes, brandsRes] = await Promise.all([
          api.productList({ brandId: id, pageNum: this.productPageNum, pageSize: this.productPageSize }),
          api.brands()
        ]);

        const brands = Array.isArray(brandsRes?.data) ? brandsRes.data : Array.isArray(brandsRes) ? brandsRes : [];
        this.brand = brands.find(item => Number(item.id) === Number(id)) || {};
        this.products = (productsRes && productsRes.records) || [];
        this.productTotal = Number(productsRes && productsRes.total) || 0;
      } finally {
        this.loading = false;
      }
    },
    goDetail(product) {
      this.$router.push(`/mall/product/${product.id}`);
    },
    async changeProductPage(page) {
      this.productPageNum = page;
      await this.loadBrand();
    }
  }
};
</script>

<style scoped>
.brand-detail-page { display:grid; gap:20px; }
.brand-detail-page-inner { display:grid; gap:20px; }
.brand-hero, .brand-products-panel { padding:24px; border-radius:24px; border:1px solid var(--mall-card-border); background:var(--mall-card-bg); box-shadow:var(--mall-shadow); }
.brand-hero { display:flex; gap:18px; align-items:center; }
.brand-logo-wrap { width:92px; height:92px; border-radius:20px; overflow:hidden; background:linear-gradient(180deg,#fff8fb 0%,#fff 100%); display:grid; place-items:center; flex-shrink:0; }
.brand-logo { width:100%; height:100%; object-fit:contain; }
.brand-logo-fallback { width:52px; height:52px; border-radius:50%; display:grid; place-items:center; background:linear-gradient(135deg, #ff5f95 0%, #ff9d42 55%, #38d9ff 100%); color:#fff; font-size:22px; font-weight:900; }
.brand-title { margin:0; color:#202536; font-size:28px; font-weight:900; }
.brand-subtitle { margin:8px 0 0; color:#6f7789; font-size:14px; line-height:1.8; }
.brand-stats { display:flex; gap:10px; flex-wrap:wrap; margin-top:12px; }
.brand-stat { display:inline-flex; padding:7px 12px; border-radius:999px; background:#eef8ff; color:#2b6cb0; font-size:12px; font-weight:800; }
.brand-stat--accent { background:#fff3f7; color:#ff5f92; }
.panel-head { display:flex; justify-content:space-between; gap:16px; align-items:center; margin-bottom:16px; }
.panel-title { margin:0; color:#202536; font-size:24px; font-weight:900; }
.back-btn { border-radius:999px; }
.product-grid { display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:18px; }
.product-card { border-radius:20px; overflow:hidden; border:1px solid #f0e7ea; background:#fff; cursor:pointer; }
.product-cover { width:100%; aspect-ratio:1/1; object-fit:cover; display:block; }
.product-body { padding:14px; }
.product-name { margin:0; color:#202536; font-size:16px; font-weight:900; line-height:1.5; }
.product-foot { display:flex; justify-content:space-between; gap:10px; margin-top:10px; }
.price { color:#ff5f92; font-size:18px; font-weight:900; }
@media (max-width: 1100px) { .product-grid { grid-template-columns:repeat(3, minmax(0, 1fr)); } }
@media (max-width: 860px) { .brand-hero { flex-direction:column; align-items:flex-start; } .product-grid { grid-template-columns:repeat(2, minmax(0, 1fr)); } .back-btn { width:100%; } }
@media (max-width: 560px) { .brand-hero, .brand-products-panel { border-radius:20px; padding:18px; } .product-grid { grid-template-columns:1fr; } }
</style>
