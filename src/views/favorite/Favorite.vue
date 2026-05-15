<template>
  <section class="collect-page mall-surface-page" v-loading="loading">
    <div class="hero mall-hover-lift">
      <div>
        <div class="chip">MY COLLECT · TREASURE BOARD</div>
        <h1 class="title">收藏夹</h1>
      </div>
      <div class="hero-stats">
        <div class="stat"><span>当前收藏</span><strong>{{ filteredList.length }}</strong></div>
      </div>
    </div>

    <div class="filters mall-hover-lift">
      <div class="controls">
        <el-select v-model="selectedCategory" size="small" class="select"><el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select>
        <el-select v-model="selectedStatus" size="small" class="select"><el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select>
        <el-select v-model="sortType" size="small" class="select"><el-option v-for="item in sortOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select>
      </div>
    </div>

    <div v-if="filteredList.length" class="collect-grid">
      <article v-for="item in filteredList" :key="item.id" class="card mall-hover-lift">
        <div class="cover-wrap" @click="goDetail(item)">
          <img :src="resolveAssetUrl(item.coverUrl) || fallback" :alt="item.name" class="cover" />
          <div class="overlay">
            <button class="remove-top" @click.stop="remove(item)">取消收藏</button>
          </div>
        </div>
        <div class="body">
          <h3 class="name" @click="goDetail(item)">{{ item.name }}</h3>
          <p class="sub">{{ item.subTitle || item.description || '限定潮玩收藏单品，适合展示、送礼和加入你的收藏柜。' }}</p>
          <div class="price-row">
            <div class="prices">
              <strong class="price">￥{{ formatPrice(item.price) }}</strong>
              <span v-if="item.originalPrice" class="origin">￥{{ formatPrice(item.originalPrice) }}</span>
            </div>
            <span class="status" :class="`s-${item.collectStatus}`">{{ getStatusLabel(item.collectStatus) }}</span>
          </div>
          <div class="meta compact-meta">
            <div class="meta-item"><span>店铺</span><strong>{{ item.shopName }}</strong></div>
            <div class="meta-item"><span>商品类型</span><strong>{{ item.categoryLabel }}</strong></div>
          </div>
          <div class="actions">
            <button class="ghost" @click="findSimilar(item)">找相似</button>
            <button class="primary" @click="goDetail(item)">查看详情</button>
          </div>
        </div>
      </article>
    </div>

    <div v-else class="empty mall-hover-lift">
      <el-empty description="当前筛选下暂无收藏商品，换个条件试试吧"><el-button type="primary" @click="resetFilters">重置筛选</el-button></el-empty>
    </div>
  </section>
</template>

<script>
import { api } from "../../api";
import { formatPrice } from "../../utils/mall";
import { resolveAssetUrl } from "../../utils/asset";

export default {
  name: "FavoritePage",
  data() {
    return {
      loading: false,
      list: [],
      selectedCategory: "all",
      selectedStatus: "all",
      sortType: "time-desc",
      fallback: "https://dummyimage.com/640x760/f8eef2/9c96a5&text=Toy",
      statusOptions: [
        { value: "all", label: "宝贝状态：全部" },
        { value: "available", label: "宝贝状态：在售" },
        { value: "soldout", label: "宝贝状态：补货中" }
      ],
      sortOptions: [
        { value: "time-desc", label: "收藏时间：最近收藏" },
        { value: "time-asc", label: "收藏时间：最早收藏" },
        { value: "price-asc", label: "价格：由低到高" },
        { value: "price-desc", label: "价格：由高到低" }
      ]
    };
  },
  computed: {
    categoryOptions() {
      const map = new Map();
      this.list.forEach(item => map.set(item.categoryKey, item.categoryLabel));
      return [{ value: "all", label: "宝贝分类：全部" }].concat(Array.from(map.entries()).map(([value, label]) => ({ value, label: `宝贝分类：${label}` })));
    },
    filteredList() {
      let result = [...this.list];
      if (this.selectedCategory !== "all") result = result.filter(item => item.categoryKey === this.selectedCategory);
      if (this.selectedStatus !== "all") result = result.filter(item => item.collectStatus === this.selectedStatus);
      return result.sort((a, b) => this.sortList(a, b));
    }
  },
  async created() {
    await this.load();
  },
  methods: {
    formatPrice,
    resolveAssetUrl,
    async load() {
      this.loading = true;
      try {
        const list = (await api.favoriteList()) || [];
        this.list = list.map(this.decorateFavorite);
        this.$store.commit("SET_FAVORITES", this.list.map(item => item.id));
      } finally {
        this.loading = false;
      }
    },
    decorateFavorite(item) {
      const categoryLabel = item.material || (Number(item.isBlindBox) === 1 ? "惊喜盲盒" : "精选手办");
      return {
        ...item,
        favoriteTime: item.favoriteTime,
        categoryKey: categoryLabel,
        categoryLabel,
        collectStatus: Number(item.stock) > 0 ? "available" : "soldout",
        shopName: "潮玩商城官方店"
      };
    },
    sortList(a, b) {
      const aTime = a.favoriteTime ? new Date(a.favoriteTime).getTime() : 0;
      const bTime = b.favoriteTime ? new Date(b.favoriteTime).getTime() : 0;
      if (this.sortType === "time-asc") return aTime - bTime;
      if (this.sortType === "price-asc") return Number(a.price || 0) - Number(b.price || 0);
      if (this.sortType === "price-desc") return Number(b.price || 0) - Number(a.price || 0);
      return bTime - aTime;
    },
    getStatusLabel(status) {
      return { available: "在售", soldout: "补货中" }[status] || "在售";
    },
    resetFilters() {
      this.selectedCategory = "all";
      this.selectedStatus = "all";
      this.sortType = "time-desc";
    },
    goDetail(item) {
      this.$router.push(`/mall/product/${item.id}`);
    },
    async remove(item) {
      await api.removeFavorite(item.id);
      this.list = this.list.filter(product => product.id !== item.id);
      this.$store.commit("REMOVE_FAVORITE", item.id);
      this.$message.success("已取消收藏");
    },
    findSimilar(item) {
      this.$router.push({ path: "/mall/products", query: { keyword: item.name } });
    }
  }
};
</script>

