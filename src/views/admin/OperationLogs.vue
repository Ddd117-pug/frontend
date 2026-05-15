<template>
  <div class="admin-logs-page">
    <div class="card toolbar-card">
      <div class="toolbar-head">
        <div>
          <h3 class="page-title" style="margin:0 0 8px;">操作日志</h3>
          <div class="toolbar-subtitle">记录管理员对商品、品牌、订单、用户、评价等模块的关键操作，便于审计与追踪。</div>
        </div>
        <div class="toolbar-actions">
          <el-button plain :disabled="!filteredLogs.length" @click="exportCsv">导出</el-button>
          <el-button type="primary" :loading="loading" @click="load">刷新</el-button>
        </div>
      </div>

      <div class="stats-row">
        <div class="stat-card"><span>日志总数</span><strong>{{ filteredLogs.length }}</strong></div>
        <div class="stat-card"><span>今日操作</span><strong>{{ todayCount }}</strong></div>
        <div class="stat-card"><span>管理员数</span><strong>{{ operatorCount }}</strong></div>
        <div class="stat-card"><span>高风险操作</span><strong>{{ riskyCount }}</strong></div>
      </div>

      <el-form :inline="true" :model="query" class="query-form">
        <el-form-item><el-input v-model="query.keyword" clearable placeholder="搜索模块 / 操作 / 内容 / 操作人" /></el-form-item>
        <el-form-item>
          <el-select v-model="query.module" clearable placeholder="模块">
            <el-option v-for="item in moduleOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="query.level" clearable placeholder="级别">
            <el-option label="普通" value="info" />
            <el-option label="警告" value="warning" />
            <el-option label="危险" value="danger" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-date-picker v-model="query.dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="yyyy-MM-dd" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="load">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="card">
      <el-table ref="tableRef" :data="pagedLogs" border stripe>
        <el-table-column prop="time" label="时间" width="170" />
        <el-table-column prop="operator" label="操作人" width="120" />
        <el-table-column label="模块" width="120">
          <template slot-scope="s"><el-tag effect="plain">{{ moduleText(s.row.module) }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template slot-scope="s"><el-tag :type="levelType(s.row.level)" effect="dark">{{ actionText(s.row.action) }}</el-tag></template>
        </el-table-column>
        <el-table-column label="内容" min-width="280">
          <template slot-scope="s">
            <div class="content-cell">
              <span class="content-main">{{ s.row.content }}</span>
              <el-tag v-if="s.row.risky" size="mini" type="danger" effect="plain">高风险</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="target" label="目标对象" min-width="170" />
        <el-table-column label="结果" width="100">
          <template slot-scope="s"><el-tag :type="s.row.success ? 'success' : 'danger'" effect="plain">{{ s.row.success ? '成功' : '失败' }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template slot-scope="s">
            <el-button size="mini" plain @click="openDetail(s.row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrap">
        <el-pagination background layout="total, prev, pager, next, jumper" :total="filteredLogs.length" :page-size="pageSize" :current-page.sync="currentPage" />
      </div>
    </div>

    <el-drawer title="日志详情" :visible.sync="detailVisible" size="520px">
      <div v-if="detailLog" class="detail-panel">
        <div class="detail-card"><span>时间</span><b>{{ detailLog.time }}</b></div>
        <div class="detail-card"><span>操作人</span><b>{{ detailLog.operator }}</b></div>
        <div class="detail-card"><span>模块</span><b>{{ moduleText(detailLog.module) }}</b></div>
        <div class="detail-card"><span>操作</span><b>{{ actionText(detailLog.action) }}</b></div>
        <div class="detail-card"><span>目标对象</span><b>{{ detailLog.target || '-' }}</b></div>
        <div class="detail-card"><span>结果</span><b>{{ detailLog.success ? '成功' : '失败' }}</b></div>
        <div class="detail-card detail-card--full"><span>内容</span><b>{{ detailLog.content }}</b></div>
        <div class="detail-card detail-card--full"><span>附加信息</span><b>{{ detailLog.meta || '-' }}</b></div>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import { api } from "../../api";

const moduleMap = { dashboard: "数据看板", product: "商品", brand: "品牌", order: "订单", user: "用户", review: "评价", afterSale: "售后", system: "系统" };
const actionMap = { create: "新增", update: "修改", delete: "删除", status: "状态变更", audit: "审核", export: "导出", login: "登录", other: "其他" };

export default {
  name: "AdminOperationLogs",
  data() {
    return {
      loading: false,
      query: { keyword: "", module: "", level: "", dateRange: [] },
      logs: [],
      currentPage: 1,
      pageSize: 12,
      detailVisible: false,
      detailLog: null,
      moduleOptions: Object.entries(moduleMap).map(([value, label]) => ({ value, label }))
    };
  },
  computed: {
    filteredLogs() {
      const kw = String(this.query.keyword || "").trim().toLowerCase();
      return this.logs.filter(item => {
        if (this.query.module && item.module !== this.query.module) return false;
        if (this.query.level && item.level !== this.query.level) return false;
        if (Array.isArray(this.query.dateRange) && this.query.dateRange.length === 2) {
          const date = String(item.time || "").slice(0, 10);
          if (date && (date < this.query.dateRange[0] || date > this.query.dateRange[1])) return false;
        }
        if (!kw) return true;
        return [item.operator, item.content, item.target, item.module, item.action, item.meta].join(" ").toLowerCase().includes(kw);
      });
    },
    pagedLogs() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.filteredLogs.slice(start, start + this.pageSize);
    },
    todayCount() {
      const today = new Date().toISOString().slice(0, 10);
      return this.logs.filter(item => String(item.time || "").slice(0, 10) === today).length;
    },
    operatorCount() {
      return new Set(this.logs.map(item => item.operator).filter(Boolean)).size;
    },
    riskyCount() {
      return this.logs.filter(item => item.risky || item.level === "danger").length;
    }
  },
  async created() {
    await this.load();
  },
  methods: {
    async load() {
      this.loading = true;
      try {
        const res = await api.adminOperationLogs({ pageNum: 1, pageSize: 200 });
        this.logs = this.normalizeLogs(res);
        if (!this.logs.length) this.logs = this.mockLogs();
      } catch (e) {
        this.logs = this.mockLogs();
      } finally {
        this.loading = false;
      }
    },
    normalizeLogs(res) {
      const list = Array.isArray(res) ? res : res?.records || res?.list || res?.data || [];
      return list.map(item => ({
        time: item.time || item.createdAt || item.operateTime || item.logTime || "-",
        operator: item.operator || item.username || item.adminName || "系统",
        module: item.module || "system",
        action: item.action || item.type || "other",
        content: item.content || item.detail || item.message || "",
        target: item.target || item.targetName || item.objectName || "-",
        success: item.success === undefined ? true : Boolean(item.success),
        level: item.level || (item.success === false ? "danger" : item.risky ? "warning" : "info"),
        risky: Boolean(item.risky),
        meta: item.meta || item.extra || ""
      }));
    },
    mockLogs() {
      const base = new Date();
      const d = offset => new Date(base.getTime() - offset * 3600 * 1000).toISOString().slice(0, 19).replace("T", " ");
      return [
        { time: d(1), operator: "admin", module: "product", action: "update", content: "修改商品【潮玩手办盲盒】价格与库存", target: "商品 #1024", success: true, level: "info", risky: false, meta: "价格 89.00 -> 79.00" },
        { time: d(3), operator: "admin", module: "review", action: "audit", content: "审核评价通过，隐藏敏感词命中内容", target: "评价 #883", success: true, level: "warning", risky: true, meta: "命中关键词：退款 / 投诉" },
        { time: d(5), operator: "admin", module: "order", action: "status", content: "批量取消待付款订单", target: "订单批量操作", success: true, level: "warning", risky: true, meta: "共 5 条" },
        { time: d(7), operator: "admin", module: "brand", action: "create", content: "新增品牌【52TOYS】并设置为推荐", target: "品牌 #17", success: true, level: "info", risky: false, meta: "推荐位：是" },
        { time: d(9), operator: "admin", module: "user", action: "status", content: "禁用异常用户账号", target: "用户 #56", success: true, level: "danger", risky: true, meta: "原因：频繁退款" }
      ];
    },
    resetQuery() {
      this.query = { keyword: "", module: "", level: "", dateRange: [] };
      this.currentPage = 1;
    },
    openDetail(row) {
      this.detailLog = row;
      this.detailVisible = true;
    },
    moduleText(value) { return moduleMap[value] || value || "系统"; },
    actionText(value) { return actionMap[value] || value || "其他"; },
    levelType(value) { return ({ info: "primary", warning: "warning", danger: "danger" })[value] || "info"; },
    exportCsv() {
      const csv = [["时间", "操作人", "模块", "操作", "内容", "目标对象", "结果", "级别", "附加信息"], ...this.filteredLogs.map(item => [item.time, item.operator, this.moduleText(item.module), this.actionText(item.action), item.content, item.target, item.success ? "成功" : "失败", item.level, item.meta || ""])]
        .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "operation-logs.csv";
      a.click();
      URL.revokeObjectURL(url);
    }
  }
};
</script>

<style scoped>
.admin-logs-page{display:grid;gap:18px}.toolbar-card{border-radius:16px;background:linear-gradient(180deg,#fcfdff 0%,#f7f9fc 100%)}.toolbar-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:18px}.toolbar-subtitle{color:#8a94a6;font-size:13px;line-height:1.7}.toolbar-actions{display:flex;gap:10px;flex-wrap:wrap}.stats-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:16px}.stat-card{padding:14px 16px;border-radius:16px;background:linear-gradient(135deg,#fff,#fff7f2);border:1px solid #f0e3dc}.stat-card span{display:block;color:#8a94a6;font-size:12px}.stat-card strong{display:block;margin-top:8px;font-size:22px;color:#1c2434}.query-form{margin-bottom:-18px}.content-cell{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.content-main{color:#1c2434;line-height:1.7}.pagination-wrap{margin-top:18px;display:flex;justify-content:flex-end}.detail-panel{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:4px}.detail-card{padding:14px 16px;border-radius:16px;border:1px solid #eef2f6;background:#fff}.detail-card span{display:block;color:#8a94a6;font-size:12px}.detail-card b{display:block;margin-top:8px;color:#1c2434;line-height:1.7;word-break:break-word}.detail-card--full{grid-column:1 / -1}@media (max-width:1100px){.stats-row,.detail-panel{grid-template-columns:1fr 1fr}}@media (max-width:760px){.toolbar-head{flex-direction:column;align-items:flex-start}.stats-row,.detail-panel{grid-template-columns:1fr}.toolbar-actions{width:100%}}
</style>
