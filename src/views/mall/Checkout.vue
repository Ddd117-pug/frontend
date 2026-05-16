<template>
  <section class="checkout-page mall-surface-page" v-loading="loading">
    <div class="checkout-shell mall-hover-lift">
      <div class="checkout-head">
        <div>
          <div class="checkout-chip">结算页</div>
          <h1 class="checkout-title">确认订单</h1>
          <p class="checkout-subtitle">请确认商品、收货地址与支付方式后提交订单。</p>
        </div>
        <el-button plain icon="el-icon-arrow-left" @click="goBack">返回商品</el-button>
      </div>

      <div v-if="!orderSuccess && product.id" class="checkout-grid">
        <div class="checkout-main">
          <div class="checkout-card">
            <div class="card-title">商品信息</div>
            <div class="product-row">
              <img :src="product.coverUrl || fallback" :alt="product.name" class="product-image" />
              <div class="product-meta">
                <div class="product-name">{{ product.name }}</div>
                <div class="product-desc">{{ product.subTitle || '商品信息' }}</div>
                <div class="product-spec">{{ styleOption || '未选择款式' }} × {{ quantity }}</div>
              </div>
              <div class="product-price">¥{{ totalAmount.toFixed(2) }}</div>
            </div>
          </div>

          <div class="checkout-card">
            <div class="card-title address-card-head">
              <span>收货地址</span>
              <div class="address-card-actions">
                <el-button size="mini" plain @click="openAddressPicker">切换地址</el-button>
                <el-button size="mini" plain @click="$router.push('/mall/addresses')">管理地址</el-button>
              </div>
            </div>
            <div v-if="selectedAddress.id" class="address-box">
              <div class="address-top">
                <strong>{{ selectedAddress.receiverName }}</strong>
                <span>{{ selectedAddress.receiverPhone }}</span>
              </div>
              <div class="address-detail">{{ formatAddress(selectedAddress) }}</div>
              <div class="address-meta">{{ selectedAddress.isDefault ? '默认地址' : '当前选择' }}</div>
            </div>
            <el-empty v-else description="暂无地址" />
          </div>

          <div class="checkout-card">
            <div class="card-title">支付方式</div>
            <el-radio-group v-model="payType">
              <el-radio :label="0">余额支付</el-radio>
              <el-radio :label="1">微信支付</el-radio>
              <el-radio :label="2">支付宝支付</el-radio>
            </el-radio-group>
          </div>
        </div>

        <aside class="checkout-sidebar">
          <div class="summary-card">
            <div class="card-title">结算摘要</div>
            <div class="summary-line"><span>商品金额</span><strong>¥{{ totalAmount.toFixed(2) }}</strong></div>
            <div class="summary-line"><span>运费</span><strong>¥0.00</strong></div>
            <div class="summary-total"><span>应付金额</span><strong>¥{{ totalAmount.toFixed(2) }}</strong></div>
            <el-button type="warning" class="submit-btn" :loading="submitting" :disabled="!selectedAddress.id" @click="submitOrder">提交订单</el-button>
          </div>
        </aside>
      </div>

      <el-drawer
        title="选择收货地址"
        :visible.sync="addressPickerVisible"
        direction="rtl"
        size="420px"
        append-to-body
        custom-class="address-drawer"
      >
        <div class="address-drawer-body">
          <div v-if="addressLoading" class="address-picker-empty">地址加载中...</div>
          <div v-else-if="addressList.length" class="address-picker-list">
            <button
              v-for="item in addressList"
              :key="item.id"
              type="button"
              class="address-picker-item"
              :class="{ active: selectedAddress.id === item.id }"
              @click="selectAddress(item)"
            >
              <div class="address-picker-item__top">
                <strong>{{ item.receiverName }}</strong>
                <span>{{ item.receiverPhone }}</span>
                <span v-if="item.isDefault" class="address-badge">默认</span>
              </div>
              <div class="address-picker-item__detail">{{ formatAddress(item) }}</div>
            </button>
          </div>
          <el-empty v-else description="暂无收货地址，请先添加" />
        </div>
        <div class="address-drawer-footer">
          <el-button @click="addressPickerVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmSelectedAddress">使用该地址</el-button>
        </div>
      </el-drawer>

      <div v-if="orderSuccess" class="success-card mall-hover-lift">
        <div class="success-icon">✓</div>
        <h2 class="success-title">支付成功</h2>
        <p class="success-desc">订单已创建并完成支付，你可以继续浏览商品或查看订单详情。</p>
        <div class="success-actions">
          <el-button type="primary" @click="$router.push('/mall/products')">继续逛逛</el-button>
          <el-button plain @click="goToOrderDetail">查看订单</el-button>
        </div>
      </div>
      <el-empty v-else-if="!product.id" description="商品不存在或已下架" />
    </div>
  </section>
