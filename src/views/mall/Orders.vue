<template>
  <div class="orders-page">
    <div class="orders-shell card">
      <div class="orders-head">
        <div>
          <h2 class="orders-title">我的订单</h2>
          <div class="orders-tabs">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              type="button"
              class="orders-tab"
              :class="{ active: activeTab === tab.key }"
              @click="activeTab = tab.key"
            >
              {{ tab.label }}
              <span v-if="tab.count !== null" class="orders-tab__count">{{ tab.count }}</span>
            </button>
          </div>
        </div>

        <div class="orders-assets">
          <span>余额：<b>¥{{ balance.toFixed(2) }}</b></span>
          <span>积分：<b>{{ points }}</b></span>
        </div>
      </div>

      <div class="orders-toolbar">
        <el-select v-model="sortValue" size="small" class="orders-sort" placeholder="最近订单">
          <el-option label="最近订单" value="recent" />
          <el-option label="最早订单" value="oldest" />
          <el-option label="金额从高到低" value="amount_desc" />
        </el-select>

        <el-input
          v-model="searchText"
          size="small"
          class="orders-search"
          prefix-icon="el-icon-search"
          placeholder="商品名称 / 订单号 / 收货人 / 手机号"
          clearable
        />

        <div class="orders-toolbar__actions">
          <el-button size="small" @click="exportOrders">导出订单</el-button>
          <el-button size="small" @click="printOrders">打印</el-button>
        </div>
      </div>

      <div v-if="loading" class="orders-empty">订单加载中...</div>
      <div v-else-if="pagedOrders.length" class="orders-list">
        <div v-for="order in pagedOrders" :key="order.id" class="order-card">
          <div class="order-card__head">
            <div class="order-card__meta">
              <span>{{ order.date }}</span>
              <span>订单号：{{ order.orderNo }}</span>
              <span v-if="order.shopName" class="order-card__shop">{{ order.shopName }}</span>
              <el-link type="warning" :underline="false" @click="openOrderDetail(order)">订单详情 &gt;</el-link>
            </div>
            <div class="order-card__status">
              <span :class="['status-pill', `status-pill--${order.statusClass}`]">{{ order.statusText }}</span>
            </div>
          </div>

          <div class="order-card__body">
            <div class="order-product">
              <img :src="order.image" :alt="order.title" class="order-product__img" />
              <div class="order-product__info">
                <div class="order-product__title">{{ order.title || '商品名称' }}</div>
                <div v-if="order.spec" class="order-product__sub">{{ order.spec }}</div>
                <div class="order-product__mini-actions">
                  <el-button size="mini" :disabled="order.loading" @click="rebuyOrder(order)">再来一单</el-button>
                  <el-button size="mini" :disabled="order.loading || !canAfterSale(order)" @click="openAfterSaleDialog(order)">申请售后</el-button>
                  <el-button size="mini" :disabled="order.loading || !canReview(order)" @click="openReviewDialog(order)">去评价</el-button>
                </div>
              </div>
            </div>

            <div class="order-summary">
              <div class="summary-block">
                <div class="summary-label">商品单价</div>
                <div class="summary-price">¥{{ order.price.toFixed(2) }}</div>
                <div class="summary-sub">x{{ order.quantity }}</div>
              </div>
              <div class="summary-block">
                <div class="summary-label">商品金额</div>
                <div class="summary-price">¥{{ order.total.toFixed(2) }}</div>
                <div class="summary-sub">共 {{ order.quantity }} 件</div>
              </div>
              <div class="summary-block">
                <div class="summary-label">实付款</div>
                <div class="summary-price summary-price--accent">¥{{ order.paid.toFixed(2) }}</div>
                <div class="summary-sub">含运费 ¥{{ order.freight.toFixed(2) }}</div>
              </div>
            </div>

            <div class="order-actions">
              <el-button type="warning" size="small" :loading="order.loading && order.loadingAction === 'primary'" @click="handlePrimaryAction(order)">{{ order.primaryAction }}</el-button>
              <el-button size="small" v-for="action in order.actions" :key="action" :loading="order.loading && order.loadingAction === action" @click="handleSecondaryAction(order, action)">{{ action }}</el-button>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="orders-empty">暂无符合条件的订单</div>

      <div v-if="!loading && filteredOrders.length" class="orders-pagination-wrap">
        <el-pagination
          background
          layout="prev, pager, next, total, jumper"
          :current-page="pageNum"
          :page-size="pageSize"
          :total="filteredOrders.length"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <el-dialog title="订单详情" :visible.sync="orderDetailVisible" width="900px" top="4vh" @close="resetOrderDetail">
      <div v-if="detailLoading" class="orders-empty">订单详情加载中...</div>
      <div v-else-if="detailOrder" class="order-detail">
        <div class="order-detail__statusbar">
          <div>
            <div class="order-detail__state">{{ detailOrder.statusText }}</div>
            <div class="order-detail__hint">{{ detailOrder.statusHint }}</div>
          </div>
          <div class="order-detail__actions">
            <el-button type="warning" size="small" :loading="detailOrder.loading && detailOrder.loadingAction === 'primary'" @click="handlePrimaryAction(detailOrder)">{{ detailOrder.primaryAction }}</el-button>
            <el-button size="small" v-for="action in detailOrder.actions" :key="action" :loading="detailOrder.loading && detailOrder.loadingAction === action" @click="handleSecondaryAction(detailOrder, action)">{{ action }}</el-button>
          </div>
        </div>

        <div class="order-detail__grid">
          <section class="detail-card detail-card--main">
            <h4>包裹信息</h4>
            <div class="detail-kv">
              <div><span>订单号</span><b>{{ detailOrder.orderNo }}</b></div>
              <div><span>下单时间</span><b>{{ detailOrder.date }}</b></div>
              <div><span>收货人</span><b>{{ detailOrder.receiverName || '-' }}</b></div>
              <div><span>联系方式</span><b>{{ detailOrder.receiverPhone || '-' }}</b></div>
              <div><span>收货地址</span><b>{{ detailOrder.receiverAddress || '-' }}</b></div>
              <div><span>配送方式</span><b>{{ detailOrder.deliveryType || '快递配送' }}</b></div>
              <div><span>支付方式</span><b>{{ detailOrder.payTypeText || '未记录' }}</b></div>
              <div><span>订单备注</span><b>{{ detailOrder.remark || '无' }}</b></div>
            </div>

            <div class="detail-items">
              <div v-for="item in detailItems" :key="item.id || item.productId || item.productName" class="detail-item">
                <img :src="item.productPic || item.image || item.cover || item.picUrl || item.thumb || detailOrder.image" :alt="item.productName || item.productTitle || item.title || detailOrder.title" class="detail-item__img" />
                <div class="detail-item__info">
                  <div class="detail-item__title">{{ item.productName || item.productTitle || item.title || '商品信息暂未返回' }}</div>
                  <div class="detail-item__sub">{{ item.styleOption || item.spec || item.skuName || '规格信息暂未返回' }}</div>
                  <div class="detail-item__sub">数量：{{ item.quantity || 1 }}</div>
                </div>
              </div>
            </div>
          </section>

          <aside class="detail-card detail-card--aside">
            <h4>订单信息</h4>
            <div class="detail-summary">
              <div><span>商品金额</span><b>¥{{ detailOrder.total.toFixed(2) }}</b></div>
              <div><span>运费</span><b>¥{{ detailOrder.freight.toFixed(2) }}</b></div>
              <div><span>优惠金额</span><b>¥{{ detailOrder.discountAmount.toFixed(2) }}</b></div>
              <div><span>实付款</span><b class="accent">¥{{ detailOrder.paid.toFixed(2) }}</b></div>
            </div>

            <div class="detail-summary">
              <div><span>物流状态</span><b>{{ detailOrder.logisticsStatusText || detailOrder.statusText || '暂无' }}</b></div>
              <div><span>物流单号</span><b>{{ detailOrder.logisticsNo || '暂无' }}</b></div>
              <div><span>订单状态</span><b>{{ detailOrder.statusText }}</b></div>
            </div>
          </aside>
        </div>
      </div>
      <span slot="footer">
        <el-button @click="orderDetailVisible = false">关闭</el-button>
      </span>
    </el-dialog>

    <el-dialog title="选择支付方式" :visible.sync="payDialogVisible" width="420px">
      <div class="pay-note">请选择支付方式完成订单付款。</div>
      <div class="pay-methods">
        <button type="button" class="pay-method" :class="{ active: selectedPayType === 0 }" @click="selectedPayType = 0">
          <span class="pay-method__title">余额支付</span>
          <span class="pay-method__sub">使用账户余额完成支付</span>
        </button>
        <button type="button" class="pay-method" :class="{ active: selectedPayType === 1 }" @click="selectedPayType = 1">
          <span class="pay-method__title">微信支付</span>
          <span class="pay-method__sub">使用微信完成订单付款</span>
        </button>
        <button type="button" class="pay-method" :class="{ active: selectedPayType === 2 }" @click="selectedPayType = 2">
          <span class="pay-method__title">支付宝</span>
          <span class="pay-method__sub">使用支付宝完成订单付款</span>
        </button>
      </div>
      <span slot="footer">
        <el-button @click="payDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="paying" @click="confirmPay">确认支付</el-button>
      </span>
    </el-dialog>

    <el-dialog title="申请售后" :visible.sync="afterSaleDialogVisible" width="520px">
      <div class="pay-note">请填写售后原因，提交后等待平台审核。</div>
      <el-select v-model="afterSaleType" placeholder="请选择售后类型" style="width: 100%; margin-bottom: 12px;">
        <el-option label="退款" value="refund" />
        <el-option label="退货退款" value="return_refund" />
        <el-option label="换货" value="exchange" />
        <el-option label="补发" value="reissue" />
      </el-select>
      <el-input v-model="afterSaleReason" type="textarea" :rows="4" maxlength="120" show-word-limit placeholder="例如：商品有瑕疵 / 发错货 / 尺寸不合适" />
      <span slot="footer">
        <el-button @click="afterSaleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="afterSaleSubmitting" @click="confirmAfterSale">提交申请</el-button>
      </span>
    </el-dialog>

    <el-dialog title="提交评价" :visible.sync="reviewDialogVisible" width="560px">
      <div class="pay-note">请对本次购物体验进行评分和评价。</div>
      <el-rate v-model="reviewForm.rating" :max="5" show-score style="margin-bottom: 12px;" />
      <el-input v-model="reviewForm.content" type="textarea" :rows="5" maxlength="300" show-word-limit placeholder="请输入评价内容" />
      <span slot="footer">
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="reviewSubmitting" @click="confirmReview">提交评价</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { api } from "../../api";

