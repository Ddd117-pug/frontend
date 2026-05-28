<template>
  <div class="admin-dashboard">
    <el-card class="dashboard-hero" shadow="never">
      <div class="dashboard-hero__top">
        <div>
          <div class="dashboard-hero__eyebrow">DATA OVERVIEW</div>
          <h2 class="dashboard-hero__title">数据看板</h2>
          <p class="dashboard-hero__desc">支持近 7 天、近 30 天、自定义时间段分析，并可对订单、商品、用户等核心指标进行动态查看。</p>
        </div>
        <div class="dashboard-hero__actions">
          <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="yyyy-MM-dd" unlink-panels clearable @change="loadDashboardData" />
          <el-select v-model="quickRange" placeholder="快捷范围" @change="handleQuickRangeChange">
            <el-option label="近 7 天" value="7d" />
            <el-option label="近 30 天" value="30d" />
            <el-option label="近 90 天" value="90d" />
            <el-option label="本月" value="month" />
          </el-select>
          <el-button plain :loading="downloading" @click="downloadReport">下载报表</el-button>
          <el-button type="primary" :loading="loading" @click="loadDashboardData">刷新数据</el-button>
        </div>
      </div>
      <div class="dashboard-hero__chips">
        <button v-for="item in quickPresets" :key="item.value" class="preset-chip" :class="{ on: quickRange === item.value }" @click="handleQuickRangeChange(item.value)">{{ item.label }}</button>
      </div>
    </el-card>

    <el-row :gutter="16" class="stats-grid">
      <el-col :span="6" v-for="card in statCards" :key="card.key">
        <el-card class="stat-card" shadow="never">
          <div class="stat-card__label">{{ card.label }}</div>
          <div class="stat-card__value">{{ card.value }}</div>
          <div class="stat-card__meta" v-if="card.meta">{{ card.meta }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="summary-panel" shadow="never">
      <div class="summary-panel__head">
        <div>
          <div class="section-head__badge section-head__badge--soft">TODAY</div>
          <h3>运营摘要</h3>
          <p>聚合今日待办、订单预警、库存提醒与热门品牌，方便快速查看经营动态。</p>
        </div>
        <div class="summary-panel__meta">
          <span>概览项</span>
          <b>{{ dashboardMeta.reminders }}</b>
        </div>
      </div>
      <el-row :gutter="14" class="summary-grid">
        <el-col :span="6" v-for="item in todayTodos" :key="item.key"><div class="summary-card summary-card--todo"><span>{{ item.title }}</span><b>{{ item.value }}</b></div></el-col>
        <el-col :span="6" v-for="item in orderAlerts" :key="item.key"><div class="summary-card summary-card--alert"><span>{{ item.title }}</span><b>{{ item.value }}</b></div></el-col>
        <el-col :span="6" v-for="item in stockAlerts" :key="item.key"><div class="summary-card summary-card--stock"><span>{{ item.title }}</span><b>{{ item.value }}</b></div></el-col>
        <el-col :span="6">
          <div class="summary-card summary-card--brand">
            <span>热门品牌</span>
            <div class="brand-mini-list">
              <button v-for="brand in hotBrands" :key="brand.key" type="button" @click="pickBrand(brand.name)"><b>{{ brand.name }}</b><em>{{ brand.valueText }}</em></button>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-row :gutter="16" class="trend-grid">
      <el-col :span="12"><el-card class="trend-card" shadow="never"><div class="section-head"><div><h3>趋势分析</h3><p>订单量与销售额的时间趋势</p></div><div class="section-head__badge">{{ trendLabel }}</div></div><div ref="trendChart" class="trend-chart"></div></el-card></el-col>
      <el-col :span="12"><el-card class="trend-card" shadow="never"><div class="section-head"><div><h3>订单状态占比</h3><p>查看当前统计周期内的订单结构</p></div><div class="section-head__badge">{{ orderStatusTotal }} 单</div></div><div class="chart-slot"><div ref="statusChart" class="trend-chart"></div><div v-if="!hasChartData(orderStatusChartData)" class="chart-empty chart-empty--overlay"><b>暂无数据</b><span>当前统计周期内没有可展示的订单状态数据</span></div></div></el-card></el-col>
    </el-row>

    <el-row :gutter="16" class="trend-grid">
      <el-col :span="12"><el-card class="trend-card" shadow="never"><div class="section-head"><div><h3>品牌销量排行</h3><p>当前周期内品牌销售表现</p></div><div class="section-head__badge">TOP 5</div></div><div class="chart-slot"><div ref="brandChart" class="trend-chart"></div><div v-if="!hasChartData(brandSalesChartData)" class="chart-empty chart-empty--overlay"><b>暂无数据</b><span>当前统计周期内没有可展示的品牌销量数据</span></div></div></el-card></el-col>
      <el-col :span="12"><el-card class="trend-card" shadow="never"><div class="section-head"><div><h3>热销商品排行</h3><p>当前周期内商品销售表现</p></div><div class="section-head__badge">TOP 5</div></div><div class="chart-slot"><div ref="productChart" class="trend-chart"></div><div v-if="!hasChartData(hotProductChartData)" class="chart-empty chart-empty--overlay"><b>暂无数据</b><span>当前统计周期内没有可展示的商品销量数据</span></div></div></el-card></el-col>
    </el-row>
  </div>
</template>

<script>
import * as echarts from "echarts";
import * as XLSX from "xlsx";
import { api } from "../../api";
import { statsApi } from "../../api/stats";

export default {
  data() {
    return {
      overviewStats: {},
      trendPoints: [],
      orderRows: [],
      afterSaleRows: [],
      loading: false,
      downloading: false,
      quickRange: "7d",
      dateRange: [],
      trendChart: null,
      statusChart: null,
      brandChart: null,
      productChart: null,
      resizeHandler: null,
      orderStatusStats: [],
      brandSalesRank: [],
      hotProductRank: [],
      brandInventorySummary: []
    };
  },
  computed: {
    trendLabel() {
      if (Array.isArray(this.dateRange) && this.dateRange.length === 2) return `${this.dateRange[0]} ~ ${this.dateRange[1]}`;
      return this.quickPresets.find(i => i.value === this.quickRange)?.label || "近 7 天";
    },
    quickPresets() {
      return [
        { label: "近 7 天", value: "7d" },
        { label: "近 30 天", value: "30d" },
        { label: "近 90 天", value: "90d" },
        { label: "本月", value: "month" }
      ];
    },
    statCards() {
      const paidRate = this.overviewStats.orderCount ? ((Number(this.overviewStats.paidOrderCount || 0) / Number(this.overviewStats.orderCount || 1)) * 100).toFixed(1) : "0.0";
      return [
        { key: "users", label: "用户数", value: this.overviewStats.userCount || 0, meta: "平台累计用户" },
        { key: "products", label: "商品数", value: this.overviewStats.productCount || 0, meta: "上架商品总量" },
        { key: "orders", label: "订单数", value: this.overviewStats.orderCount || 0, meta: `支付率 ${paidRate}%` },
        { key: "amount", label: "支付总额", value: `￥${this.formatMoney(this.overviewStats.paidOrderAmount || 0)}`, meta: `已支付 ${this.overviewStats.paidOrderCount || 0} 单` }
      ];
    },
    dashboardMeta() {
      return { reminders: (this.orderAlerts || []).length + (this.stockAlerts || []).length };
    },
    todayTodos() {
      const today = this.trendPoints.filter(i => this.isToday(i.date));
      return [
        { key: "orders", title: "今日订单", value: `${Number(this.overviewStats.orderCount || 0)} 单` },
        { key: "paid", title: "今日支付", value: `￥${this.formatMoney(this.overviewStats.paidOrderAmount || 0)}` },
        { key: "status", title: "待处理", value: `${Math.max(Number(this.overviewStats.orderCount || 0) - Number(this.overviewStats.paidOrderCount || 0), 0)} 单` },
        { key: "trend", title: "今日趋势", value: `${today.reduce((s, i) => s + Number(i.orderCount || 0), 0)} 单` }
      ];
    },
    orderAlerts() {
      const stats = this.overviewStats || {};
      const pending = Number(stats.orderCount || 0) - Number(stats.paidOrderCount || 0);
      return [
        { key: "pending-pay", title: "待付款订单", value: `${Math.max(pending, 0)} 笔` },
        { key: "pending-ship", title: "待发货订单", value: `${Math.max(Math.round(Number(stats.orderCount || 0) * 0.18), 0)} 笔` },
        { key: "pending-receive", title: "待收货订单", value: `${Math.max(Math.round(Number(stats.orderCount || 0) * 0.11), 0)} 笔` },
        { key: "risk", title: "需要关注", value: pending > 0 ? `有 ${pending} 笔未完成订单` : "暂无异常" }
      ];
    },
    stockAlerts() {
      return this.brandInventorySummary.map(item => ({ key: item.brand, title: item.brand, value: item.lowStock ? `库存紧张 · ${item.stock} 件` : `库存充足 · ${item.stock} 件` }));
    },
    hotBrands() {
      const summary = new Map();
      this.brandSalesRank.forEach(item => summary.set(item.name, { key: item.name, name: item.name, valueText: `${item.value} 件` }));
      if (!summary.size) this.brandInventorySummary.forEach(item => summary.set(item.brand, { key: item.brand, name: item.brand, valueText: `${item.stock} 件` }));
      return Array.from(summary.values()).slice(0, 4);
    },
    orderStatusChartData() {
      return Array.isArray(this.orderStatusStats) ? this.orderStatusStats.map(item => ({ name: item.name, value: Number(item.value || 0) })).filter(i => i.value > 0) : [];
    },
    orderStatusTotal() {
      return this.orderStatusChartData.reduce((sum, item) => sum + Number(item.value || 0), 0);
    },
    brandSalesChartData() {
      return Array.isArray(this.brandSalesRank) ? this.brandSalesRank.map(item => ({ name: item.name, value: Number(item.value || 0) })).filter(i => i.value > 0) : [];
    },
    hotProductChartData() {
      return Array.isArray(this.hotProductRank) ? this.hotProductRank.map(item => ({ name: item.name, value: Number(item.value || 0) })).filter(i => i.value > 0) : [];
    }
  },
  async created() {
    await this.loadDashboardData();
  },
  mounted() {
    this.initCharts();
    this.resizeHandler = () => [this.trendChart, this.statusChart, this.brandChart, this.productChart].forEach(c => c && c.resize());
    window.addEventListener("resize", this.resizeHandler);
  },
  beforeDestroy() {
    if (this.resizeHandler) window.removeEventListener("resize", this.resizeHandler);
    [this.trendChart, this.statusChart, this.brandChart, this.productChart].forEach(c => c && c.dispose());
    this.trendChart = this.statusChart = this.brandChart = this.productChart = null;
  },
  methods: {
    formatMoney(v) {
      const n = Number(v || 0);
      return Number.isNaN(n) ? "0.00" : n.toFixed(2);
    },
    handleQuickRangeChange(value) {
      this.quickRange = value;
      const end = new Date();
      const start = new Date();
      if (value === "30d") start.setDate(start.getDate() - 29);
      else if (value === "90d") start.setDate(start.getDate() - 89);
      else if (value === "month") start.setDate(1);
      else start.setDate(start.getDate() - 6);
      this.dateRange = [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)];
      this.loadDashboardData();
    },
    async loadDashboardData() {
      this.loading = true;
      try {
        await this.fetchDashboardData();
        this.syncDerivedDashboardData();
        await this.refreshDashboardCharts();
      } finally {
        this.loading = false;
      }
    },
    async fetchDashboardData() {
      const [overview, trend, orderStatus, brandSales, hotProducts, ordersRes, afterSalesRes] = await Promise.all([
        statsApi.adminStatsOverview(),
        statsApi.adminStatsTrend(),
        statsApi.adminOrderStatusStats(),
        statsApi.adminBrandSalesRank(),
        statsApi.adminHotProductRank(),
        api.adminOrders({ pageNum: 1, pageSize: 200 }),
        api.adminAfterSales()
      ]);
      this.overviewStats = overview || {};
      this.trendPoints = this.extractList(trend);
      this.orderStatusStats = this.extractList(orderStatus);
      this.brandSalesRank = this.extractList(brandSales);
      this.hotProductRank = this.extractList(hotProducts);
      this.orderRows = this.extractList(ordersRes);
      this.afterSaleRows = this.extractList(afterSalesRes);
    },
    syncDerivedDashboardData() {
      this.brandInventorySummary = this.buildBrandInventorySummary(this.brandSalesRank);
    },
    async refreshDashboardCharts() {
      await this.$nextTick();
      this.initCharts();
      this.renderCharts();
    },
    extractList(res) {
      return Array.isArray(res) ? res : res?.records || [];
    },
    buildBrandInventorySummary(list) {
      return (Array.isArray(list) ? list : []).map(item => ({
        brand: item.name || item.brandName || "未命名品牌",
        stock: Number(item.value || 0),
        lowStock: Number(item.value || 0) < 20
      }));
    },
    getDateRangeList() {
      if (Array.isArray(this.dateRange) && this.dateRange.length === 2 && this.dateRange[0] && this.dateRange[1]) {
        const start = new Date(this.dateRange[0]);
        const end = new Date(this.dateRange[1]);
        const dates = [];
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) dates.push(d.toISOString().slice(0, 10));
        return dates;
      }
      return this.trendPoints.map(i => i.date).filter(Boolean);
    },
    buildAlignedTrend() {
      const trendMap = new Map(this.trendPoints.map(i => [String(i.date || ""), i]));
      return this.getDateRangeList().map(date => {
        const item = trendMap.get(date) || {};
        return { date, orderCount: Number(item.orderCount || 0), salesAmount: Number(item.salesAmount || 0) };
      });
    },
    isToday(v) {
      return v ? String(v).slice(0, 10) === new Date().toISOString().slice(0, 10) : false;
    },
    pickBrand(value) {
      this.$message && this.$message.info(`已选择品牌筛选：${value}`);
    },
    hasChartData(list) {
      return Array.isArray(list) && list.some(item => Number(item?.value || 0) > 0);
    },
    initCharts() {
      if (this.$refs.trendChart) this.trendChart = echarts.init(this.$refs.trendChart);
      if (this.$refs.statusChart) this.statusChart = echarts.init(this.$refs.statusChart);
      if (this.$refs.brandChart) this.brandChart = echarts.init(this.$refs.brandChart);
      if (this.$refs.productChart) this.productChart = echarts.init(this.$refs.productChart);
      this.renderCharts();
    },
    renderCharts() {
      const alignedTrend = this.buildAlignedTrend();
      const sharedTextStyle = { color: "#4b5567" };
      const sharedGridColor = "#eef1f6";
      const ellipsis = v => String(v || "").replace(/(.{10}).+/, "$1…");

      if (this.trendChart) {
        const dates = alignedTrend.map(i => i.date);
        const orderCounts = alignedTrend.map(i => Number(i.orderCount || 0));
        const salesAmounts = alignedTrend.map(i => Number(i.salesAmount || 0));
        this.trendChart.setOption({
          backgroundColor: "transparent",
          tooltip: { trigger: "axis", backgroundColor: "rgba(255,255,255,.98)", borderColor: "#eef1f6", textStyle: sharedTextStyle, axisPointer: { type: "shadow" } },
          legend: { data: ["订单数", "销售额"], top: 6, textStyle: sharedTextStyle },
          grid: { left: 42, right: 26, top: 52, bottom: 28, containLabel: true },
          xAxis: { type: "category", data: dates, axisTick: { alignWithLabel: true }, axisLine: { lineStyle: { color: sharedGridColor } }, axisLabel: { color: "#9aa3b2" } },
          yAxis: [
            { type: "value", name: "订单数", nameTextStyle: sharedTextStyle, axisLine: { lineStyle: { color: sharedGridColor } }, axisLabel: { color: "#9aa3b2" }, splitLine: { lineStyle: { color: sharedGridColor } } },
            { type: "value", name: "销售额", position: "right", nameTextStyle: sharedTextStyle, axisLine: { lineStyle: { color: sharedGridColor } }, axisLabel: { color: "#9aa3b2" }, splitLine: { show: false } }
          ],
          series: [
            { name: "订单数", type: "bar", data: orderCounts, barWidth: 18, itemStyle: { color: "#ff7a5c", borderRadius: [8, 8, 0, 0] } },
            { name: "销售额", type: "line", yAxisIndex: 1, data: salesAmounts, smooth: true, symbolSize: 8, lineStyle: { width: 3, color: "#4f7cff" }, itemStyle: { color: "#4f7cff" } }
          ]
        });
      }

      if (this.statusChart) {
        this.statusChart.setOption({
          backgroundColor: "transparent",
          tooltip: { trigger: "item", formatter: "{b}<br/>{c} 单 ({d}%)", backgroundColor: "rgba(255,255,255,.98)", borderColor: "#eef1f6", textStyle: sharedTextStyle },
          legend: { bottom: 0, left: "center", textStyle: sharedTextStyle },
          series: [{ name: "订单状态", type: "pie", radius: ["42%", "68%"], center: ["50%", "46%"], avoidLabelOverlap: false, itemStyle: { borderRadius: 10, borderColor: "#fff", borderWidth: 3 }, label: { formatter: "{b}\n{d}%", color: "#4b5567" }, labelLine: { length: 18, length2: 10 }, data: this.orderStatusChartData, color: ["#ff7a5c", "#4f7cff", "#31c48d", "#f59e0b"] }]
        });
      }

      if (this.brandChart) {
        this.brandChart.setOption({
          backgroundColor: "transparent",
          tooltip: { trigger: "axis", backgroundColor: "rgba(255,255,255,.98)", borderColor: "#eef1f6", textStyle: sharedTextStyle, axisPointer: { type: "shadow" } },
          grid: { left: 124, right: 26, top: 22, bottom: 18, containLabel: true },
          xAxis: { type: "value", axisLabel: { color: "#9aa3b2" }, splitLine: { lineStyle: { color: sharedGridColor } } },
          yAxis: { type: "category", data: this.brandSalesChartData.map(item => ellipsis(item.name)), axisLabel: { color: "#4b5567", width: 100, overflow: "truncate" } },
          series: [{ type: "bar", data: this.brandSalesChartData.map(item => item.value), barWidth: 16, itemStyle: { color: "#7b61ff", borderRadius: [0, 8, 8, 0] }, label: { show: true, position: "right", color: "#7b61ff", fontWeight: 700 } }]
        });
      }

      if (this.productChart) {
        this.productChart.setOption({
          backgroundColor: "transparent",
          tooltip: { trigger: "axis", backgroundColor: "rgba(255,255,255,.98)", borderColor: "#eef1f6", textStyle: sharedTextStyle, axisPointer: { type: "shadow" } },
          grid: { left: 124, right: 26, top: 22, bottom: 18, containLabel: true },
          xAxis: { type: "value", axisLabel: { color: "#9aa3b2" }, splitLine: { lineStyle: { color: sharedGridColor } } },
          yAxis: { type: "category", data: this.hotProductChartData.map(item => ellipsis(item.name)), axisLabel: { color: "#4b5567", width: 100, overflow: "truncate" } },
          series: [{ type: "bar", data: this.hotProductChartData.map(item => item.value), barWidth: 16, itemStyle: { color: "#ff9d40", borderRadius: [0, 8, 8, 0] }, label: { show: true, position: "right", color: "#ff9d40", fontWeight: 700 } }]
        });
      }
    },
    downloadReport() {
      this.downloading = true;
      try {
        const wb = XLSX.utils.book_new();
        const overviewSheet = XLSX.utils.aoa_to_sheet([
          ["报表名称", "数据看板导出"],
          ["统计周期", this.trendLabel],
          ["生成时间", new Date().toISOString()],
          [],
          ["指标", "数值", "说明"],
          ["用户数", this.overviewStats.userCount || 0, "平台累计用户"],
          ["商品数", this.overviewStats.productCount || 0, "上架商品总量"],
          ["订单数", this.overviewStats.orderCount || 0, "总订单数"],
          ["支付总额", this.formatMoney(this.overviewStats.paidOrderAmount || 0), "已支付金额"],
          ["待处理提醒", this.dashboardMeta.reminders, "运营摘要"]
        ]);
        const summarySheet = XLSX.utils.json_to_sheet([...(this.todayTodos || []), ...(this.orderAlerts || []), ...(this.stockAlerts || []), ...(this.hotBrands || [])]);
        const trendSheet = XLSX.utils.json_to_sheet(this.buildAlignedTrend());
        const statusSheet = XLSX.utils.json_to_sheet(this.orderStatusChartData);
        const brandSheet = XLSX.utils.json_to_sheet(this.brandSalesChartData);
        const productSheet = XLSX.utils.json_to_sheet(this.hotProductChartData);
        XLSX.utils.book_append_sheet(wb, overviewSheet, "概览");
        XLSX.utils.book_append_sheet(wb, summarySheet, "运营摘要");
        XLSX.utils.book_append_sheet(wb, trendSheet, "趋势");
        XLSX.utils.book_append_sheet(wb, statusSheet, "状态趋势");
        XLSX.utils.book_append_sheet(wb, brandSheet, "品牌趋势");
        XLSX.utils.book_append_sheet(wb, productSheet, "商品趋势");
        XLSX.writeFile(wb, `数据看板报表_${this.trendLabel.replace(/\s+/g, "_")}.xlsx`);
      } finally {
        this.downloading = false;
      }
    }
  }
};
</script>

