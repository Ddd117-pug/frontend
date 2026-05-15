<template>
  <section class="cart-page mall-surface-page" v-loading="loading">
    <div class="cart-hero mall-hover-lift">
      <div>
        <div class="hero-chip">CART · READY TO CHECK OUT</div>
        <h1 class="hero-title">购物车</h1>
        <p class="hero-desc">整理你已加入的潮玩单品，确认数量后即可快速结算。</p>
      </div>
      <div class="hero-stats">
        <div class="stat-card">
          <span>商品件数</span>
          <strong>{{ totalNum }}</strong>
        </div>
        <div class="stat-card stat-card-accent">
          <span>合计金额</span>
          <strong>￥{{ totalAmount }}</strong>
        </div>
      </div>
    </div>

    <div v-if="list.length" class="cart-layout">
      <div class="cart-list-card mall-hover-lift">
        <div class="section-head">
          <div>
            <div class="section-chip">SHOPPING LIST</div>
            <h2 class="section-title">已选商品</h2>
          </div>
          <div class="section-tip">支持直接修改数量或移除商品</div>
        </div>

        <article v-for="item in list" :key="item.id" class="cart-item">
          <div class="item-cover-wrap" @click="goDetail(item)">
            <img :src="resolveAssetUrl(item.coverUrl) || fallback" :alt="item.productName" class="item-cover" />
          </div>

          <div class="item-main">
            <div class="item-info">
              <h3 class="item-title" @click="goDetail(item)">{{ item.productName }}</h3>
              <p class="item-meta">{{ item.material || "精选材质" }} · {{ item.size || "默认规格" }}</p>
              <p v-if="item.styleOption" class="item-style">{{ item.styleOption }}</p>
              <div class="item-price-row">
                <span class="item-price">￥{{ formatPrice(item.price) }}</span>
                <span class="item-unit">单价</span>
              </div>
            </div>

            <div class="item-actions">
              <div class="qty-panel">
                <span class="qty-label">数量</span>
                <el-input-number :value="item.num" :min="1" size="small" @change="value => changeQty(item, value)" />
              </div>

              <div class="subtotal-panel">
                <span class="subtotal-label">小计</span>
                <strong class="subtotal-value">￥{{ formatPrice(item.totalPrice) }}</strong>
              </div>

              <button class="remove-btn" @click="removeItem(item)">删除</button>
            </div>
          </div>
        </article>
      </div>

      <aside class="checkout-card mall-hover-lift">
        <div class="section-chip">ORDER SUMMARY</div>
        <h2 class="checkout-title">订单汇总</h2>

        <div class="summary-row">
          <span>商品总数</span>
          <strong>{{ totalNum }} 件</strong>
        </div>
        <div class="summary-row">
          <span>商品种类</span>
          <strong>{{ list.length }} 种</strong>
        </div>
        <div class="summary-row total-row">
          <span>应付总额</span>
          <strong>￥{{ totalAmount }}</strong>
        </div>

        <button class="checkout-btn" @click="checkout">去结算</button>
      </aside>
    </div>

    <div v-else class="empty-card mall-hover-lift">
      <el-empty description="购物车还是空的，先去挑几件喜欢的商品吧">
        <el-button type="primary" @click="$router.push('/product/list')">去逛商品</el-button>
      </el-empty>
    </div>
  </section>
</template>

<script>
import { api } from "../../api";
import { formatPrice } from "../../utils/mall";
import { resolveAssetUrl } from "../../utils/asset";

export default {
  name: "CartPage",
  data() {
    return {
      loading: false,
      list: [],
      fallback: "https://dummyimage.com/520x520/f8eef2/9c96a5&text=Toy"
    };
  },
  computed: {
    totalNum() {
      return this.list.reduce((sum, item) => sum + (item.num || 0), 0);
    },
    totalAmount() {
      return this.list.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0).toFixed(2);
    }
  },
  async created() {
    await this.loadCart();
  },
  methods: {
    formatPrice,
    resolveAssetUrl,
    async loadCart() {
      this.loading = true;
      try {
        this.list = (await api.cartList()) || [];
        this.$root.$emit("cart-updated");
      } finally {
        this.loading = false;
      }
    },
    async changeQty(item, value) {
      if (!value || value < 1) return;
      await api.cartUpdate(item.id, { num: value });
      await this.loadCart();
      this.$message.success("数量已更新");
    },
    async removeItem(item) {
      await api.cartDelete(item.id);
      await this.loadCart();
      this.$message.success("商品已移出购物车");
    },
    goDetail(item) {
      this.$router.push(`/product/detail/${item.productId}`);
    },
    checkout() {
      if (!this.list.length) {
        this.$message.warning("购物车为空");
        return;
      }
      this.$router.push("/mall/cart");
    }
  }
};
</script>