const STATUS_MAP = {
  0: { text: "待付款", className: "waiting", tabKey: "pending_pay", primaryAction: "立即支付", actions: ["取消订单"] },
  1: { text: "待发货", className: "waiting", tabKey: "pending_ship", primaryAction: "提醒发货", actions: ["申请售后"] },
  2: { text: "待收货", className: "paid", tabKey: "pending_receive", primaryAction: "确认收货", actions: ["查看物流", "申请售后"] },
  3: { text: "已完成", className: "paid", tabKey: "completed", primaryAction: "再次购买", actions: ["查看物流", "申请售后"] },
  4: { text: "已取消", className: "cancelled", tabKey: "cancelled", primaryAction: "再次购买", actions: ["再次购买"] },
  5: { text: "售后中", className: "waiting", tabKey: "after_sale", primaryAction: "查看售后", actions: ["查看物流"] },
  6: { text: "已退款", className: "cancelled", tabKey: "refunded", primaryAction: "再次购买", actions: ["再次购买"] }
};

export default {
  name: "Orders",
  data() {
    return {
      loading: false,
      activeTab: "all",
      sortValue: "recent",
      searchText: "",
      balance: 0,
      points: 0,
      orders: [],
      tabs: [
        { key: "all", label: "所有订单", count: null },
        { key: "pending_pay", label: "待付款", count: null },
        { key: "pending_ship", label: "待发货", count: null },
        { key: "pending_receive", label: "待收货", count: null },
        { key: "completed", label: "已完成", count: null },
        { key: "cancelled", label: "已取消", count: null },
        { key: "after_sale", label: "售后中", count: null },
        { key: "refunded", label: "已退款", count: null }
      ],
      orderDetailVisible: false,
      detailLoading: false,
      detailOrder: null,
      detailItems: [],
      payDialogVisible: false,
      selectedPayType: 0,
      currentPayOrder: null,
      paying: false,
      afterSaleDialogVisible: false,
      afterSaleReason: "",
      afterSaleType: "refund",
      currentAfterSaleOrder: null,
      afterSaleSubmitting: false,
      reviewDialogVisible: false,
      reviewSubmitting: false,
      currentReviewOrder: null,
      reviewForm: { rating: 5, content: "" },
      pageNum: 1,
      pageSize: 6
    };
  },
  computed: {
    filteredOrders() {
      let list = this.orders.slice();
      if (this.activeTab !== "all") list = list.filter((item) => item.tabKey === this.activeTab);
      const keyword = this.searchText.trim().toLowerCase();
      if (keyword) {
        list = list.filter((item) => [item.orderNo, item.title, item.shopName, item.date, item.receiverName, item.receiverPhone, item.receiverAddress].some((field) => String(field || "").toLowerCase().includes(keyword)));
      }
      if (this.sortValue === "amount_desc") list.sort((a, b) => b.total - a.total);
      else if (this.sortValue === "oldest") list.sort((a, b) => a.timestamp - b.timestamp);
      else list.sort((a, b) => b.timestamp - a.timestamp);
      return list;
    },
    pagedOrders() {
      const start = (this.pageNum - 1) * this.pageSize;
      return this.filteredOrders.slice(start, start + this.pageSize);
    }
  },
  async created() {
    await this.loadProfile();
    await this.loadOrders();
  },
  methods: {
    async loadProfile() {
      try {
        const me = await api.me();
        this.balance = Number(me?.balance || 0);
        this.points = Number(me?.points || 0);
      } catch (error) {
        this.balance = 0;
        this.points = 0;
      }
    },
    parseDate(value) {
      const time = value ? new Date(value).getTime() : 0;
      return Number.isFinite(time) ? time : 0;
    },
    normalizeOrders(payload) {
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
                : Array.isArray(payload?.items)
                  ? payload.items
                  : [];

      return source.map((item) => {
        const items = Array.isArray(item.items)
          ? item.items
          : Array.isArray(item.orderItems)
            ? item.orderItems
            : Array.isArray(item.goodsList)
              ? item.goodsList
              : Array.isArray(item.products)
                ? item.products
                : [];
        const firstItem = items[0] || item.order || {};
        const status = Number(item.status ?? item.orderStatus ?? item.payStatus ?? item.state ?? 0);
        const info = STATUS_MAP[status] || STATUS_MAP[2];
        const total = Number(item.totalAmount ?? item.amount ?? item.orderAmount ?? firstItem.amount ?? firstItem.total ?? 0);
        const quantity = Number(item.quantity ?? item.totalQuantity ?? firstItem.quantity ?? 1);
        const price = Number(item.unitPrice ?? item.price ?? firstItem.price ?? (quantity ? total / quantity : total) ?? 0);
        const paid = Number(item.paidAmount ?? item.payAmount ?? item.payTotal ?? total);
        const title = item.productName || firstItem.productName || "商品";
        const image = item.productPic || firstItem.productPic || "https://picsum.photos/seed/order/120/120";
        const spec = item.styleOption || firstItem.styleOption || item.spec || firstItem.spec || "";

        return {
          id: item.id || item.orderId || item.orderNo || item.sn,
          raw: item,
          statusCode: status,
          timestamp: this.parseDate(item.createdAt || item.orderTime || item.payTime || item.date || item.updateTime),
          date: item.createdAt || item.orderTime || item.payTime || item.date || "-",
          orderNo: item.orderNo || item.sn || item.orderSn || item.id || "-",
          shopName: item.shopName || item.storeName || item.merchantName || "",
          statusText: item.statusText || item.orderStatusText || item.payStatusText || info.text,
          statusClass: item.statusClass || info.className,
          statusHint: item.remark || item.statusDesc || item.orderDesc || "订单详情可查看商品、物流与收货信息",
          title,
          spec,
          guarantee: item.guarantee || "",
          image: image || "https://picsum.photos/seed/order/120/120",
          price,
          quantity,
          total,
          paid,
          freight: Number(item.freight ?? item.shippingFee ?? 0),
          discountAmount: Number(item.discountAmount ?? item.couponAmount ?? item.discount ?? 0),
          primaryAction: item.primaryAction || info.primaryAction,
          actions: Array.isArray(item.actions) ? item.actions : info.actions,
          tabKey: item.tabKey || info.tabKey,
          receiverName: item.receiverName || item.consigneeName || item.receiver || "",
          receiverPhone: item.receiverPhone || item.phone || item.mobile || "",
          receiverAddress: item.receiverAddress || item.address || item.detailAddress || "",
          deliveryType: item.deliveryType || item.shipType || item.deliveryWay || "快递配送",
          remark: item.remark || item.orderRemark || "",
          logisticsCompany: item.expressCompany || item.logisticsCompany || item.shippingCompany || "",
          logisticsNo: item.logisticsNo || item.trackingNo || item.expressNo || item.shippingNo || "",
          logisticsStatusText: item.logisticsStatusText || item.shippingStatusText || item.expressStatusText || "",
          logisticsSteps: Array.isArray(item.logisticsSteps) ? item.logisticsSteps : Array.isArray(item.trackingList) ? item.trackingList : [],
          payTypeText: item.payTypeText || item.payTypeName || item.paymentMethod || "",
          loading: false,
          loadingAction: ""
        };
      });
    },
    async loadOrders() {
      this.loading = true;
      try {
        const res = await api.orderList({ pageNum: 1, pageSize: 200 });
        const baseOrders = this.normalizeOrders(res);
        const enrichedOrders = await Promise.all(
          baseOrders.map(async (order) => {
            try {
              const detail = await api.orderDetail(order.id);
              const detailOrder = detail?.order || detail?.data?.order || {};
              const sourceItems = Array.isArray(detail?.items)
                ? detail.items
                : Array.isArray(detail?.orderItems)
                  ? detail.orderItems
                  : Array.isArray(detail?.goodsList)
                    ? detail.goodsList
                    : Array.isArray(detail?.products)
                      ? detail.products
                      : [];
              const merged = this.normalizeOrders([{ ...detailOrder, items: sourceItems }])[0] || {};
              return {
                ...order,
                ...merged,
                title: merged.title || order.title,
                image: merged.image || order.image,
                spec: merged.spec || order.spec,
                detailItems: sourceItems
              };
            } catch (error) {
              return { ...order, detailItems: [] };
            }
          })
        );
        this.orders = enrichedOrders;
        this.pageNum = 1;
        this.updateTabCounts();
      } catch (error) {
        this.orders = [];
        this.$message?.error?.(error?.message || "订单加载失败");
      } finally {
        this.loading = false;
      }
    },
    updateTabCounts() {
      const counts = this.orders.reduce((acc, order) => {
        acc[order.tabKey] = (acc[order.tabKey] || 0) + 1;
        return acc;
      }, {});
      this.tabs = this.tabs.map((tab) => (tab.key === "all" ? { ...tab, count: this.orders.length } : { ...tab, count: counts[tab.key] || 0 }));
    },
    handlePageChange(page) {
      this.pageNum = page;
    },
    async openOrderDetail(order) {
      this.orderDetailVisible = true;
      this.detailLoading = true;
      this.detailOrder = null;
      this.detailItems = [];
      try {
        if (Array.isArray(order.detailItems) && order.detailItems.length) {
          this.detailOrder = order;
          this.detailItems = order.detailItems.map((item) => ({
            ...item,
            image: item.productPic || item.image || item.cover || item.picUrl || item.thumb || item.goodsImg || order.image,
            title: item.productName || item.productTitle || item.goodsName || item.title || order.title,
            spec: item.styleOption || item.skuName || item.spec || order.spec
          }));
          return;
        }
        const detail = await api.orderDetail(order.id);
        const detailOrder = detail?.order || detail?.data?.order || {};
        const sourceItems = Array.isArray(detail?.items)
          ? detail.items
          : Array.isArray(detail?.orderItems)
            ? detail.orderItems
            : Array.isArray(detail?.goodsList)
              ? detail.goodsList
              : Array.isArray(detail?.products)
                ? detail.products
                : [];
        const merged = this.normalizeOrders([{ ...detailOrder, items: sourceItems }])[0] || order;
        this.detailOrder = { ...order, ...merged };
        this.detailItems = sourceItems.map((item) => ({
          ...item,
          image: item.productPic || item.image || item.cover || item.picUrl || item.thumb || item.goodsImg || order.image,
          title: item.productName || item.productTitle || item.goodsName || item.title || order.title,
          spec: item.styleOption || item.skuName || item.spec || order.spec
        }));
      } catch (error) {
        this.detailOrder = order;
        this.detailItems = [];
        this.$message.error(error?.message || "订单详情加载失败");
      } finally {
        this.detailLoading = false;
      }
    },
    resetOrderDetail() {
      this.detailLoading = false;
      this.detailOrder = null;
      this.detailItems = [];
    },
    canAfterSale(order) {
      return [2, 3, 4, 6, 7].includes(Number(order.statusCode));
    },
    canReview(order) {
      return [3, 4].includes(Number(order.statusCode));
    },
    async openLogistics(order) {
      const statusText = order.logisticsStatusText || order.logisticsStatus || order.statusText || "已打包";
      const steps = Array.isArray(order.logisticsSteps) && order.logisticsSteps.length ? order.logisticsSteps : [{ time: order.date, content: statusText }];
      const timelineHtml = `<div style="margin-top:12px;line-height:1.8;text-align:left;">${steps.map((step) => `<div>• ${step.time || ""} ${step.content || step.desc || ""}</div>`).join("")}</div>`;
      await this.$alert(`当前物流状态：${statusText}${timelineHtml}`, "查看物流", { dangerouslyUseHTMLString: true });
    },
    async rebuyOrder(order) {
      try {
        const detail = await api.orderDetail(order.id);
        const items = Array.isArray(detail?.items)
          ? detail.items
          : Array.isArray(detail?.orderItems)
            ? detail.orderItems
            : Array.isArray(detail?.goodsList)
              ? detail.goodsList
              : Array.isArray(detail?.products)
                ? detail.products
                : Array.isArray(order.detailItems)
                  ? order.detailItems
                  : [];
        const firstItem = items[0] || {};
        const productId = firstItem.productId || firstItem.goodsId || firstItem.id;
        if (!productId) {
          this.$message.warning("商品信息不完整，无法跳转到购买页");
          return;
        }
        await this.$router.push(`/mall/product/${productId}`);
      } catch (error) {
        this.$message.error(error?.message || "再次购买失败");
      }
    },
    async handlePrimaryAction(order) {
      if (order.loading) return;
      const action = order.primaryAction;
      if (action === "立即支付") return this.openPayDialog(order);
      if (action === "确认收货") return this.receiveOrder(order);
      if (action === "去评价") return this.openReviewDialog(order);
      if (action === "提醒发货") return this.$message.info("已提醒商家发货");
      if (action === "删除订单") return this.$message.warning("删除订单请接入后端接口后再实现");
      if (action === "再次购买") return this.rebuyOrder(order);
      if (action === "查看售后") return this.$message.info("请在售后记录中查看处理进度");
    },
    async handleSecondaryAction(order, action) {
      if (order.loading) return;
      if (action === "取消订单") return this.cancelOrder(order);
      if (action === "查看物流") return this.openLogistics(order);
      if (action === "申请售后") return this.openAfterSaleDialog(order);
      if (action === "再次购买") return this.rebuyOrder(order);
      if (action === "去评价") return this.openReviewDialog(order);
      return this.$message.info(`${action} 功能暂未接入`);
    },
    openPayDialog(order) {
      this.currentPayOrder = order;
      this.selectedPayType = 0;
      this.payDialogVisible = true;
    },
    async confirmPay() {
      if (!this.currentPayOrder) return;
      this.payDialogVisible = false;
      const order = this.currentPayOrder;
      this.currentPayOrder = null;
      this.paying = true;
      try {
        await api.orderPay(order.id, { payType: this.selectedPayType });
        this.$message.success("订单支付成功");
        await this.loadProfile();
        await this.loadOrders();
      } catch (error) {
        this.$message.error(error?.message || "支付失败");
      } finally {
        this.paying = false;
      }
    },
    async cancelOrder(order) {
      try {
        await this.$confirm(`确认取消订单 ${order.orderNo} 吗？`, "取消订单", { type: "warning" });
      } catch (error) {
        return;
      }
      try {
        order.loading = true;
        order.loadingAction = "取消订单";
        await api.orderCancel(order.id);
        this.$message.success("订单已取消");
        await this.loadOrders();
      } catch (error) {
        this.$message.error(error?.message || "取消订单失败");
      } finally {
        order.loading = false;
        order.loadingAction = "";
      }
    },
    async receiveOrder(order) {
      try {
        await this.$confirm(`确认订单 ${order.orderNo} 已收到商品？`, "确认收货", { type: "warning" });
      } catch (error) {
        return;
      }
      try {
        order.loading = true;
        order.loadingAction = "primary";
        await api.orderReceive(order.id);
        this.$message.success("确认收货成功");
        await this.loadProfile();
        await this.loadOrders();
      } catch (error) {
        this.$message.error(error?.message || "确认收货失败");
      } finally {
        order.loading = false;
        order.loadingAction = "";
      }
    },
    openAfterSaleDialog(order) {
      this.currentAfterSaleOrder = order;
      this.afterSaleReason = "";
      this.afterSaleType = "refund";
      this.afterSaleDialogVisible = true;
    },
    async confirmAfterSale() {
      if (!this.currentAfterSaleOrder) return;
      const reason = this.afterSaleReason.trim();
      if (!this.afterSaleType) return this.$message.warning("请选择售后类型");
      if (!reason) return this.$message.warning("请填写售后原因");
      const order = this.currentAfterSaleOrder;
      this.afterSaleSubmitting = true;
      try {
        await api.applyAfterSale(order.id, { reason, type: this.afterSaleType });
        this.$message.success("售后申请已提交");
        this.afterSaleDialogVisible = false;
        await this.loadOrders();
      } catch (error) {
        this.$message.error(error?.message || "申请售后失败");
      } finally {
        this.afterSaleSubmitting = false;
      }
    },
    openReviewDialog(order) {
      this.currentReviewOrder = order;
      this.reviewForm = { rating: 5, content: "" };
      this.reviewDialogVisible = true;
    },
    async confirmReview() {
      if (!this.currentReviewOrder) return;
      if (!this.reviewForm.rating) return this.$message.warning("请选择评分");
      const content = this.reviewForm.content.trim();
      if (!content) return this.$message.warning("请填写评价内容");
      const order = this.currentReviewOrder;
      this.reviewSubmitting = true;
      try {
        const detail = await api.orderDetail(order.id);
        const items = Array.isArray(detail?.items)
          ? detail.items
          : Array.isArray(detail?.orderItems)
            ? detail.orderItems
            : Array.isArray(detail?.goodsList)
              ? detail.goodsList
              : Array.isArray(detail?.products)
                ? detail.products
                : [];
        const firstItem = items[0] || {};
        await api.addReview({
          orderId: order.id,
          productId: firstItem.productId || firstItem.goodsId || detail?.order?.productId || detail.productId || order.productId,
          rating: this.reviewForm.rating,
          content
        });
        this.$message.success("评价提交成功");
        this.reviewDialogVisible = false;
        await this.loadOrders();
      } catch (error) {
        this.$message.error(error?.message || "提交评价失败");
      } finally {
        this.reviewSubmitting = false;
      }
    },
    exportOrders() {
      const rows = this.filteredOrders.map((order) => ({
        订单号: order.orderNo,
        状态: order.statusText,
        商品: order.title,
        收货人: order.receiverName,
        手机号: order.receiverPhone,
        地址: order.receiverAddress,
        商品金额: order.total.toFixed(2),
        运费: order.freight.toFixed(2),
        实付款: order.paid.toFixed(2),
        下单时间: order.date
      }));
      if (!rows.length) return this.$message.warning("暂无可导出的订单");
      const header = Object.keys(rows[0]);
      const csv = [header.join(","), ...rows.map((row) => header.map((key) => `"${String(row[key] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
      const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orders_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      this.$message.success("订单已导出");
    },
    printOrders() {
      const rows = this.filteredOrders
        .map((order) => `<tr><td>${order.orderNo}</td><td>${order.statusText}</td><td>${order.title}</td><td>${order.total.toFixed(2)}</td><td>${order.paid.toFixed(2)}</td><td>${order.date}</td></tr>`)
        .join("");
      const win = window.open("", "_blank", "width=1200,height=800");
      if (!win) return this.$message.warning("浏览器阻止了打印窗口");
      win.document.write(`
        <html>
          <head>
            <title>订单打印</title>
            <style>
              body{font-family:Arial,"Microsoft YaHei",sans-serif;padding:24px;color:#222;}
              h1{font-size:20px;margin:0 0 16px;}
              table{width:100%;border-collapse:collapse;}
              th,td{border:1px solid #ddd;padding:10px;font-size:12px;text-align:left;}
              th{background:#f7f7f7;}
            </style>
          </head>
          <body>
            <h1>订单打印</h1>
            <table>
              <thead><tr><th>订单号</th><th>状态</th><th>商品</th><th>商品金额</th><th>实付款</th><th>下单时间</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </body>
        </html>
      `);
      win.document.close();
      win.onload = () => win.print();
    }
  }
};
</script>

<style scoped>
.orders-page {
  min-height: 100%;
  padding: 24px;
  background: linear-gradient(180deg, #fff6f1 0%, #f7f8fc 100%);
}

.orders-shell {
  max-width: 1240px;
  margin: 0 auto;
  padding: 24px;
  border-radius: 20px;
}

.orders-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.orders-title {
  margin: 0 0 14px;
  font-size: 28px;
  line-height: 1.2;
  color: #1f2430;
}

.orders-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
}

.orders-tab {
  border: 0;
  background: transparent;
  padding: 6px 0;
  font-size: 15px;
  color: #4d5566;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.orders-tab.active {
  color: #ff7a00;
  font-weight: 700;
  border-bottom-color: #ff7a00;
}

.orders-tab__count {
  margin-left: 4px;
  color: inherit;
}

.orders-assets {
  display: flex;
  gap: 16px;
  color: #5c6475;
  font-size: 14px;
  white-space: nowrap;
}

.orders-assets b {
  color: #1f2430;
}

.orders-toolbar {
  display: grid;
  grid-template-columns: 180px 1fr auto;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.orders-search {
  width: 100%;
}

.orders-toolbar__actions {
  display: flex;
  gap: 10px;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.order-card {
  border: 1px solid #e9edf5;
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 8px 24px rgba(31, 36, 48, 0.04);
}

.order-card__head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: #f7f7f9;
  border-bottom: 1px solid #edf0f6;
}

.order-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 14px;
  align-items: center;
  color: #666f80;
  font-size: 13px;
}

.order-card__shop {
  color: #ff7a00;
  font-weight: 600;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 84px;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
}

.status-pill--paid {
  color: #ff7a00;
  background: #fff3e8;
}

.status-pill--waiting {
  color: #3aa655;
  background: #edf9f0;
}

.status-pill--cancelled {
  color: #8b93a4;
  background: #eef1f6;
}

.order-card__body {
  display: grid;
  grid-template-columns: 1.8fr 1fr 180px;
  gap: 18px;
  align-items: stretch;
  padding: 16px;
}

.order-product {
  display: flex;
  gap: 14px;
}

.order-product__img {
  width: 88px;
  height: 88px;
  border-radius: 12px;
  object-fit: cover;
  flex: 0 0 auto;
  border: 1px solid #edf0f6;
}

.order-product__info {
  min-width: 0;
}

.order-product__title {
  font-size: 16px;
  font-weight: 700;
  color: #1f2430;
  margin-bottom: 8px;
}

.order-product__sub {
  color: #7a8395;
  font-size: 13px;
  line-height: 1.6;
}

.order-product__mini-actions {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.order-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  align-items: center;
  border-left: 1px solid #edf0f6;
  border-right: 1px solid #edf0f6;
  padding: 0 16px;
}

.summary-block {
  text-align: center;
}

.summary-label,
.summary-sub {
  font-size: 12px;
  color: #8b93a4;
  line-height: 1.5;
}

.summary-price {
  font-size: 18px;
  font-weight: 800;
  color: #1f2430;
}

.summary-price--accent {
  color: #ff7a00;
}

.order-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  justify-content: center;
  align-items: stretch;
}

.order-actions .el-button + .el-button {
  margin-left: 0;
}

.order-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.order-detail__statusbar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding: 16px;
  border-radius: 16px;
  background: linear-gradient(135deg, #fff6ea 0%, #fff 100%);
  border: 1px solid #f3e3c5;
}

.order-detail__state {
  font-size: 20px;
  font-weight: 800;
  color: #1f2430;
}

.order-detail__hint {
  margin-top: 6px;
  color: #7a8395;
  font-size: 13px;
}

.order-detail__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.order-detail__grid {
  display: grid;
  grid-template-columns: 1.4fr 0.9fr;
  gap: 16px;
}

.detail-card {
  border: 1px solid #e9edf5;
  border-radius: 16px;
  padding: 16px;
  background: #fff;
}

.detail-card h4 {
  margin: 0 0 12px;
  font-size: 16px;
  color: #1f2430;
}

.detail-kv {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.detail-kv div,
.detail-summary div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-kv span,
.detail-summary span {
  font-size: 12px;
  color: #8b93a4;
}

.detail-kv b,
.detail-summary b {
  font-size: 13px;
  color: #1f2430;
}

.detail-summary {
  display: grid;
  gap: 12px;
}

.detail-summary .accent {
  color: #ff7a00;
}

.detail-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: grid;
  grid-template-columns: 72px 1fr auto;
  gap: 12px;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #edf0f6;
}

.detail-item__img {
  width: 72px;
  height: 72px;
  border-radius: 12px;
  object-fit: cover;
  border: 1px solid #edf0f6;
}

.detail-item__title {
  font-size: 14px;
  font-weight: 700;
  color: #1f2430;
}

.detail-item__sub {
  margin-top: 4px;
  font-size: 12px;
  color: #7a8395;
}

.detail-item__price {
  font-size: 14px;
  font-weight: 700;
  color: #ff7a00;
}

.pay-note {
  margin-bottom: 12px;
  color: #7a8395;
  font-size: 13px;
}

.pay-methods {
  display: grid;
  gap: 12px;
}

.pay-method {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid #e4eaf4;
  border-radius: 14px;
  background: #fff;
  text-align: left;
  cursor: pointer;
}

.pay-method.active {
  border-color: #ffb347;
  background: #fff8ef;
  box-shadow: 0 10px 20px rgba(255, 179, 71, 0.16);
}

.pay-method__title {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: #172033;
}

.pay-method__sub {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: #8a94a6;
}

undefined
@media (max-width: 1100px) {
  .orders-toolbar,
  .order-detail__grid {
    grid-template-columns: 1fr;
  }

  .orders-head {
    flex-direction: column;
  }

  .order-card__body {
    grid-template-columns: 1fr;
  }

  .order-summary {
    border-left: 0;
    border-right: 0;
    padding: 12px 0 0;
    border-top: 1px solid #edf0f6;
  }

  .order-actions,
  .order-detail__actions {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .detail-kv {
    grid-template-columns: 1fr;
  }
}
</style>
