<template>
  <div class="admin-orders-page">
    <el-card class="hero-card" shadow="never">
      <div class="hero-head">
        <div>
          <div class="hero-badge">ORDER OPS</div>
          <h2 class="hero-title">订单管理</h2>
          <p class="hero-desc">支持订单查询、状态处理、售后审核与订单详情查看，帮助管理员统一完成订单流转与退款处理。</p>
        </div>
        <div class="hero-actions">
          <el-button plain :disabled="!filteredOrders.length" @click="exportOrders">导出订单</el-button>
          <el-button plain :disabled="!filteredAfterSales.length" @click="exportAfterSales">导出售后</el-button>
          <el-button type="primary" :loading="loading" @click="loadAll">刷新数据</el-button>
        </div>
      </div>
      <el-row :gutter="12" class="hero-stats">
        <el-col :span="4" v-for="item in orderStatCards" :key="item.key">
          <div class="mini-stat">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="订单列表" name="orders">
        <el-card class="panel-card" shadow="never">
          <div class="panel-toolbar">
            <div class="panel-title-block">
              <h3>筛选与检索</h3>
              <p>支持按订单号、用户、状态和时间范围查询。</p>
            </div>
            <el-form :inline="true" :model="orderQuery" class="filter-form" @submit.native.prevent="loadOrders">
              <el-form-item><el-input v-model="orderQuery.keyword" placeholder="订单号 / 用户ID / 收货人" clearable @keyup.enter.native="loadOrders" /></el-form-item>
              <el-form-item>
                <el-select v-model="orderQuery.status" clearable placeholder="状态">
                  <el-option label="待支付" :value="0" />
                  <el-option label="已支付" :value="1" />
                  <el-option label="已发货" :value="2" />
                  <el-option label="已完成" :value="3" />
                  <el-option label="已取消" :value="4" />
                  <el-option label="售后中" :value="5" />
                  <el-option label="已退款" :value="6" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="loadOrders">查询</el-button>
                <el-button @click="resetOrderQuery">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
          <el-table :data="pagedOrders" border stripe v-loading="loading" empty-text="暂无订单数据">
            <el-table-column prop="orderNo" label="订单号" min-width="180" />
            <el-table-column prop="userId" label="用户ID" width="90" />
            <el-table-column prop="totalAmount" label="金额" width="120">
              <template slot-scope="s">￥{{ money(s.row.totalAmount) }}</template>
            </el-table-column>
            <el-table-column label="状态" width="120"><template slot-scope="s"><el-tag :type="orderStatusType(s.row.status)" effect="plain">{{ text(s.row.status) }}</el-tag></template></el-table-column>
            <el-table-column label="创建时间" width="170"><template slot-scope="s">{{ formatTime(s.row.createdAt || s.row.createTime) }}</template></el-table-column>
            <el-table-column label="操作" width="320" fixed="right">
              <template slot-scope="s">
                <el-button size="mini" plain @click="openOrderDetail(s.row)">详情</el-button>
                <el-button v-if="Number(s.row.status)===1" size="mini" type="primary" @click="confirmShip(s.row)">发货</el-button>
                <el-button v-if="Number(s.row.status)===0 || Number(s.row.status)===1" size="mini" @click="confirmCancel(s.row)">取消</el-button>
                <el-button v-if="Number(s.row.status)===1 || Number(s.row.status)===2" size="mini" type="danger" plain @click="confirmRefund(s.row)">退款</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-wrap">
            <el-pagination background layout="total, prev, pager, next, jumper" :total="filteredOrders.length" :page-size="orderPageSize" :current-page.sync="orderPage" @current-change="syncOrderPage" />
          </div>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="售后审核" name="afterSale">
        <el-card class="panel-card" shadow="never">
          <div class="after-sale-toolbar">
            <div class="panel-title-block">
              <h3>售后审核</h3>
              <p>可优先筛选待审核申请，再查看订单明细辅助审核。</p>
            </div>
            <div class="after-sale-toolbar__actions">
              <el-select v-model="afterSaleStatusFilter" size="small" class="after-sale-filter" placeholder="全部状态" @change="handleAfterSaleStatusChange">
                <el-option label="全部状态" :value="-1" />
                <el-option label="待审核" :value="0" />
                <el-option label="已通过" :value="1" />
                <el-option label="已驳回" :value="2" />
                <el-option label="已退款" :value="3" />
              </el-select>
              <el-button size="small" plain @click="exportAfterSales">导出售后</el-button>
            </div>
          </div>

          <el-table :data="pagedAfterSales" border stripe v-loading="loading" empty-text="暂无售后数据">
            <el-table-column prop="orderNo" label="订单号" min-width="180" />
            <el-table-column prop="userId" label="用户ID" width="90" />
            <el-table-column prop="reason" label="退款原因" min-width="220" show-overflow-tooltip />
            <el-table-column label="申请时间" width="168">
              <template slot-scope="s">{{ formatTime(s.row.createdAt) }}</template>
            </el-table-column>
            <el-table-column label="审核时间" width="168">
              <template slot-scope="s">{{ formatTime(s.row.auditedAt) }}</template>
            </el-table-column>
            <el-table-column label="状态" width="120">
              <template slot-scope="s"><el-tag :type="afterSaleTagType(s.row.status)" effect="plain">{{ afterSaleText(s.row.status) }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="reply" label="处理意见" min-width="180" show-overflow-tooltip />
            <el-table-column label="操作" width="300" fixed="right">
              <template slot-scope="s">
                <el-button size="mini" plain @click="openOrderDetail(s.row)">订单详情</el-button>
                <el-button v-if="Number(s.row.status)===0" size="mini" type="success" @click="openAudit(s.row, 'approve')">通过</el-button>
                <el-button v-if="Number(s.row.status)===0" size="mini" type="danger" plain @click="openAudit(s.row, 'reject')">驳回</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-wrap">
            <el-pagination background layout="total, prev, pager, next, jumper" :total="afterSaleTotal" :page-size="afterSalePageSize" :current-page.sync="afterSalePage" @current-change="handleAfterSalePageChange" />
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog :title="auditMode === 'approve' ? '通过售后申请' : '驳回售后申请'" :visible.sync="auditDialogVisible" width="460px">
      <el-input v-model="auditReply" type="textarea" :rows="4" maxlength="120" show-word-limit :placeholder="auditMode === 'approve' ? '请输入通过说明，可留空' : '请输入驳回原因'" />
      <span slot="footer">
        <el-button @click="auditDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="auditLoading" @click="submitAudit">确认</el-button>
      </span>
    </el-dialog>

    <el-dialog title="订单详情" :visible.sync="detailDialogVisible" width="880px">
      <div v-if="orderDetail" class="order-detail-box">
        <div class="order-detail-summary">
          <div class="detail-panel-card">
            <span>订单号</span>
            <strong>{{ orderDetail.order.orderNo }}</strong>
            <small>{{ text(orderDetail.order.status) }}</small>
          </div>
          <div class="detail-panel-card">
            <span>收货人</span>
            <strong>{{ orderDetail.order.receiverName || '-' }}</strong>
            <small>{{ orderDetail.order.receiverPhone || '-' }}</small>
          </div>
          <div class="detail-panel-card detail-panel-card--full">
            <span>收货地址</span>
            <strong>{{ orderDetail.order.receiverAddress || '-' }}</strong>
          </div>
        </div>

        <div class="detail-section">
          <div class="section-head">
            <div>
              <h3>订单时间线</h3>
              <p>按业务节点展示订单创建、支付、发货、售后处理等进度。</p>
            </div>
            <div class="section-head__badge">TIMELINE</div>
          </div>
          <el-timeline class="order-timeline">
            <el-timeline-item :timestamp="formatTime(orderDetail.order.createdAt || orderDetail.order.createTime)" placement="top" color="#3b82f6">订单创建</el-timeline-item>
            <el-timeline-item :timestamp="formatTime(orderDetail.order.paidAt || orderDetail.order.payTime)" placement="top" :color="orderDetail.order.paidAt || orderDetail.order.payTime ? '#31c48d' : '#cbd5e1'">支付完成</el-timeline-item>
            <el-timeline-item :timestamp="formatTime(orderDetail.order.shippedAt || orderDetail.order.sendTime)" placement="top" :color="Number(orderDetail.order.status) >= 2 ? '#ff9d40' : '#cbd5e1'">订单发货</el-timeline-item>
            <el-timeline-item :timestamp="formatTime(orderDetail.order.completedAt || orderDetail.order.finishTime)" placement="top" :color="Number(orderDetail.order.status) >= 3 ? '#7b61ff' : '#cbd5e1'">订单完成</el-timeline-item>
            <el-timeline-item :timestamp="formatTime(orderDetail.afterSale?.createdAt || orderDetail.order.afterSaleCreatedAt)" placement="top" :color="orderDetail.afterSale ? '#ff7a5c' : '#cbd5e1'">售后申请</el-timeline-item>
            <el-timeline-item :timestamp="formatTime(orderDetail.afterSale?.auditedAt || orderDetail.order.afterSaleAuditedAt)" placement="top" :color="orderDetail.afterSale?.status ? '#f59e0b' : '#cbd5e1'">售后审核</el-timeline-item>
          </el-timeline>
        </div>

        <div class="detail-grid-2">
          <div class="detail-section detail-section--soft">
            <div class="section-head">
              <div>
                <h3>支付信息</h3>
                <p>展示该订单的支付方式、金额与支付状态。</p>
              </div>
              <div class="section-head__badge section-head__badge--soft">PAYMENT</div>
            </div>
            <div class="info-list">
              <div><span>订单金额</span><b>￥{{ money(orderDetail.order.totalAmount) }}</b></div>
              <div><span>实付金额</span><b>￥{{ money(orderDetail.order.payAmount || orderDetail.order.totalAmount) }}</b></div>
              <div><span>支付方式</span><b>{{ orderDetail.order.payType || '未记录' }}</b></div>
              <div><span>支付时间</span><b>{{ formatTime(orderDetail.order.paidAt || orderDetail.order.payTime) }}</b></div>
            </div>
          </div>

          <div class="detail-section detail-section--soft">
            <div class="section-head">
              <div>
                <h3>售后状态</h3>
                <p>记录是否存在售后申请以及当前处理进度。</p>
              </div>
              <div class="section-head__badge section-head__badge--soft">AFTER SALE</div>
            </div>
            <div class="info-list">
              <div><span>售后状态</span><b>{{ afterSaleText(orderDetail.afterSale?.status ?? orderDetail.order.afterSaleStatus) }}</b></div>
              <div><span>申请时间</span><b>{{ formatTime(orderDetail.afterSale?.createdAt || orderDetail.order.afterSaleCreatedAt) }}</b></div>
              <div><span>审核时间</span><b>{{ formatTime(orderDetail.afterSale?.auditedAt || orderDetail.order.afterSaleAuditedAt) }}</b></div>
              <div><span>处理意见</span><b>{{ orderDetail.afterSale?.reply || orderDetail.order.afterSaleReply || '-' }}</b></div>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <div class="section-head">
            <div>
              <h3>商品明细</h3>
              <p>查看该订单包含的全部商品项目。</p>
            </div>
            <div class="section-head__badge">ITEMS</div>
          </div>
          <div class="order-detail-items">
            <div v-for="item in orderDetail.items || []" :key="item.id" class="order-detail-item">
              <div class="order-detail-item__name">{{ item.productName }}</div>
              <div class="order-detail-item__meta">
                <span v-if="item.styleOption">{{ item.styleOption }}</span>
                <span>数量 {{ item.quantity }}</span>
                <span>金额 ￥{{ money(item.amount) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>
<script>
import { api } from "../../api";
import { pushAdminLog } from "../../utils/adminLog";
export default {
  data() {
    return {
      list: [],
      afterSales: [],
      activeTab: "orders",
      loading: false,
      orderQuery: { keyword: "", status: null },
      orderPage: 1,
      orderPageSize: 10,
      afterSalePage: 1,
      afterSalePageSize: 10,
      afterSaleTotal: 0,
      afterSaleStatusFilter: -1,
      auditDialogVisible: false,
      currentAfterSale: null,
      auditMode: "approve",
      auditReply: "",
      auditLoading: false,
      detailDialogVisible: false,
      orderDetail: null,
      orderTimeline: []
    };
  },
  computed: {
    filteredOrders() {
      const kw = String(this.orderQuery.keyword || "").trim().toLowerCase();
      return this.list.filter(item => {
        if (this.orderQuery.status !== null && this.orderQuery.status !== undefined && Number(item.status) !== Number(this.orderQuery.status)) return false;
        if (!kw) return true;
        return [item.orderNo, item.userId, item.receiverName, item.receiverPhone].join(" ").toLowerCase().includes(kw);
      });
    },

    pagedOrders() {
      const start = (this.orderPage - 1) * this.orderPageSize;
      return this.filteredOrders.slice(start, start + this.orderPageSize);
    },
    filteredAfterSales() {
      if (this.afterSaleStatusFilter === -1) return this.afterSales;
      return this.afterSales.filter(item => Number(item.status) === Number(this.afterSaleStatusFilter));
    },
    pagedAfterSales() {
      const start = (this.afterSalePage - 1) * this.afterSalePageSize;
      return this.filteredAfterSales.slice(start, start + this.afterSalePageSize);
    },
    orderStatCards() {
      const total = this.list.length;
      const unpaid = this.list.filter(item => Number(item.status) === 0).length;
      const paid = this.list.filter(item => Number(item.status) === 1).length;
      const shipped = this.list.filter(item => Number(item.status) === 2).length;
      const completed = this.list.filter(item => Number(item.status) === 3).length;
      const totalAmount = this.list.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);
      return [
        { key: 'total', label: '订单总数', value: total },
        { key: 'unpaid', label: '待支付', value: unpaid },
        { key: 'paid', label: '已支付', value: paid },
        { key: 'shipped', label: '已发货', value: shipped },
        { key: 'done', label: '已完成', value: completed },
        { key: 'amount', label: '订单金额', value: `￥${this.money(totalAmount)}` }
      ];
    }
  },
  async created() {
    await this.loadAll();
  },
  methods: {
    async loadAll() {
      this.loading = true;
      try {
        await Promise.all([this.loadOrders(), this.loadAfterSales()]);
      } finally {
        this.loading = false;
      }
    },
    text(s){return ({0:"待支付",1:"已支付",2:"已发货",3:"已完成",4:"已取消",5:"售后中",6:"已退款"})[Number(s)]||"-";},
    orderStatusType(status) { return ({ 0: "warning", 1: "primary", 2: "success", 3: "success", 4: "info", 5: "warning", 6: "success" })[Number(status)] || "info"; },
    afterSaleText(s){return ({0:"待审核",1:"已通过",2:"已驳回",3:"已退款"})[Number(s)]||"-";},
    afterSaleTagType(status) { return ({ 0: "warning", 1: "success", 2: "info", 3: "success" })[Number(status)] || "info"; },

    formatTime(value) { return value ? String(value).replace("T", " ").slice(0, 16) : "-"; },
    money(value) { const n = Number(value || 0); return Number.isNaN(n) ? "0.00" : n.toFixed(2); },
    async loadOrders(){
      const res = await api.adminOrders({ pageNum:1, pageSize:100 });
      this.list = Array.isArray(res) ? res : res?.records || [];
      this.orderPage = Math.min(this.orderPage, Math.max(Math.ceil(this.filteredOrders.length / this.orderPageSize), 1));
    },
    async loadAfterSales(){
      const res = await api.adminAfterSales({ pageNum: this.afterSalePage, pageSize: this.afterSalePageSize, status: this.afterSaleStatusFilter === -1 ? undefined : this.afterSaleStatusFilter });
      const payload = res?.data || res || {};
      const records = Array.isArray(payload.records) ? payload.records : [];
      this.afterSales = records;
      this.afterSaleTotal = payload.total ?? records.length;
      if (!this.afterSales.length && this.afterSalePage > 1 && this.afterSaleTotal > 0) {
        this.afterSalePage = 1;
        return this.loadAfterSales();
      }
    },
    syncOrderPage(page) { this.orderPage = page; },
    resetOrderQuery() { this.orderQuery = { keyword: "", status: null }; this.orderPage = 1; this.loadOrders(); },
    async confirmShip(r){
      try { await this.$confirm(`确认将订单 ${r.orderNo} 标记为已发货吗？`, "提示", { type: "warning" }); } catch (e) { if (e === "cancel" || e === "close") return; }
      await api.adminOrderShip(r.id);
      pushAdminLog({ module: "order", action: "ship", content: `订单发货【${r.orderNo}】`, target: r.orderNo, risky: false, meta: { orderId: r.id } });
      this.$message.success("已发货");
      await this.loadAll();
    },
    async confirmCancel(r){
      try { await this.$confirm(`确认取消订单 ${r.orderNo} 吗？`, "提示", { type: "warning" }); } catch (e) { if (e === "cancel" || e === "close") return; }
      await api.adminOrderCancel(r.id);
      pushAdminLog({ module: "order", action: "cancel", content: `取消订单【${r.orderNo}】`, target: r.orderNo, risky: true, meta: { orderId: r.id } });
      this.$message.success("已取消");
      await this.loadAll();
    },
    async confirmRefund(r){
      try { await this.$confirm(`确认对订单 ${r.orderNo} 执行退款吗？`, "提示", { type: "warning" }); } catch (e) { if (e === "cancel" || e === "close") return; }
      await api.adminOrderRefund(r.id);
      pushAdminLog({ module: "order", action: "refund", content: `订单退款【${r.orderNo}】`, target: r.orderNo, risky: true, meta: { orderId: r.id } });
      this.$message.success("退款处理成功");
      await this.loadAll();
    },
    async openOrderDetail(row) {
      const detail = await api.adminOrderDetail(row.orderId || row.id);
      const normalized = Array.isArray(detail) ? detail[0] : detail;
      this.orderDetail = this.normalizeOrderDetail(normalized, row);
      this.orderTimeline = this.buildOrderTimeline(this.orderDetail);
      this.detailDialogVisible = true;
    },
    normalizeOrderDetail(detail, fallback) {
      const order = detail?.order || detail || {};
      return {
        order: {
          ...fallback,
          ...order,
          orderNo: order.orderNo || fallback.orderNo || `#${fallback.id || fallback.orderId || '-'}`,
          status: order.status ?? fallback.status,
          totalAmount: order.totalAmount ?? fallback.totalAmount,
          payAmount: order.payAmount ?? order.totalAmount ?? fallback.totalAmount,
          payType: order.payType ?? fallback.payType,
          createdAt: order.createdAt || order.createTime || fallback.createdAt || fallback.createTime,
          paidAt: order.paidAt || order.payTime || fallback.paidAt || fallback.payTime,
          shippedAt: order.shippedAt || order.sendTime || fallback.shippedAt || fallback.sendTime,
          completedAt: order.completedAt || order.finishTime || fallback.completedAt || fallback.finishTime,
          receiverName: order.receiverName || fallback.receiverName,
          receiverPhone: order.receiverPhone || fallback.receiverPhone,
          receiverAddress: order.receiverAddress || fallback.receiverAddress,
          afterSaleStatus: order.afterSaleStatus ?? fallback.afterSaleStatus,
          afterSaleCreatedAt: order.afterSaleCreatedAt || fallback.afterSaleCreatedAt,
          afterSaleAuditedAt: order.afterSaleAuditedAt || fallback.afterSaleAuditedAt,
          afterSaleReply: order.afterSaleReply || fallback.afterSaleReply
        },
        items: detail?.items || detail?.orderItems || fallback.items || [],
        afterSale: detail?.afterSale || detail?.aftersale || detail?.afterSales || fallback.afterSale || null
      };
    },
    buildOrderTimeline(detail) {
      const order = detail?.order || {};
      const afterSale = detail?.afterSale || {};
      return [
        { label: "订单创建", time: order.createdAt || order.createTime, color: "#3b82f6" },
        { label: "支付完成", time: order.paidAt || order.payTime, color: order.paidAt || order.payTime ? "#31c48d" : "#cbd5e1" },
        { label: "订单发货", time: order.shippedAt || order.sendTime, color: Number(order.status) >= 2 ? "#ff9d40" : "#cbd5e1" },
        { label: "订单完成", time: order.completedAt || order.finishTime, color: Number(order.status) >= 3 ? "#7b61ff" : "#cbd5e1" },
        { label: "售后申请", time: afterSale.createdAt || order.afterSaleCreatedAt, color: afterSale.createdAt || order.afterSaleCreatedAt ? "#ff7a5c" : "#cbd5e1" },
        { label: "售后审核", time: afterSale.auditedAt || order.afterSaleAuditedAt, color: afterSale.auditedAt || order.afterSaleAuditedAt ? "#f59e0b" : "#cbd5e1" }
      ];
    },
    openAudit(row, mode){ this.currentAfterSale = row; this.auditMode = mode; this.auditReply = ""; this.auditDialogVisible = true; },
    handleAfterSalePageChange(page) { this.afterSalePage = page; this.loadAfterSales(); },
    handleAfterSaleStatusChange() { this.afterSalePage = 1; this.loadAfterSales(); },
    async submitAudit(){
      if(!this.currentAfterSale) return;
      if(this.auditMode === "reject" && !String(this.auditReply || "").trim()) return this.$message.warning("请输入驳回原因");
      this.auditLoading = true;
      try {
        if(this.auditMode === "approve") await api.adminApproveAfterSale(this.currentAfterSale.id);
        else await api.adminRejectAfterSale(this.currentAfterSale.id, this.auditReply);
        pushAdminLog({ module: "afterSale", action: this.auditMode === "approve" ? "approve" : "reject", content: `${this.auditMode === "approve" ? "通过" : "驳回"}售后申请【${this.currentAfterSale.orderNo || this.currentAfterSale.id}】`, target: this.currentAfterSale.orderNo || String(this.currentAfterSale.id), risky: this.auditMode === "reject", meta: { afterSaleId: this.currentAfterSale.id, reply: this.auditReply } });
        this.$message.success(this.auditMode === "approve" ? "售后申请已通过并完成退款" : "售后申请已驳回");
        this.auditDialogVisible = false;
        this.currentAfterSale = null;
        this.auditReply = "";
        this.afterSalePage = 1;
        await this.loadAfterSales();
      } finally {
        this.auditLoading = false;
      }
    },
    async openAudit(row, mode){
      try { await this.$confirm(mode === "approve" ? "确认通过该售后申请吗？" : "确认驳回该售后申请吗？", "提示", { type: "warning" }); } catch (e) { if (e === "cancel" || e === "close") return; }
      this.currentAfterSale = row; this.auditMode = mode; this.auditReply = ""; this.auditDialogVisible = true;
    },
    exportOrders() {
      const rows = this.filteredOrders.map(item => [item.orderNo, item.userId, this.money(item.totalAmount), this.text(item.status), this.formatTime(item.createdAt || item.createTime)]);
      const csv = [["订单号", "用户ID", "金额", "状态", "创建时间"], ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "orders-export.csv";
      a.click();
      URL.revokeObjectURL(url);
    },
    exportAfterSales() {
      const rows = this.filteredAfterSales.map(item => [item.orderNo, item.userId, item.reason, this.afterSaleText(item.status), this.formatTime(item.createdAt), this.formatTime(item.auditedAt), item.reply || ""]);
      const csv = [["订单号", "用户ID", "原因", "状态", "申请时间", "审核时间", "处理意见"], ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "after-sales-export.csv";
      a.click();
      URL.revokeObjectURL(url);
    }
  }
};
</script>
<style scoped>
.admin-orders-page { display:grid; gap:18px; }
.hero-card, .panel-card { border-radius:18px; border:1px solid #eef1f6; }
.hero-card { background:linear-gradient(135deg,#ffffff 0%,#fbfcff 100%); }
.hero-head { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; }
.hero-badge { display:inline-flex; padding:7px 12px; border-radius:999px; background:#eef6ff; color:#3b82f6; font-size:11px; font-weight:800; letter-spacing:1.2px; }
.hero-title { margin:10px 0 0; font-size:28px; font-weight:900; color:#202536; }
.hero-desc { margin:8px 0 0; color:#7b8395; line-height:1.7; max-width:860px; }
.hero-actions { display:flex; gap:10px; flex-wrap:wrap; justify-content:flex-end; }
.hero-stats { margin-top:16px; }
.mini-stat { border:1px solid #eef1f6; border-radius:16px; background:linear-gradient(135deg,#fff,#fbfcff); padding:14px 16px; }
.mini-stat span { display:block; color:#7b8395; font-size:12px; }
.mini-stat strong { display:block; margin-top:8px; color:#202536; font-size:20px; font-weight:900; }
.panel-card { border-radius:18px; }
.panel-toolbar { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; flex-wrap:wrap; margin-bottom:14px; }
.panel-title-block h3 { margin:0; color:#202536; font-size:18px; font-weight:900; }
.panel-title-block p { margin:6px 0 0; color:#7b8395; font-size:13px; }
.filter-form { display:flex; flex-wrap:wrap; gap:0 10px; margin-bottom:-18px; }
.pagination-wrap { margin-top:18px; display:flex; justify-content:flex-end; }
.after-sale-toolbar { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:14px; flex-wrap:wrap; }
.after-sale-toolbar__actions { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
.after-sale-filter { width:140px; }
.order-detail-box { display:grid; gap:16px; }
.order-detail-summary { display:grid; gap:10px; color:#5a6374; font-size:14px; }
.order-detail-summary strong { color:#1c2434; }
.order-detail-items { display:grid; gap:12px; }
.order-detail-item { padding:14px 16px; border-radius:14px; background:#f8fbff; border:1px solid #e8eef5; }
.order-detail-item__name { color:#1c2434; font-size:15px; font-weight:700; }
.order-detail-item__meta { display:flex; flex-wrap:wrap; gap:12px; margin-top:8px; color:#7f8899; font-size:13px; }
@media (max-width:1100px) { .hero-head, .panel-toolbar, .after-sale-toolbar { flex-direction:column; } .hero-actions { justify-content:flex-start; } }
@media (max-width:760px) { .hero-actions { width:100%; } .after-sale-filter { width:100%; } }
</style>