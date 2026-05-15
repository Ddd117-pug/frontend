<template>
  <div class="admin-reviews-page">
    <el-card class="hero-card" shadow="never">
      <div class="hero-head">
        <div>
          <div class="hero-badge">REVIEW OPS</div>
          <h2 class="hero-title">评价管理</h2>
          <p class="hero-desc">支持按商品、状态、评分区间和关键词筛选评价，并可对评论进行批量或单条屏蔽/恢复，帮助管理员维护前台内容质量与平台信誉。</p>
        </div>
        <div class="hero-actions">
          <el-button :disabled="!selectedIds.length" @click="openBatchDialog('export')">导出已选</el-button>
          <el-button :disabled="!selectedIds.length" @click="openBatchDialog('status')">批量屏蔽 / 恢复</el-button>
          <el-button plain :disabled="!filteredList.length" @click="exportCsv">导出当前结果</el-button>
          <el-button type="primary" :loading="loading" @click="load">刷新数据</el-button>
        </div>
      </div>
      <el-row :gutter="12" class="hero-stats">
        <el-col :span="6" v-for="item in overviewCards" :key="item.key">
          <div class="mini-stat">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="panel-card" shadow="never">
      <div class="panel-toolbar">
        <div class="panel-title-block">
          <h3>筛选与检索</h3>
          <p>支持关键词模糊搜索、商品定位、状态筛选和评分区间筛选。</p>
        </div>
        <el-form :inline="true" :model="query" class="filter-form" @submit.native.prevent="load">
          <el-form-item><el-input v-model="query.keyword" placeholder="搜索评价内容 / 用户 / 订单" clearable @keyup.enter.native="load" /></el-form-item>
          <el-form-item><el-input v-model="query.productId" placeholder="商品ID" clearable @keyup.enter.native="load" /></el-form-item>
          <el-form-item>
            <el-select v-model="query.status" clearable placeholder="状态">
              <el-option label="正常" :value="1" />
              <el-option label="已屏蔽" :value="0" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="query.score" clearable placeholder="评分">
              <el-option v-for="item in scoreOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="load">查询</el-button>
            <el-button @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <el-card class="panel-card" shadow="never">
      <div class="table-headbar">
        <div class="table-headbar__hint">已选中 <b>{{ selectedIds.length }}</b> 条评价</div>
        <el-button size="mini" plain :disabled="!selectedIds.length" @click="clearSelection">清空选择</el-button>
      </div>
      <el-table ref="tableRef" :data="pagedList" border stripe v-loading="loading" empty-text="暂无评价数据" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="id" label="评价ID" width="90" />
        <el-table-column prop="productId" label="商品ID" width="90" />
        <el-table-column prop="userId" label="用户ID" width="90" />
        <el-table-column prop="orderId" label="订单ID" width="90" />
        <el-table-column label="评分" width="150">
          <template slot-scope="s">
            <el-rate :value="Number(s.row.score || 0)" disabled text-color="#ff8f1f" />
          </template>
        </el-table-column>
        <el-table-column label="评价内容" min-width="320">
          <template slot-scope="s">
            <div class="review-content">{{ s.row.content || '未填写评价内容' }}</div>
            <div v-if="reviewImages(s.row).length" class="image-list">
              <img v-for="(img, idx) in reviewImages(s.row)" :key="idx" :src="img" class="review-image" />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="匿名" width="90">
          <template slot-scope="s"><el-tag effect="plain" size="mini">{{ s.row.isAnonymous === 1 ? '是' : '否' }}</el-tag></template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template slot-scope="s"><el-tag :type="Number(s.row.status) === 1 ? 'success' : 'info'">{{ Number(s.row.status) === 1 ? '正常' : '已屏蔽' }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template slot-scope="s">
            <el-button size="mini" type="info" plain @click="openDetail(s.row)">详情</el-button>
            <el-button v-if="Number(s.row.status) === 1" size="mini" type="danger" plain @click="confirmSetStatus(s.row, 0)">屏蔽</el-button>
            <el-button v-else size="mini" type="success" @click="confirmSetStatus(s.row, 1)">恢复</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrap">
        <el-pagination background layout="total, prev, pager, next, jumper" :total="filteredList.length" :page-size="query.pageSize" :current-page.sync="query.pageNum" @current-change="handlePageChange" />
      </div>
    </el-card>

    <el-drawer title="评价详情" :visible.sync="detailVisible" size="520px" destroy-on-close>
      <div v-if="detailRow" class="detail-panel">
        <div class="detail-card"><span>评价ID</span><b>{{ detailRow.id }}</b></div>
        <div class="detail-card"><span>商品ID</span><b>{{ detailRow.productId }}</b></div>
        <div class="detail-card"><span>用户ID</span><b>{{ detailRow.userId }}</b></div>
        <div class="detail-card"><span>订单ID</span><b>{{ detailRow.orderId }}</b></div>
        <div class="detail-card"><span>评分</span><b>{{ Number(detailRow.score || 0) }} 分</b></div>
        <div class="detail-card"><span>状态</span><b>{{ Number(detailRow.status) === 1 ? '正常' : '已屏蔽' }}</b></div>
        <div class="detail-card detail-card--full"><span>评价内容</span><b>{{ detailRow.content || '未填写评价内容' }}</b></div>
        <div class="detail-card detail-card--full" v-if="reviewImages(detailRow).length">
          <span>评价图片</span>
          <div class="image-list image-list--detail">
            <img v-for="(img, idx) in reviewImages(detailRow)" :key="idx" :src="img" class="review-image review-image--large" />
          </div>
        </div>
        <div class="detail-card"><span>匿名</span><b>{{ detailRow.isAnonymous === 1 ? '是' : '否' }}</b></div>
        <div class="detail-card"><span>创建时间</span><b>{{ detailRow.createdAt || '-' }}</b></div>
      </div>
    </el-drawer>

    <el-dialog title="批量评价操作" :visible.sync="batchDialogVisible" width="460px">
      <div class="dialog-tip">已选中 {{ selectedIds.length }} 条评价。</div>
      <div v-if="batchAction === 'status'" class="dialog-form">
        <el-radio-group v-model="batchStatusValue">
          <el-radio :label="0">批量屏蔽</el-radio>
          <el-radio :label="1">批量恢复</el-radio>
        </el-radio-group>
      </div>
      <span slot="footer">
        <el-button @click="batchDialogVisible = false">取消</el-button>
        <el-button v-if="batchAction === 'status'" type="primary" :loading="batchLoading" @click="confirmBatchStatus">确认</el-button>
        <el-button v-else type="primary" @click="confirmBatchExport">导出</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { api } from "../../api";
import { pushAdminLog } from "../../utils/adminLog";

export default {
  data() {
    return {
      loading: false,
      batchLoading: false,
      query: { pageNum: 1, pageSize: 10, productId: "", status: null, keyword: "", score: null },
      list: [],
      total: 0,
      detailVisible: false,
      detailRow: null,
      selectedIds: [],
      batchDialogVisible: false,
      batchAction: "",
      batchStatusValue: 0,
      scoreOptions: [
        { label: "1 星", value: 1 },
        { label: "2 星", value: 2 },
        { label: "3 星", value: 3 },
        { label: "4 星", value: 4 },
        { label: "5 星", value: 5 }
      ]
    };
  },
  computed: {
    filteredList() {
      const kw = String(this.query.keyword || "").trim().toLowerCase();
      return this.list.filter(item => {
        if (this.query.productId && Number(item.productId) !== Number(this.query.productId)) return false;
        if (this.query.status !== null && this.query.status !== undefined && Number(item.status) !== Number(this.query.status)) return false;
        if (this.query.score && Number(item.score) !== Number(this.query.score)) return false;
        if (!kw) return true;
        return [item.content, item.userId, item.orderId, item.productId, item.id].join(" ").toLowerCase().includes(kw);
      });
    },
    pagedList() {
      const start = (this.query.pageNum - 1) * this.query.pageSize;
      return this.filteredList.slice(start, start + this.query.pageSize);
    },
    overviewCards() {
      const total = this.list.length;
      const blocked = this.list.filter(item => Number(item.status) === 0).length;
      const anonymous = this.list.filter(item => Number(item.isAnonymous) === 1).length;
      const avgScore = total ? (this.list.reduce((sum, item) => sum + Number(item.score || 0), 0) / total).toFixed(1) : '0.0';
      return [
        { key: 'total', label: '评价总数', value: total },
        { key: 'blocked', label: '已屏蔽', value: blocked },
        { key: 'anonymous', label: '匿名评价', value: anonymous },
        { key: 'avg', label: '平均评分', value: avgScore }
      ];
    }
  },
  async created() {
    await this.load();
  },
  methods: {
    async load() {
      this.loading = true;
      try {
        const params = { ...this.query, productId: this.query.productId ? Number(this.query.productId) : null };
        const res = await api.adminReviews(params);
        this.list = Array.isArray(res) ? res : res?.records || [];
        this.total = Number(res?.total || this.list.length || 0);
        if (this.query.pageNum > Math.max(Math.ceil(this.filteredList.length / this.query.pageSize), 1)) {
          this.query.pageNum = 1;
        }
      } finally {
        this.loading = false;
      }
    },
    handlePageChange(page) {
      this.query.pageNum = page;
    },
    resetQuery() {
      this.query = { pageNum: 1, pageSize: 10, productId: "", status: null, keyword: "", score: null };
      this.load();
    },
    reviewImages(row) {
      return String(row?.pictures || "")
        .split(",")
        .map(v => v.trim())
        .filter(Boolean);
    },
    openDetail(row) {
      this.detailRow = row;
      this.detailVisible = true;
    },
    handleSelectionChange(rows) {
      const visibleIds = this.pagedList.map(item => Number(item.id));
      const selectedVisible = rows.map(item => Number(item.id)).filter(id => visibleIds.includes(id));
      const retained = this.selectedIds.filter(id => !visibleIds.includes(id));
      this.selectedIds = Array.from(new Set([...retained, ...selectedVisible]));
    },
    clearSelection() {
      this.selectedIds = [];
      if (this.$refs.tableRef) this.$refs.tableRef.clearSelection();
    },
    openBatchDialog(action) {
      this.batchAction = action;
      this.batchDialogVisible = true;
    },
    async confirmBatchStatus() {
      if (!this.selectedIds.length) return;
      this.batchLoading = true;
      try {
        const ids = this.selectedIds.slice();
        for (const id of ids) {
          await api.adminReviewStatus(id, this.batchStatusValue);
        }
        pushAdminLog({
          module: "review",
          action: this.batchStatusValue === 0 ? "batch_block" : "batch_restore",
          content: `${this.batchStatusValue === 0 ? "批量屏蔽" : "批量恢复"}评价`,
          target: ids.map(id => `#${id}`).join("、"),
          risky: this.batchStatusValue === 0,
          meta: { reviewIds: ids, nextStatus: this.batchStatusValue }
        });
        this.$message.success(this.batchStatusValue === 0 ? "已批量屏蔽" : "已批量恢复");
        this.batchDialogVisible = false;
        this.clearSelection();
        await this.load();
      } finally {
        this.batchLoading = false;
      }
    },
    confirmBatchExport() {
      const rows = this.filteredList.filter(item => this.selectedIds.includes(Number(item.id)));
      const exportRows = rows.length ? rows : this.filteredList;
      const csv = [["评价ID", "商品ID", "用户ID", "订单ID", "评分", "内容", "匿名", "状态", "创建时间"], ...exportRows.map(item => [item.id, item.productId, item.userId, item.orderId, item.score, item.content, item.isAnonymous === 1 ? "是" : "否", Number(item.status) === 1 ? "正常" : "已屏蔽", item.createdAt || ""])]
        .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
        .join("\n");
      const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "reviews-export-selected.csv";
      a.click();
      URL.revokeObjectURL(url);
      this.batchDialogVisible = false;
    },
    async confirmSetStatus(row, status) {
      try {
        await this.$confirm(status === 0 ? "确认屏蔽这条评价吗？" : "确认恢复这条评价吗？", "提示", { type: "warning" });
      } catch (e) {
        if (e === "cancel" || e === "close") return;
      }
      await api.adminReviewStatus(row.id, status);
      pushAdminLog({
        module: "review",
        action: status === 0 ? "block" : "restore",
        content: `${status === 0 ? "屏蔽" : "恢复"}评价【${row.id}】`,
        target: `评价 #${row.id}`,
        risky: status === 0,
        meta: { reviewId: row.id, nextStatus: status }
      });
      this.$message.success(status === 1 ? "评价已恢复" : "评价已屏蔽");
      await this.load();
    },
    exportCsv() {
      const rows = this.filteredList.map(item => [item.id, item.productId, item.userId, item.orderId, item.score, item.content, item.isAnonymous === 1 ? "是" : "否", Number(item.status) === 1 ? "正常" : "已屏蔽", item.createdAt || ""]);
      const csv = [["评价ID", "商品ID", "用户ID", "订单ID", "评分", "内容", "匿名", "状态", "创建时间"], ...rows]
        .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
        .join("\n");
      const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "reviews-export.csv";
      a.click();
      URL.revokeObjectURL(url);
    }
  }
};
</script>

<style scoped>
.admin-reviews-page { display:grid; gap:18px; }
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
.mini-stat strong { display:block; margin-top:8px; color:#202536; font-size:24px; font-weight:900; }
.panel-toolbar { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; flex-wrap:wrap; }
.panel-title-block h3 { margin:0; color:#202536; font-size:18px; font-weight:900; }
.panel-title-block p { margin:6px 0 0; color:#7b8395; font-size:13px; }
.filter-form { display:flex; flex-wrap:wrap; gap:0 10px; margin-bottom:-18px; }
.table-headbar { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
.table-headbar__hint { color:#7b8395; font-size:13px; }
.table-headbar__hint b { color:#202536; }
.review-content { line-height:1.7; color:#344054; }
.image-list { margin-top:10px; display:flex; flex-wrap:wrap; gap:8px; }
.image-list--detail { margin-top:12px; }
.review-image { width:56px; height:56px; object-fit:cover; border-radius:8px; border:1px solid #dbe4f0; }
.review-image--large { width:84px; height:84px; }
.pagination-wrap { margin-top:18px; display:flex; justify-content:flex-end; }
.detail-panel { display:grid; grid-template-columns:1fr 1fr; gap:12px; padding:4px; }
.detail-card { padding:14px 16px; border-radius:16px; border:1px solid #eef2f6; background:#fff; }
.detail-card span { display:block; color:#8a94a6; font-size:12px; }
.detail-card b { display:block; margin-top:8px; color:#1c2434; line-height:1.7; word-break:break-word; }
.detail-card--full { grid-column:1 / -1; }
.dialog-tip { color:#5f6677; line-height:1.7; margin-bottom:14px; }
.dialog-form { padding:4px 0 2px; }
@media (max-width:1100px) { .hero-head, .panel-toolbar { flex-direction:column; } .hero-actions { justify-content:flex-start; } .detail-panel { grid-template-columns:1fr 1fr; } }
@media (max-width:760px) { .detail-panel { grid-template-columns:1fr; } .hero-actions { width:100%; } }
</style>