</template>

<script>
import { api } from '../../api';

export default {
  name: 'CheckoutView',
  data() {
    return {
      loading: false,
      submitting: false,
      product: {},
      defaultAddress: {},
      selectedAddress: {},
      addressList: [],
      addressLoading: false,
      addressPickerVisible: false,
      quantity: 1,
      styleOption: '',
      payType: 1,
      orderSuccess: false,
      orderId: null,
      fallback: 'https://dummyimage.com/720x720/f8eef2/9c96a5&text=Toy'
    };
  },
  computed: {
    totalAmount() {
      const price = Number(this.product.price || 0);
      return price * Number(this.quantity || 1);
    }
  },
  watch: {
    '$route.query': {
      immediate: true,
      handler() {
        this.loadPage();
      }
    }
  },
  methods: {
    async loadPage() {
      const productId = Number(this.$route.query.productId);
      if (!productId) return;
      this.loading = true;
      try {
        const [product, addressList] = await Promise.all([api.productDetail(productId), api.addressList()]);
        this.product = product || {};
        this.addressList = Array.isArray(addressList) ? addressList : [];
        this.selectedAddress = this.pickInitialAddress(this.addressList);
        this.quantity = Math.max(1, Number(this.$route.query.num) || 1);
        this.styleOption = this.$route.query.styleOption || '';
        this.payType = Number(this.$route.query.payType || 1);
        this.orderSuccess = false;
        this.orderId = null;
      } finally {
        this.loading = false;
      }
    },
    pickInitialAddress(list) {
      if (!Array.isArray(list) || !list.length) return {};
      return list.find(item => item.isDefault) || list[0] || {};
    },
    formatAddress(item) {
      return [item.province, item.city, item.district, item.detail].filter(Boolean).join(' ');
    },
    openAddressPicker() {
      if (!this.addressList.length) {
        this.$message.warning('暂无收货地址，请先添加');
        this.$router.push('/mall/addresses');
        return;
      }
      this.addressPickerVisible = true;
    },
    selectAddress(item) {
      this.selectedAddress = item || {};
    },
    confirmSelectedAddress() {
      if (!this.selectedAddress.id) {
        this.$message.warning('请选择一个收货地址');
        return;
      }
      this.addressPickerVisible = false;
    },
    goBack() {
      if (window.history.length > 1) {
        this.$router.back();
        return;
      }
      this.$router.push(`/mall/product/${this.product.id || this.$route.query.productId || ''}`);
    },
    goToOrderDetail() {
      if (this.orderId) {
        this.$router.push({ path: '/mall/orders', query: { orderId: this.orderId } });
        return;
      }
      this.$router.push('/mall/orders');
    },
    async submitOrder() {
      if (!this.selectedAddress.id) {
        this.$message.warning('请先选择收货地址');
        this.$router.push('/mall/addresses');
        return;
      }
      this.submitting = true;
      try {
        const orderId = await api.createOrder({
          productId: this.product.id,
          num: this.quantity,
          styleOption: this.styleOption,
          payType: this.payType,
          receiverName: this.selectedAddress.receiverName,
          receiverPhone: this.selectedAddress.receiverPhone,
          receiverAddress: this.formatAddress(this.selectedAddress)
        });
        await api.orderPay(orderId, { payType: this.payType });
        this.orderId = orderId;
        this.orderSuccess = true;
        this.$message.success('订单已创建并自动完成支付');
      } catch (e) {
        this.$message.error(e?.message || '提交订单失败');
      } finally {
        this.submitting = false;
      }
    }
  }
};
</script>

