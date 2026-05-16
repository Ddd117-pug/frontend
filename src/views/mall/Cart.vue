<template>
  <div class="cart-page">
    <div class="cart-shell card">
      <div class="cart-head">
        <div>
          <h3 class="page-title">购物车</h3>
          <div class="cart-subtitle">勾选商品后即可结算，支持批量修改数量与删除，点击图片可查看商品详情</div>
        </div>
        <div class="cart-head__stats">
          <div class="stat-item">
            <span>商品件数</span>
            <b>{{ totalNum }}</b>
          </div>
          <div class="stat-item">
            <span>商品金额</span>
            <b>￥{{ totalAmount }}</b>
          </div>
          <div class="stat-item stat-item--accent">
            <span>已选金额</span>
            <b>￥{{ selectedTotalAmount }}</b>
          </div>
        </div>
      </div>

      <div v-if="loading" class="cart-empty">购物车加载中...</div>
      <div v-else-if="!list.length" class="cart-empty">
        <el-empty description="购物车空空如也">
          <el-button type="primary" @click="$router.push('/mall/products')">去逛逛</el-button>
        </el-empty>
      </div>
      <template v-else>
        <el-table ref="cartTable" :data="list" border class="cart-table" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="55" reserve-selection />
          <el-table-column label="商品" min-width="340">
            <template slot-scope="s">
              <div class="cart-item cart-item--clickable" role="button" tabindex="0" @click="goToProduct(s.row)" @keydown.enter="goToProduct(s.row)" @keydown.space.prevent="goToProduct(s.row)">
                <img :src="s.row.image" :alt="s.row.productName" class="cart-item__img" />
                <div class="cart-item__info">
                  <div class="cart-item__title">{{ s.row.productName }}</div>
                  <div class="cart-item__meta">{{ s.row.spec || '规格信息' }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="单价" width="120">
            <template slot-scope="s">￥{{ Number(s.row.price || 0).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="数量" width="170">
            <template slot-scope="s">
              <el-input-number :value="s.row.num" :min="1" :max="s.row.stockLimit" @change="v => changeQty(s.row, v)" />
            </template>
          </el-table-column>
          <el-table-column label="小计" width="140">
            <template slot-scope="s">￥{{ Number(s.row.totalPrice || 0).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template slot-scope="s"><el-button type="text" @click="removeItem(s.row)">删除</el-button></template>
          </el-table-column>
        </el-table>

        <el-card shadow="never" class="checkout-panel">
          <div class="checkout-panel__head">
            <div>
              <div class="checkout-title">收货地址</div>
              <div class="checkout-subtitle">下单前请选择一个收货地址</div>
            </div>
            <el-button type="text" @click="$router.push('/mall/addresses')">管理地址</el-button>
          </div>

          <el-empty v-if="!addresses.length" description="暂无收货地址，请先添加地址">
            <el-button type="primary" @click="$router.push('/mall/addresses')">去新增地址</el-button>
          </el-empty>

          <el-radio-group v-else v-model="selectedAddressId" class="address-radio-group">
            <el-radio-button v-for="item in addresses" :key="item.id" :label="item.id">
              <div class="address-option">
                <div>
                  <span class="name">{{ item.receiverName }}</span>
                  <span class="phone">{{ item.receiverPhone }}</span>
                  <el-tag v-if="item.isDefault === 1" size="mini" type="success">默认</el-tag>
                </div>
                <div class="detail">{{ formatAddress(item) }}</div>
              </div>
            </el-radio-button>
          </el-radio-group>
        </el-card>

        <div class="cart-footer">
          <div>
            已选择 {{ selectedTotalNum }} 件商品，总计：
            <b class="cart-footer__amount">￥{{ selectedTotalAmount }}</b>
          </div>
          <el-button type="primary" :loading="submitting" @click="createOrder">去结算</el-button>
        </div>
      </template>
    </div>
  </div>
</template>
<script>
import { api } from "../../api";

export default {
  data() {
    return {
      list: [],
      addresses: [],
      selectedAddressId: null,
      selectedCartIds: [],
      loading: false,
      submitting: false
    };
  },
  computed: {
    totalNum() {
      return this.list.reduce((sum, item) => sum + (item.num || 0), 0);
    },
    totalAmount() {
      return this.list.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0).toFixed(2);
    },
    selectedItems() {
      if (!this.selectedCartIds.length) return [];
      return this.list.filter(item => this.selectedCartIds.includes(item.id));
    },
    selectedTotalNum() {
      return this.selectedItems.reduce((sum, item) => sum + (item.num || 0), 0);
    },
    selectedTotalAmount() {
      return this.selectedItems.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0).toFixed(2);
    }
  },
  async created() {
    await this.load();
  },
  methods: {
    normalizeCartItems(payload) {
      const source = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.records)
          ? payload.records
          : Array.isArray(payload?.list)
            ? payload.list
            : Array.isArray(payload?.rows)
              ? payload.rows
              : Array.isArray(payload?.data)
                ? payload.data
                : [];

      return source.map((item) => {
        const quantity = Number(item.num ?? item.quantity ?? item.count ?? 1);
        const price = Number(item.price ?? item.unitPrice ?? item.salePrice ?? 0);
        const totalPrice = Number(item.totalPrice ?? item.amount ?? item.subtotal ?? price * quantity);
        const stock = Number(item.stock ?? item.stockNum ?? item.inventory ?? item.maxStock ?? 0);
        return {
          ...item,
          productName: item.productName || item.productTitle || item.goodsName || item.title || "商品",
          image: item.productPic || item.image || item.cover || item.picUrl || item.thumb || item.goodsImg || "",
          spec: item.styleOption || item.skuName || item.spec || item.skuDesc || "",
          stockLimit: stock > 0 ? stock : undefined,
          num: quantity,
          price,
          totalPrice
        };
      });
    },
    async load() {
      this.loading = true;
      try {
        const previousSelectedIds = [...this.selectedCartIds];
        const [cartList, addresses] = await Promise.all([api.cartList(), api.addressList()]);
        const normalized = this.normalizeCartItems(cartList);
        this.list = await Promise.all(
          normalized.map(async (item) => {
            if (item.image && item.image !== "") return item;
            const productId = item.productId || item.goodsId || item.id;
            if (!productId) return item;
            try {
              const detail = await api.productDetail(productId);
              return {
                ...item,
                image: item.image || detail?.coverUrl || (String(detail?.bannerUrls || "").split(",").map(img => img.trim()).find(Boolean) || "") || "https://picsum.photos/seed/cart/160/160",
                productName: item.productName || detail?.name || detail?.productName || detail?.title || "商品",
                spec: item.spec || detail?.styleDesc || detail?.subTitle || ""
              };
            } catch (error) {
              return item;
            }
          })
        );
        this.addresses = addresses || [];
        const validSelectedIds = previousSelectedIds.filter(id => this.list.some(item => item.id === id));
        this.selectedCartIds = validSelectedIds.length ? validSelectedIds : this.list.map(item => item.id);
        const defaultAddress = this.addresses.find(item => item.isDefault === 1);
        this.selectedAddressId = defaultAddress ? defaultAddress.id : (this.addresses[0] && this.addresses[0].id);
        this.$root.$emit("cart-updated");
        this.$nextTick(() => {
          if (!this.$refs.cartTable) return;
          this.$refs.cartTable.clearSelection();
          this.list.forEach(item => {
            if (this.selectedCartIds.includes(item.id)) {
              this.$refs.cartTable.toggleRowSelection(item, true);
            }
          });
        });
      } finally {
        this.loading = false;
      }
    },
    handleSelectionChange(rows) {
      this.selectedCartIds = rows.map(item => item.id);
    },
    formatAddress(item) {
      return [item.province, item.city, item.district, item.detail].filter(Boolean).join(" ");
    },
    async changeQty(row, value) {
      if (!value || value < 1) return this.$message.warning("数量不能小于 1");
      if (row.stockLimit && value > row.stockLimit) return this.$message.warning("已超过库存上限");
      await api.cartUpdate(row.id, { num: value });
      await this.load();
    },
    goToProduct(row) {
      const productId = row.productId || row.goodsId || row.id;
      if (!productId) return this.$message.warning("未找到商品详情入口");
      this.$router.push(`/mall/product/${productId}`);
    },
    async removeItem(row) {
      await api.cartDelete(row.id);
      this.selectedCartIds = this.selectedCartIds.filter(id => id !== row.id);
      await this.load();
    },
    async createOrder() {
      if (!this.list.length) return this.$message.warning("购物车为空");
      if (!this.selectedCartIds.length) return this.$message.warning("请先勾选要结算的商品");
      const address = this.addresses.find(item => item.id === this.selectedAddressId);
      if (!address) return this.$message.warning("请先选择收货地址");
      if (!this.selectedItems.length) return this.$message.warning("请先选择要结算的商品");
      this.submitting = true;
      try {
        await api.createOrder({
          receiverName: address.receiverName,
          receiverPhone: address.receiverPhone,
          receiverAddress: this.formatAddress(address),
          payType: 1,
          cartIds: this.selectedCartIds
        });
        this.$message.success("订单创建成功");
        this.$router.push("/mall/orders");
      } finally {
        this.submitting = false;
      }
    }
  }
};
</script>
<style scoped>
.cart-page {
  padding: 24px;
  background: linear-gradient(180deg, #fff6f1 0%, #f7f8fc 100%);
}

.cart-shell {
  max-width: 1240px;
  margin: 0 auto;
  padding: 24px;
  border-radius: 20px;
}

.cart-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 18px;
}

.cart-subtitle {
  margin-top: 6px;
  color: #7a8395;
  font-size: 13px;
}

.cart-head__stats {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.stat-item {
  min-width: 120px;
  padding: 12px 14px;
  border-radius: 14px;
  background: #f7f8fc;
  border: 1px solid #edf0f6;
}

.stat-item span {
  display: block;
  font-size: 12px;
  color: #8b93a4;
}

.stat-item b {
  display: block;
  margin-top: 6px;
  font-size: 18px;
  color: #1f2430;
}

.stat-item--accent {
  background: #fff6ea;
  border-color: #f3e3c5;
}

.cart-table {
  border-radius: 16px;
  overflow: hidden;
}

.cart-item {
  display: flex;
  gap: 12px;
  align-items: center;
}

.cart-item--clickable {
  cursor: pointer;
}

.cart-item--clickable:hover .cart-item__title {
  color: #ff7a00;
}

.cart-item__img {
  width: 72px;
  height: 72px;
  border-radius: 12px;
  object-fit: cover;
  border: 1px solid #edf0f6;
}

.cart-item__title {
  font-size: 14px;
  font-weight: 700;
  color: #1f2430;
  margin-bottom: 6px;
}

.cart-item__meta {
  color: #7a8395;
  font-size: 12px;
  line-height: 1.6;
}

.checkout-panel {
  margin-top: 18px;
  border-radius: 14px;
  background: linear-gradient(180deg, #fcfdff 0%, #f7f9fc 100%);
}

.checkout-panel__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.checkout-title {
  font-size: 16px;
  font-weight: 700;
  color: #1f2a3d;
}

.checkout-subtitle {
  margin-top: 4px;
  color: #8a94a6;
  font-size: 13px;
}

.address-radio-group {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.address-radio-group >>> .el-radio-button__inner {
  width: 100%;
  white-space: normal;
  border-radius: 12px !important;
  border: 1px solid #dce3ef !important;
  box-shadow: none;
  padding: 14px 16px;
  text-align: left;
}

.address-option .name {
  font-weight: 700;
  margin-right: 8px;
}

.address-option .phone {
  color: #5f6b7c;
  margin-right: 8px;
}

.address-option .detail {
  margin-top: 8px;
  line-height: 1.6;
  color: #344054;
}

.cart-footer {
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.cart-footer__amount {
  color: #f56c6c;
}

.cart-empty {
  padding: 48px 0;
  text-align: center;
  color: #8b93a4;
}
</style>