<style scoped>
.cart-page { display:grid; gap:22px; }
.cart-hero,.cart-list-card,.checkout-card,.empty-card { position:relative; overflow:hidden; border-radius:28px; border:1px solid var(--mall-card-border); box-shadow:var(--mall-shadow); }
.cart-hero,.empty-card { background:var(--mall-soft-card); }
.cart-list-card,.checkout-card { background:var(--mall-card-bg); }
.cart-hero { display:grid; grid-template-columns:1.18fr 0.82fr; gap:24px; padding:30px; }
.hero-chip,.section-chip { display:inline-flex; align-items:center; padding:8px 14px; border-radius:999px; background:rgba(255,255,255,.76); color:#ff5f92; font-size:11px; font-weight:800; letter-spacing:1.6px; }
.hero-title,.section-title,.checkout-title { margin:14px 0 0; color:var(--mall-text); font-weight:900; }
.hero-title { font-size:40px; line-height:1.08; }
.hero-desc { margin-top:14px; color:var(--mall-subtext); font-size:15px; line-height:1.9; }
.hero-stats { display:grid; gap:14px; align-content:center; }
.stat-card { padding:22px; border-radius:22px; background:rgba(255,255,255,.72); box-shadow:inset 0 0 0 1px rgba(255,255,255,.82); }
.stat-card span,.section-tip,.summary-row span,.qty-label,.subtotal-label,.item-unit { color:var(--mall-soft); font-size:13px; }
.stat-card strong { display:block; margin-top:10px; color:var(--mall-text); font-size:28px; }
.stat-card-accent { background:linear-gradient(135deg, rgba(255, 104, 141, 0.12) 0%, rgba(255, 170, 92, 0.16) 100%); }
.cart-layout { display:grid; grid-template-columns:minmax(0, 1fr) 340px; gap:22px; align-items:start; }
.cart-list-card { padding:28px; }
.section-head { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:20px; }
.section-title,.checkout-title { font-size:28px; }
.cart-item { display:grid; grid-template-columns:132px minmax(0, 1fr); gap:18px; padding:18px; border-radius:24px; background:linear-gradient(135deg, #fff8f3 0%, #fffcfe 56%, #f3fbff 100%); box-shadow:inset 0 0 0 1px #f0ebef; }
.cart-item + .cart-item { margin-top:16px; }
.item-cover-wrap { cursor:pointer; }
.item-cover { display:block; width:100%; height:132px; object-fit:cover; border-radius:18px; }
.item-main { display:flex; align-items:center; justify-content:space-between; gap:18px; }
.item-info { min-width:0; }
.item-title { margin:0; color:#252a3d; font-size:20px; font-weight:900; cursor:pointer; }
.item-title:hover { color:#ff5f92; }
.item-meta { margin:10px 0 0; color:#7b8495; font-size:13px; }
.item-style { margin:8px 0 0; color:#ff7d4a; font-size:13px; font-weight:700; }
.item-price-row { margin-top:16px; display:flex; align-items:baseline; gap:10px; }
.item-price,.subtotal-value { color:#ff6b56; font-weight:900; }
.item-price { font-size:28px; }
.item-actions { display:flex; align-items:center; gap:18px; flex-wrap:wrap; justify-content:flex-end; }
.qty-panel,.subtotal-panel { display:grid; gap:8px; justify-items:end; }
.subtotal-value { font-size:24px; }
.remove-btn,.checkout-btn { border:none; border-radius:999px; font-weight:800; cursor:pointer; transition:transform .2s ease, box-shadow .2s ease, opacity .2s ease; }
.remove-btn { height:42px; padding:0 18px; background:rgba(255, 95, 149, 0.08); color:#ff5f92; }
.checkout-card { padding:28px; position:sticky; top:96px; }
.summary-row { display:flex; align-items:center; justify-content:space-between; padding:16px 0; border-bottom:1px solid #eef1f6; }
.summary-row strong { color:var(--mall-text); font-size:16px; }
.total-row { margin-top:6px; }
.total-row strong { color:#ff6b56; font-size:28px; font-weight:900; }
.checkout-btn { width:100%; height:50px; margin-top:22px; background:var(--mall-primary); color:#fff; box-shadow:0 16px 30px rgba(255, 117, 105, 0.24); }
.empty-card { padding:36px; }
@media (max-width:1100px) { .cart-layout,.cart-hero { grid-template-columns:1fr; } .checkout-card { position:static; } }
@media (max-width:760px) { .cart-list-card,.checkout-card,.cart-hero,.empty-card { padding:20px; border-radius:22px; } .hero-title { font-size:30px; } .section-head,.item-main { display:grid; } .cart-item { grid-template-columns:1fr; } .item-cover { height:220px; } .item-actions,.qty-panel,.subtotal-panel { justify-items:start; justify-content:flex-start; } }
</style>