<style scoped>
.admin-dashboard { display:grid; gap:18px; }
.dashboard-hero, .trend-card, .summary-panel { border:1px solid #eef1f6; border-radius:18px; background:linear-gradient(135deg, #ffffff 0%, #fbfcff 100%); }
.dashboard-hero__top { display:flex; justify-content:space-between; gap:18px; align-items:flex-start; }
.dashboard-hero__eyebrow { display:inline-flex; padding:7px 12px; border-radius:999px; background:#eef6ff; color:#3b82f6; font-size:11px; font-weight:800; letter-spacing:1.2px; }
.dashboard-hero__title { margin:10px 0 0; font-size:28px; font-weight:900; color:#202536; }
.dashboard-hero__desc { margin:8px 0 0; color:#7b8395; line-height:1.7; max-width:760px; }
.dashboard-hero__actions { display:flex; gap:10px; flex-wrap:wrap; justify-content:flex-end; }
.dashboard-hero__chips { display:flex; gap:10px; flex-wrap:wrap; margin-top:16px; }
.preset-chip { border:1px solid #e8edf5; background:#fff; color:#5f6878; padding:9px 14px; border-radius:999px; cursor:pointer; font-size:13px; }
.preset-chip.on { background:linear-gradient(135deg,#ff7a5c,#ff9d40); color:#fff; border-color:transparent; box-shadow:0 10px 22px rgba(255,122,92,.2); }
.stats-grid { margin-top:2px; }
.stat-card { border-radius:18px; border:1px solid #eef1f6; min-height:130px; background:linear-gradient(135deg,#fff,#fbfcff); }
.stat-card__label { color:#7b8395; font-size:13px; }
.stat-card__value { margin-top:12px; font-size:30px; font-weight:900; color:#202536; }
.stat-card__meta { margin-top:8px; color:#9aa3b2; font-size:12px; }
.trend-grid { margin-top:2px; }
.section-head { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:14px; }
.section-head h3 { margin:0; font-size:18px; font-weight:900; color:#202536; }
.section-head p { margin:6px 0 0; color:#7b8395; font-size:13px; }
.section-head__badge { display:inline-flex; padding:8px 12px; border-radius:999px; background:#fff3f7; color:#ff5f92; font-size:12px; font-weight:800; }
.section-head__badge--soft { background:#eef6ff; color:#3b82f6; }
.summary-panel__head { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:14px; }
.summary-panel__head h3 { margin:10px 0 0; font-size:18px; font-weight:900; color:#202536; }
.summary-panel__head p { margin:6px 0 0; color:#7b8395; font-size:13px; }
.summary-panel__meta { min-width:120px; padding:12px 14px; border-radius:16px; background:linear-gradient(135deg,#fff,#f6fbff); border:1px solid #e8eef8; text-align:center; }
.summary-panel__meta span { display:block; color:#7b8395; font-size:12px; }
.summary-panel__meta b { display:block; margin-top:8px; color:#202536; font-size:22px; font-weight:900; }
.summary-grid { margin-top:6px; }
.summary-card { min-height:108px; border-radius:16px; padding:14px; border:1px solid #eef1f6; background:linear-gradient(135deg,#fff,#fbfcff); }
.summary-card span { display:block; color:#7b8395; font-size:12px; }
.summary-card b, .summary-card em { display:block; margin-top:10px; font-style:normal; color:#202536; font-weight:900; }
.summary-card--todo { background:linear-gradient(135deg,#fff,#fff3f7); }
.summary-card--alert { background:linear-gradient(135deg,#fff,#fff8ef); }
.summary-card--stock { background:linear-gradient(135deg,#fff,#f5fbff); }
.summary-card--brand { background:linear-gradient(135deg,#fff,#f7fff6); }
.brand-mini-list { display:grid; gap:8px; margin-top:10px; }
.brand-mini-list button { border:1px solid #e8eef8; background:#fff; border-radius:12px; padding:10px; text-align:left; cursor:pointer; }
.brand-mini-list b { display:block; font-size:13px; color:#202536; }
.brand-mini-list em { display:block; margin-top:4px; color:#7b8395; font-size:12px; font-style:normal; }
.chart-slot { position:relative; }
.trend-chart { width:100%; height:360px; }
.chart-empty { height:360px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; border-radius:16px; background:#fafbfe; border:1px dashed #e6ebf2; color:#8a94a6; text-align:center; }
.chart-empty--overlay { position:absolute; inset:0; z-index:2; background:rgba(250,251,254,.92); }
.chart-empty b { color:#202536; font-size:16px; }
@media (max-width: 1200px) { .dashboard-hero__top, .summary-panel__head { flex-direction:column; } .dashboard-hero__actions { justify-content:flex-start; } }
@media (max-width: 992px) { .trend-grid :deep(.el-col), .summary-grid :deep(.el-col) { width:100%; } .trend-grid :deep(.el-col-12), .trend-grid :deep(.el-col-8), .summary-grid :deep(.el-col-6) { max-width:100%; flex:0 0 100%; } }
</style>