<style scoped>
.collect-page{display:grid;gap:22px}.hero,.filters,.empty{position:relative;overflow:hidden;border-radius:28px;border:1px solid var(--mall-card-border);box-shadow:var(--mall-shadow)}.hero,.empty{padding:30px;background:var(--mall-soft-card)}.filters{padding:22px 24px;background:var(--mall-card-bg);display:grid;gap:16px}.hero{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:24px;align-items:center}.chip{display:inline-flex;align-items:center;justify-content:center;border-radius:999px;font-size:11px;font-weight:800;letter-spacing:1.4px;padding:8px 14px;background:rgba(255,255,255,.76);color:#ff5f92}.title{margin:14px 0 0;color:var(--mall-text);font-size:42px;line-height:1.06;font-weight:900}.hero-stats{display:grid;gap:14px}.stat{padding:22px;border-radius:24px;background:rgba(255,255,255,.76);box-shadow:inset 0 0 0 1px rgba(255,255,255,.82)}.stat span,.meta-item span{color:var(--mall-soft);font-size:13px}.stat strong{display:block;margin-top:10px;color:var(--mall-text);font-size:30px}.controls{display:flex;flex-wrap:wrap;gap:12px}.select{width:190px}.select :deep(.el-input__inner){height:40px;border-radius:999px;border:1px solid #eceaf1;background:#fff}.collect-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px}.card{overflow:hidden;border-radius:24px;background:linear-gradient(135deg,#fff8f2 0%,#fffbfd 52%,#f2fcff 100%);box-shadow:inset 0 0 0 1px #f0ebef,0 18px 32px rgba(35,34,67,.08)}.cover-wrap{position:relative;padding:12px 12px 0;cursor:pointer}.cover{display:block;width:100%;height:220px;border-radius:18px;object-fit:cover}.overlay{position:absolute;top:20px;left:20px;right:20px;display:flex;justify-content:flex-end;gap:10px;align-items:flex-start}.remove-top,.ghost,.primary{border:none;border-radius:999px;font-weight:800;cursor:pointer;transition:transform .22s ease,box-shadow .22s ease,filter .22s ease}.remove-top{height:30px;padding:0 12px;color:#ff5f92;background:rgba(255,255,255,.94);box-shadow:0 8px 16px rgba(31,34,51,.1);font-size:12px}.body{padding:14px 14px 16px}.name{margin:0;color:#252a3d;font-size:16px;font-weight:900;cursor:pointer}.sub{margin-top:8px;min-height:38px;color:#727b8d;font-size:12px;line-height:1.6;display:-webkit-box;overflow:hidden;-webkit-line-clamp:2;-webkit-box-orient:vertical}.price-row{margin-top:12px;display:flex;align-items:center;justify-content:space-between;gap:8px}.prices{display:flex;align-items:flex-end;gap:8px;flex-wrap:wrap}.price{color:#ff6b56;font-size:24px;font-weight:900}.origin{color:#a6adbd;font-size:12px;text-decoration:line-through}.status{padding:5px 8px;border-radius:999px;font-size:11px;font-weight:800}.s-available{color:#17a46f;background:rgba(23,164,111,.12)}.s-soldout{color:#7a8395;background:rgba(122,131,149,.14)}.meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px}.compact-meta .meta-item{padding:12px 12px}.meta-item{padding:12px;border-radius:16px;background:rgba(255,255,255,.76);box-shadow:inset 0 0 0 1px rgba(240,235,239,.92)}.meta-item strong{display:block;margin-top:6px;color:#2d3345;font-size:14px;line-height:1.3;word-break:break-word}.actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:14px}.ghost,.primary{height:36px;padding:0 10px;font-size:12px}.ghost{color:#ff5f92;background:rgba(255,255,255,.82);box-shadow:inset 0 0 0 1px #f0d9e4}.primary{color:#fff;background:var(--mall-primary);box-shadow:0 14px 28px rgba(255,117,105,.22)}.empty{padding:36px}.ghost:hover,.primary:hover,.remove-top:hover{transform:translateY(-1px) scale(1.02);box-shadow:0 14px 28px rgba(255,117,105,.18)}@media (max-width:1200px){.collect-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media (max-width:1100px){.hero{grid-template-columns:1fr}}@media (max-width:860px){.collect-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.actions{grid-template-columns:1fr}}@media (max-width:760px){.hero,.filters,.empty{padding:20px;border-radius:24px}.title{font-size:32px}.select{width:100%}.controls{display:grid;grid-template-columns:1fr}.collect-grid{grid-template-columns:1fr}.meta{grid-template-columns:1fr}.cover{height:210px}}
</style>