<style scoped>
.checkout-page { display:grid; gap:22px; }
.checkout-shell { padding:24px; border:1px solid var(--mall-card-border); border-radius:28px; background:var(--mall-card-bg); box-shadow:var(--mall-shadow); }
.checkout-head { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:22px; }
.checkout-chip { display:inline-flex; padding:8px 14px; border-radius:999px; background:#fff2f6; color:#ff5f92; font-size:11px; font-weight:800; letter-spacing:1.2px; }
.checkout-title { margin:14px 0 0; font-size:32px; color:#202536; font-weight:900; }
.checkout-subtitle { margin:10px 0 0; color:#6d7687; }
.checkout-grid { display:grid; grid-template-columns:minmax(0, 1fr) 320px; gap:22px; }
.checkout-main { display:grid; gap:16px; }
.checkout-card,.summary-card { padding:20px; border-radius:22px; background:#fffafc; box-shadow:inset 0 0 0 1px #f2e8ee; }
.card-title { margin-bottom:14px; color:#252a3d; font-size:18px; font-weight:900; }
.address-card-head { display:flex; align-items:center; justify-content:space-between; gap:12px; }
.address-card-actions { display:flex; gap:8px; flex-wrap:wrap; }
.product-row { display:grid; grid-template-columns:88px 1fr auto; gap:16px; align-items:center; }
.product-image { width:88px; height:88px; border-radius:18px; object-fit:cover; background:#fff; }
.product-name { color:#252a3d; font-size:16px; font-weight:900; }
.product-desc,.product-spec { margin-top:6px; color:#7d8497; font-size:13px; }
.product-price { color:#ff6b56; font-size:22px; font-weight:900; }
.address-box { padding:16px; border-radius:18px; background:#fff; box-shadow:inset 0 0 0 1px #f2e8ee; }
.address-top { display:flex; justify-content:space-between; gap:12px; }
.address-detail { margin-top:8px; color:#607086; line-height:1.7; }
.address-meta { margin-top:8px; color:#ff6b56; font-size:12px; font-weight:700; }
.address-picker-empty { padding:16px 0; color:#8b93a6; }
.address-picker-list { display:grid; gap:12px; }
.address-picker-item { width:100%; padding:14px 16px; border:1px solid #ece2e8; border-radius:18px; background:#fff; text-align:left; cursor:pointer; transition:all .2s ease; }
.address-picker-item.active { border-color:#ff8f7d; box-shadow:0 10px 22px rgba(255,122,92,.14); background:linear-gradient(135deg,#fffaf8 0%,#fffdfb 100%); }
.address-picker-item__top { display:flex; gap:10px; flex-wrap:wrap; align-items:center; color:#252a3d; font-size:14px; font-weight:800; }
.address-picker-item__detail { margin-top:8px; color:#607086; line-height:1.7; }
.address-badge { padding:2px 8px; border-radius:999px; background:#fff0e8; color:#ff6b56; font-size:11px; font-weight:800; }
.summary-line,.summary-total { display:flex; justify-content:space-between; gap:12px; margin-top:12px; }
.summary-total { padding-top:14px; margin-top:14px; border-top:1px solid #f0e7ea; font-size:16px; }
.submit-btn { width:100%; margin-top:18px; }
@media (max-width: 960px) { .checkout-grid { grid-template-columns:1fr; } .address-card-head { flex-direction:column; align-items:flex-start; } .address-card-actions { width:100%; } }
</style>
