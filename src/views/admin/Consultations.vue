<template>
  <div class="admin-consultations-page">
    <el-card class="hero-card" shadow="never">
      <div class="hero-head">
        <div>
          <div class="hero-badge">CONSULTATION OPS</div>
          <h2 class="hero-title">咨询管理</h2>
          <p class="hero-desc">集中处理用户对商品的咨询，支持按用户、商品与状态筛选，并可直接查看会话内容、回复或关闭咨询。</p>
        </div>
        <div class="hero-actions">
          <el-button type="primary" plain @click="load">刷新列表</el-button>
        </div>
      </div>
      <el-row :gutter="12" class="hero-stats">
        <el-col :span="8" v-for="item in overviewCards" :key="item.key">
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
          <p>按用户 ID、商品 ID、状态与关键词查询咨询记录。</p>
        </div>
        <el-form :inline="true" :model="query" class="query-form" @submit.native.prevent="load">
          <el-form-item><el-input v-model="query.keyword" placeholder="搜索用户名 / 商品名 / 内容" clearable @keyup.enter.native="load" /></el-form-item>
          <el-form-item><el-input v-model.number="query.userId" type="number" placeholder="用户 ID" clearable /></el-form-item>
          <el-form-item><el-input v-model.number="query.productId" type="number" placeholder="商品 ID" clearable /></el-form-item>
          <el-form-item>
            <el-select v-model="query.status" clearable placeholder="状态" @change="load">
              <el-option label="待回复" :value="0" />
              <el-option label="已回复" :value="1" />
              <el-option label="已关闭" :value="2" />
              <el-option label="已解决" :value="3" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="load">查询</el-button>
            <el-button @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table :data="list" border stripe v-loading="loading" empty-text="暂无咨询记录">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="商品" min-width="220">
          <template slot-scope="scope">
            <div class="product-cell">
              <img :src="resolveAssetUrl(scope.row.productCoverUrl) || fallback" class="cover-thumb" />
              <div>
                <div class="product-name">{{ scope.row.productName || '未命名商品' }}</div>
                <div class="sub-text">商品 ID：{{ scope.row.productId }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="用户" width="140">
          <template slot-scope="scope">
            <div class="user-cell">
              <strong>{{ scope.row.username || '未知用户' }}</strong>
              <span>ID：{{ scope.row.userId }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="最新消息" min-width="260">
          <template slot-scope="scope">
            <div class="message-preview">
              <el-tag size="mini" :type="scope.row.lastSenderType === 'admin' ? 'success' : 'warning'" effect="dark">
                {{ scope.row.lastSenderType === 'admin' ? '商家' : '用户' }}
              </el-tag>
              <span>{{ scope.row.lastMessage || '暂无消息' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template slot-scope="scope">
            <el-tag :type="consultationTagType(scope.row.status)">{{ consultationStatusText(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="未读" width="110">
          <template slot-scope="scope">
            <div class="count-cell">
              <span>用户 {{ scope.row.unreadUserCount || 0 }}</span>
              <span>商家 {{ scope.row.unreadAdminCount || 0 }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="170">
          <template slot-scope="scope">{{ formatTime(scope.row.updatedAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template slot-scope="scope">
            <el-button size="mini" type="info" plain @click="openDetail(scope.row)">详情</el-button>
            <el-button size="mini" type="primary" @click="openReply(scope.row)">回复</el-button>
            <el-button size="mini" @click="markRead(scope.row)">已读</el-button>
            <el-button size="mini" type="danger" plain @click="closeItem(scope.row)">关闭</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination background layout="prev, pager, next, total" :total="total" :page-size="query.pageSize" :current-page.sync="query.pageNum" @current-change="load" />
      </div>
    </el-card>

    <el-dialog title="咨询详情" :visible.sync="detailVisible" width="960px" append-to-body>
      <div v-loading="detailLoading" class="detail-shell">
        <template v-if="detail">
          <div class="detail-top">
            <div>
              <div class="detail-title">{{ detail.product ? detail.product.name : '咨询详情' }}</div>
              <div class="detail-subtitle">用户：{{ detail.user ? detail.user.username : detail.userId }} · 会话 ID：{{ detail.consultationId }}</div>
            </div>
            <el-tag :type="consultationTagType(detail.status)">{{ consultationStatusText(detail.status) }}</el-tag>
          </div>

          <div class="detail-meta-grid">
            <div class="detail-meta-item"><span>商品 ID</span><strong>{{ detail.productId }}</strong></div>
            <div class="detail-meta-item"><span>用户 ID</span><strong>{{ detail.userId }}</strong></div>
            <div class="detail-meta-item"><span>商家 ID</span><strong>{{ detail.sellerId || '-' }}</strong></div>
            <div class="detail-meta-item"><span>未读</span><strong>用户 {{ detail.unreadUserCount || 0 }} / 商家 {{ detail.unreadAdminCount || 0 }}</strong></div>
          </div>

          <div class="message-list">
            <article v-for="item in detail.messages || []" :key="item.id" class="message-item" :class="item.senderType">
              <div class="message-bubble">
                <div class="message-meta">
                  <span>{{ item.senderType === 'admin' ? '商家' : '用户' }} · {{ formatTime(item.createdAt) }}</span>
                </div>
                <div class="message-content">{{ item.content }}</div>
              </div>
            </article>
          </div>
        </template>
      </div>
      <span slot="footer">
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="openReplyFromDetail">回复咨询</el-button>
      </span>
    </el-dialog>

    <el-dialog title="回复咨询" :visible.sync="replyVisible" width="560px" append-to-body>
      <div class="reply-shell">
        <div class="reply-tip">{{ replyTarget ? `正在回复咨询 #${replyTarget.id}` : '请输入回复内容' }}</div>
        <el-input v-model="replyContent" type="textarea" :rows="6" maxlength="500" show-word-limit placeholder="请输入回复内容" />
      </div>
      <span slot="footer">
        <el-button @click="replyVisible = false">取消</el-button>
        <el-button type="primary" :loading="replySubmitting" @click="submitReply">发送回复</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { api } from "../../api";
import { resolveAssetUrl } from "../../utils/asset";

export default {
  name: "AdminConsultations",
  data() {
    return {
      loading: false,
      detailLoading: false,
      replySubmitting: false,
      list: [],
      total: 0,
      detail: null,
      detailVisible: false,
      replyVisible: false,
      replyContent: "",
      replyTarget: null,
      query: {
        keyword: "",
        userId: undefined,
        productId: undefined,
        status: null,
        pageNum: 1,
        pageSize: 10
      },
      fallback: "https://dummyimage.com/120x120/f8eef2/9c96a5&text=Toy"
    };
  },
  computed: {
    overviewCards() {
      return [
        { key: "total", label: "总咨询数", value: this.total },
        { key: "pending", label: "待回复", value: this.list.filter(item => Number(item.status) === 0).length },
        { key: "closed", label: "已关闭", value: this.list.filter(item => Number(item.status) === 2).length }
      ];
    }
  },
  created() {
    this.load();
  },
  methods: {
    resolveAssetUrl,
    consultationStatusText(status) {
      return ({ 0: "待回复", 1: "已回复", 2: "已关闭", 3: "已解决" })[Number(status)] || "未知状态";
    },
    consultationTagType(status) {
      return ({ 0: "warning", 1: "success", 2: "info", 3: "success" })[Number(status)] || "info";
    },
    formatTime(value) {
      return value ? String(value).replace("T", " ").slice(0, 16) : "-";
    },
    resetQuery() {
      this.query = { keyword: "", userId: undefined, productId: undefined, status: null, pageNum: 1, pageSize: 10 };
      this.load();
    },
    async load() {
      this.loading = true;
      try {
        const res = await api.adminConsultationPage({ ...this.query });
        this.list = (res && res.records) || [];
        this.total = Number(res && res.total) || 0;
      } finally {
        this.loading = false;
      }
    },
    async openDetail(row) {
      this.detailLoading = true;
      try {
        this.detail = await api.adminConsultationDetail(row.id);
        this.detailVisible = true;
      } finally {
        this.detailLoading = false;
      }
    },
    openReply(row) {
      this.replyTarget = row;
      this.replyContent = "";
      this.replyVisible = true;
    },
    openReplyFromDetail() {
      if (!this.detail) return;
      this.replyTarget = { id: this.detail.consultationId };
      this.replyContent = "";
      this.replyVisible = true;
    },
    async submitReply() {
      if (!this.replyTarget) return;
      if (!String(this.replyContent || "").trim()) return this.$message.warning("请输入回复内容");
      this.replySubmitting = true;
      try {
        await api.adminReplyConsultation(this.replyTarget.id, { content: this.replyContent.trim() });
        this.$message.success("回复成功");
        this.replyVisible = false;
        this.replyTarget = null;
        await this.load();
        if (this.detailVisible && this.detail) {
          this.detail = await api.adminConsultationDetail(this.detail.consultationId);
        }
      } finally {
        this.replySubmitting = false;
      }
    },
    async markRead(row) {
      await api.adminMarkConsultationRead(row.id);
      this.$message.success("已标记已读");
      await this.load();
    },
    async closeItem(row) {
      await this.$confirm(`确认关闭咨询 #${row.id} 吗？`, "关闭咨询", { type: "warning" });
      await api.adminCloseConsultation(row.id);
      this.$message.success("已关闭咨询");
      await this.load();
      if (this.detail && Number(this.detail.consultationId) === Number(row.id)) {
        this.detail = await api.adminConsultationDetail(row.id);
      }
    }
  }
};
</script>

<style scoped>
.admin-consultations-page { display:grid; gap:22px; }
.hero-card,.panel-card { border:none; border-radius:28px; box-shadow:var(--mall-shadow); overflow:hidden; }
.hero-head,.panel-toolbar { display:flex; align-items:flex-start; justify-content:space-between; gap:18px; }
.hero-badge { display:inline-flex; padding:8px 14px; border-radius:999px; background:#fff2f6; color:#ff5f92; font-size:11px; font-weight:800; letter-spacing:1.2px; }
.hero-title { margin:14px 0 0; color:#202536; font-size:30px; font-weight:900; }
.hero-desc { margin:10px 0 0; color:#6d7687; line-height:1.8; }
.hero-stats { margin-top:18px; }
.mini-stat { padding:18px 20px; border-radius:20px; background:linear-gradient(135deg,#fff8f3 0%,#fffcfe 56%,#f3fbff 100%); box-shadow:inset 0 0 0 1px #f0ebef; }
.mini-stat span { color:#8a94a6; font-size:13px; }
.mini-stat strong { display:block; margin-top:8px; color:#252a3d; font-size:28px; font-weight:900; }
.panel-card { padding:24px; }
.panel-title-block h3 { margin:0; color:#252a3d; font-size:20px; font-weight:900; }
.panel-title-block p { margin:8px 0 0; color:#8a94a6; font-size:13px; }
.query-form { display:flex; flex-wrap:wrap; justify-content:flex-end; gap:10px; }
.product-cell { display:flex; align-items:center; gap:12px; }
.cover-thumb { width:48px; height:48px; border-radius:12px; object-fit:cover; background:#fff; }
.product-name,.user-cell strong { color:#252a3d; font-weight:900; }
.sub-text,.user-cell span,.count-cell { color:#8a94a6; font-size:12px; }
.message-preview { display:flex; gap:10px; align-items:flex-start; color:#4b5568; line-height:1.6; }
.count-cell { display:grid; gap:4px; }
.pagination-wrap { display:flex; justify-content:flex-end; margin-top:18px; }
.detail-shell,.reply-shell { display:grid; gap:16px; }
.detail-top { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }
.detail-title { color:#252a3d; font-size:18px; font-weight:900; }
.detail-subtitle { margin-top:6px; color:#8a94a6; font-size:12px; }
.detail-meta-grid { display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:12px; }
.detail-meta-item { padding:14px 16px; border-radius:18px; background:#fff8fb; box-shadow:inset 0 0 0 1px #f2e8ee; }
.detail-meta-item span { display:block; color:#8a94a6; font-size:12px; }
.detail-meta-item strong { display:block; margin-top:8px; color:#252a3d; font-size:14px; font-weight:900; }
.message-list { display:grid; gap:12px; max-height:480px; overflow:auto; padding-right:4px; }
.message-item { display:flex; }
.message-item.user { justify-content:flex-start; }
.message-item.admin { justify-content:flex-end; }
.message-bubble { max-width:76%; padding:12px 14px; border-radius:16px; background:#fff; box-shadow:inset 0 0 0 1px #f0ebef; }
.message-item.admin .message-bubble { background:linear-gradient(135deg,#fff1f5 0%,#ffffff 100%); }
.message-meta { color:#8a94a6; font-size:11px; }
.message-content { margin-top:6px; color:#252a3d; font-size:13px; line-height:1.8; white-space:pre-wrap; }
.reply-tip { color:#8a94a6; font-size:13px; }
@media (max-width:1100px) { .detail-meta-grid { grid-template-columns:repeat(2, minmax(0, 1fr)); } }
@media (max-width:760px) { .hero-head,.panel-toolbar,.detail-top { display:grid; } .detail-meta-grid { grid-template-columns:1fr; } .message-bubble { max-width:100%; } }
</style>
