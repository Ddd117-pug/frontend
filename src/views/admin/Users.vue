<template>
  <div class="card admin-users-page">
    <div class="page-head">
      <div>
        <h3 class="page-title">用户管理中心</h3>
        <p class="page-subtitle">支持搜索、筛选、批量操作、详情查看与内部备注，方便运营与风控处理。</p>
      </div>
      <div class="page-head__stats">
        <div class="stat-card">
          <span>用户总数</span>
          <strong>{{ filteredList.length }}</strong>
        </div>
        <div class="stat-card">
          <span>管理员</span>
          <strong>{{ adminCount }}</strong>
        </div>
        <div class="stat-card">
          <span>禁用中</span>
          <strong>{{ disabledCount }}</strong>
        </div>
      </div>
    </div>

    <section class="filter-panel mall-hover-lift">
      <div class="filter-grid">
        <div class="filter-item filter-item--wide">
          <label>搜索</label>
          <el-input v-model="filters.keyword" clearable prefix-icon="el-icon-search" placeholder="用户名 / 手机号 / 邮箱 / 备注" />
        </div>
        <div class="filter-item">
          <label>角色</label>
          <el-select v-model="filters.role" clearable placeholder="全部角色">
            <el-option v-for="item in roleOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>
        <div class="filter-item">
          <label>状态</label>
          <el-select v-model="filters.status" clearable placeholder="全部状态">
            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>
        <div class="filter-item">
          <label>注册时间</label>
          <el-date-picker v-model="filters.dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="yyyy-MM-dd" />
        </div>
      </div>

      <div class="filter-actions">
        <el-button size="small" plain @click="resetFilters">重置筛选</el-button>
        <el-button size="small" type="primary" plain :disabled="!selectedIds.length" @click="openBatchAction('status')">批量切换状态</el-button>
        <el-button size="small" type="warning" plain :disabled="!selectedIds.length" @click="openBatchAction('role')">批量设置角色</el-button>
        <el-button size="small" plain :disabled="!selectedIds.length" @click="openBatchAction('note')">批量备注</el-button>
        <el-button size="small" plain :disabled="!selectedIds.length" @click="openBatchAction('export')">导出可见用户</el-button>
        <el-button size="small" @click="load">刷新</el-button>
      </div>
    </section>

    <div class="table-toolbar">
      <el-checkbox :value="isAllSelected" :indeterminate="isIndeterminate" @change="toggleSelectAll">全选当前页</el-checkbox>
      <div class="toolbar-right">
        <span>已选中 {{ selectedIds.length }} 项</span>
        <el-tag type="info" effect="plain">当前页 {{ pagedList.length }} 人</el-tag>
      </div>
    </div>

    <el-table ref="tableRef" :data="pagedList" border row-key="id" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="50" />
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="username" label="用户名" min-width="140" />
      <el-table-column prop="phone" label="手机号" min-width="130" />
      <el-table-column prop="email" label="邮箱" min-width="180" />
      <el-table-column label="角色" width="110">
        <template slot-scope="s">
          <el-tag :type="roleTagType(s.row.role)" effect="plain">{{ roleText(s.row.role) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="110">
        <template slot-scope="s">
          <el-tag :type="statusTagType(s.row.status)" effect="plain">{{ statusText(s.row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="注册时间" min-width="170">
        <template slot-scope="s">{{ formatTime(s.row.createdAt || s.row.createTime || s.row.registeredAt) }}</template>
      </el-table-column>
      <el-table-column label="最后登录" min-width="170">
        <template slot-scope="s">{{ formatTime(s.row.lastLoginAt || s.row.loginTime) }}</template>
      </el-table-column>
      <el-table-column label="余额 / 积分" min-width="130">
        <template slot-scope="s">¥{{ money(s.row.balance) }} / {{ numberValue(s.row.points) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="320" fixed="right">
        <template slot-scope="s">
          <el-button size="mini" plain @click="openDetail(s.row)">详情</el-button>
          <el-button size="mini" @click="toggleStatus(s.row)">{{ isDisabled(s.row.status) ? '启用' : '禁用' }}</el-button>
          <el-button size="mini" type="primary" plain @click="toggleRole(s.row)">{{ isAdmin(s.row.role) ? '设为普通' : '设为管理员' }}</el-button>
          <el-button size="mini" plain @click="openNoteDialog(s.row)">备注</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination background layout="total, prev, pager, next, jumper" :total="filteredList.length" :page-size="pageSize" :current-page.sync="currentPage" @current-change="syncSelection" />
    </div>

    <el-drawer title="用户详情" :visible.sync="detailVisible" size="720px" destroy-on-close>
      <div v-if="detailUser" class="detail-drawer">
        <div class="detail-hero">
          <div class="avatar-circle">{{ avatarText(detailUser.username) }}</div>
          <div>
            <h3>{{ detailUser.username }}</h3>
            <p>{{ detailUser.email || '未填写邮箱' }}</p>
            <div class="detail-tags">
              <el-tag :type="roleTagType(detailUser.role)" effect="dark">{{ roleText(detailUser.role) }}</el-tag>
              <el-tag :type="statusTagType(detailUser.status)" effect="plain">{{ statusText(detailUser.status) }}</el-tag>
            </div>
          </div>
        </div>

        <div class="detail-grid">
          <div class="detail-card"><span>手机号</span><b>{{ detailUser.phone || '-' }}</b></div>
          <div class="detail-card"><span>余额</span><b>¥{{ money(detailUser.balance) }}</b></div>
          <div class="detail-card"><span>积分</span><b>{{ numberValue(detailUser.points) }}</b></div>
          <div class="detail-card"><span>注册时间</span><b>{{ formatTime(detailUser.createdAt || detailUser.createTime) }}</b></div>
          <div class="detail-card"><span>最后登录</span><b>{{ formatTime(detailUser.lastLoginAt || detailUser.loginTime) }}</b></div>
          <div class="detail-card"><span>备注</span><b>{{ detailUser.note || '暂无备注' }}</b></div>
        </div>

        <div class="detail-tabs">
          <section class="detail-section">
            <div class="section-head">
              <div class="section-title">登录记录</div>
              <el-tag effect="plain">{{ detailMeta.loginRecords.length }}</el-tag>
            </div>
            <el-empty v-if="!detailMeta.loginRecords.length" description="暂无登录记录" />
            <div v-else class="mini-list">
              <article v-for="item in detailMeta.loginRecords" :key="item.id || `${item.loginAt}-${item.ip || ''}`" class="mini-item">
                <div class="mini-item__main">
                  <strong>{{ formatTime(item.loginAt || item.createdAt || item.time) }}</strong>
                  <p>{{ item.ip || 'IP 未返回' }} · {{ item.device || item.platform || item.ua || '设备信息未返回' }}</p>
                </div>
                <el-tag :type="item.success === false ? 'danger' : 'success'" effect="plain">{{ item.success === false ? '失败' : '成功' }}</el-tag>
              </article>
            </div>
          </section>

          <section class="detail-section">
            <div class="section-head">
              <div class="section-title">最近订单</div>
              <el-tag effect="plain">{{ detailMeta.recentOrders.length }}</el-tag>
            </div>
            <el-empty v-if="!detailMeta.recentOrders.length" description="暂无最近订单" />
            <div v-else class="mini-list">
              <article v-for="item in detailMeta.recentOrders" :key="item.id" class="mini-item">
                <div class="mini-item__main">
                  <strong>{{ item.orderNo || `订单 #${item.id}` }}</strong>
                  <p>{{ statusText(item.status) }} · ¥{{ money(item.totalAmount) }} · {{ formatTime(item.createdAt || item.createTime) }}</p>
                </div>
                <el-tag :type="statusTagType(item.status)" effect="plain">{{ statusText(item.status) }}</el-tag>
              </article>
            </div>
          </section>

          <section class="detail-section detail-section--full">
            <div class="section-head">
              <div class="section-title">地址列表</div>
              <el-tag effect="plain">{{ detailMeta.addresses.length }}</el-tag>
            </div>
            <el-empty v-if="!detailMeta.addresses.length" description="暂无收货地址" />
            <div v-else class="address-list">
              <article v-for="item in detailMeta.addresses" :key="item.id" class="address-item">
                <div class="address-item__main">
                  <strong>{{ item.receiverName || item.name || '未命名地址' }}</strong>
                  <p>{{ item.province || '' }}{{ item.city || '' }}{{ item.district || '' }} {{ item.detailAddress || item.address || '' }}</p>
                  <p>{{ item.phone || item.mobile || '-' }}</p>
                </div>
                <el-tag v-if="item.isDefault || Number(item.defaultFlag) === 1" type="warning" effect="dark">默认</el-tag>
              </article>
            </div>
          </section>
        </div>

        <div class="detail-section">
          <div class="section-title">账户概览</div>
          <div class="section-text">可根据后端返回数据继续扩展风控标签、收藏列表、登录 IP 分析等模块。</div>
        </div>

        <div class="detail-actions">
          <el-button @click="openNoteDialog(detailUser)">编辑备注</el-button>
          <el-button type="primary" plain @click="toggleStatus(detailUser)">{{ isDisabled(detailUser.status) ? '启用账号' : '禁用账号' }}</el-button>
          <el-button type="warning" plain @click="toggleRole(detailUser)">{{ isAdmin(detailUser.role) ? '降为普通用户' : '提升为管理员' }}</el-button>
        </div>
      </div>
    </el-drawer>

    <el-dialog :title="batchDialogTitle" :visible.sync="batchDialogVisible" width="500px">
      <div v-if="batchAction==='status'" class="dialog-tip">将把选中的 {{ selectedIds.length }} 名用户统一切换为指定状态。</div>
      <div v-else-if="batchAction==='role'" class="dialog-tip">将把选中的 {{ selectedIds.length }} 名用户统一切换为指定角色。</div>
      <div v-else-if="batchAction==='note'" class="dialog-tip">将为选中的 {{ selectedIds.length }} 名用户批量写入相同备注。</div>
      <div v-else class="dialog-tip">将导出当前可见的用户数据为 CSV。</div>

      <div v-if="batchAction==='status'" class="dialog-form">
        <el-radio-group v-model="batchStatusValue">
          <el-radio :label="1">启用</el-radio>
          <el-radio :label="0">禁用</el-radio>
        </el-radio-group>
      </div>
      <div v-else-if="batchAction==='role'" class="dialog-form">
        <el-radio-group v-model="batchRoleValue">
          <el-radio :label="0">普通用户</el-radio>
          <el-radio :label="1">管理员</el-radio>
        </el-radio-group>
      </div>
      <div v-else-if="batchAction==='note'" class="dialog-form">
        <el-input v-model="batchNote" type="textarea" :rows="4" maxlength="120" show-word-limit placeholder="请输入批量备注内容" />
      </div>

      <span slot="footer">
        <el-button @click="batchDialogVisible = false">取消</el-button>
        <el-button v-if="batchAction==='status'" type="primary" :loading="batchLoading" @click="confirmBatchStatus">确认</el-button>
        <el-button v-else-if="batchAction==='role'" type="primary" :loading="batchLoading" @click="confirmBatchRole">确认</el-button>
        <el-button v-else-if="batchAction==='note'" type="primary" :loading="batchLoading" @click="confirmBatchNote">确认</el-button>
        <el-button v-else type="primary" @click="confirmBatchExport">导出</el-button>
      </span>
    </el-dialog>

    <el-dialog :title="noteDialogTitle" :visible.sync="noteDialogVisible" width="460px">
      <el-input v-model="noteForm.note" type="textarea" :rows="4" maxlength="120" show-word-limit placeholder="输入内部备注，例如：重点客户 / 待回访 / 风控关注" />
      <span slot="footer">
        <el-button @click="noteDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="noteLoading" @click="saveNote">保存备注</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { api } from "../../api";
import { pushAdminLog } from "../../utils/adminLog";

export default {
  name: "AdminUsers",
  data() {
    return {
      list: [],
      filters: { keyword: "", role: "", status: "", dateRange: [] },
      currentPage: 1,
      pageSize: 10,
      selectedIds: [],
      detailVisible: false,
      detailUser: null,
      detailMeta: { loginRecords: [], recentOrders: [], addresses: [] },
      noteDialogVisible: false,
      noteLoading: false,
      noteForm: { id: null, note: "" },
      batchDialogVisible: false,
      batchAction: "",
      batchLoading: false,
      batchStatusValue: 1,
      batchRoleValue: 0,
      batchNote: "",
      roleOptions: [
        { value: 0, label: "普通用户" },
        { value: 1, label: "管理员" }
      ],
      statusOptions: [
        { value: 1, label: "正常" },
        { value: 0, label: "禁用" }
      ]
    };
  },
  computed: {
    filteredList() {
      const kw = String(this.filters.keyword || "").trim().toLowerCase();
      return this.list.filter(item => {
        if (this.filters.role !== "" && Number(item.role) !== Number(this.filters.role)) return false;
        if (this.filters.status !== "" && Number(item.status) !== Number(this.filters.status)) return false;
        if (Array.isArray(this.filters.dateRange) && this.filters.dateRange.length === 2) {
          const created = String(item.createdAt || item.createTime || "").slice(0, 10);
          if (created && (created < this.filters.dateRange[0] || created > this.filters.dateRange[1])) return false;
        }
        if (!kw) return true;
        const text = [item.username, item.phone, item.email, item.note, item.id].join(" ").toLowerCase();
        return text.includes(kw);
      });
    },
    pagedList() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.filteredList.slice(start, start + this.pageSize);
    },
    isAllSelected() {
      return this.pagedList.length > 0 && this.pagedList.every(item => this.selectedIds.includes(Number(item.id)));
    },
    isIndeterminate() {
      const count = this.pagedList.filter(item => this.selectedIds.includes(Number(item.id))).length;
      return count > 0 && count < this.pagedList.length;
    },
    adminCount() {
      return this.list.filter(item => Number(item.role) === 1).length;
    },
    disabledCount() {
      return this.list.filter(item => Number(item.status) === 0).length;
    },
    noteDialogTitle() {
      return this.noteForm.id ? "编辑用户备注" : "用户备注";
    },
    batchDialogTitle() {
      return ({ status: "批量切换状态", role: "批量设置角色", note: "批量备注", export: "导出用户数据" })[this.batchAction] || "批量操作";
    }
  },
  watch: {
    filteredList() {
      this.syncSelection();
    },
    filters: {
      deep: true,
      handler() {
        this.currentPage = 1;
      }
    }
  },
  async created() {
    await this.load();
  },
  methods: {
    async load() {
      const res = await api.adminUsers({ pageNum: 1, pageSize: 200 });
      this.list = (res.records || []).map(item => ({ ...item, note: item.note || item.remark || "" }));
      this.syncSelection();
    },
    async loadDetailMeta(userId) {
      try {
        const [detail, loginRecordsRes, ordersRes, addressesRes] = await Promise.all([
          api.adminUserMeta(userId),
          api.adminUserLoginRecords(userId),
          api.adminUserRecentOrders(userId, { pageNum: 1, pageSize: 5 }),
          api.adminUserAddresses(userId)
        ]);
        if (detail) {
          const next = detail.user || detail.data || detail;
          this.detailUser = { ...this.detailUser, ...next, note: next.note || next.remark || this.detailUser.note || "" };
        }
        this.detailMeta = {
          loginRecords: this.normalizeList(loginRecordsRes),
          recentOrders: this.normalizeList(ordersRes),
          addresses: this.normalizeList(addressesRes)
        };
      } catch (e) {
        this.detailMeta = { loginRecords: [], recentOrders: [], addresses: [] };
      }
    },
    normalizeList(payload) {
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.records)) return payload.records;
      if (Array.isArray(payload?.list)) return payload.list;
      if (Array.isArray(payload?.data)) return payload.data;
      return [];
    },
    resetFilters() {
      this.filters = { keyword: "", role: "", status: "", dateRange: [] };
      this.currentPage = 1;
      this.selectedIds = [];
    },
    syncSelection() {
      this.selectedIds = this.selectedIds.filter(id => this.filteredList.some(item => Number(item.id) === id));
      this.$nextTick(() => {
        if (this.$refs.tableRef && this.$refs.tableRef.clearSelection) {
          this.$refs.tableRef.clearSelection();
        }
      });
    },
    handleSelectionChange(rows) {
      const visibleIds = this.pagedList.map(item => Number(item.id));
      const selectedVisible = rows.map(item => Number(item.id)).filter(id => visibleIds.includes(id));
      const retained = this.selectedIds.filter(id => !visibleIds.includes(id));
      this.selectedIds = Array.from(new Set([...retained, ...selectedVisible]));
    },
    toggleSelectAll(checked) {
      const ids = this.pagedList.map(item => Number(item.id));
      this.selectedIds = checked ? Array.from(new Set([...this.selectedIds, ...ids])) : this.selectedIds.filter(id => !ids.includes(id));
    },
    async openDetail(row) {
      this.detailUser = row;
      this.detailMeta = { loginRecords: [], recentOrders: [], addresses: [] };
      this.detailVisible = true;
      await this.loadDetailMeta(row.id);
    },
    openNoteDialog(row) {
      this.noteForm = { id: row.id, note: row.note || row.remark || "" };
      this.noteDialogVisible = true;
    },
    async saveNote() {
      if (!this.noteForm.id) return;
      this.noteLoading = true;
      try {
        await this.applyNote([this.noteForm.id], this.noteForm.note);
        pushAdminLog({ module: "user", action: "update", content: `修改用户备注【${this.noteForm.id}】`, target: `用户 #${this.noteForm.id}`, risky: false, meta: { note: this.noteForm.note } });
        this.noteDialogVisible = false;
        this.$message.success("备注已保存");
        await this.load();
      } finally {
        this.noteLoading = false;
      }
    },
    openBatchAction(action) {
      if (!this.selectedIds.length) return;
      this.batchAction = action;
      this.batchDialogVisible = true;
      if (action === "status") this.batchStatusValue = 1;
      if (action === "role") this.batchRoleValue = 0;
      if (action === "note") this.batchNote = "";
    },
    async confirmBatchStatus() {
      this.batchLoading = true;
      try {
        for (const id of this.selectedIds) {
          await api.adminUserStatus(id, this.batchStatusValue);
          pushAdminLog({ module: "user", action: "status", content: `批量${this.batchStatusValue === 1 ? "启用" : "禁用"}用户`, target: `用户 #${id}`, risky: this.batchStatusValue === 0, meta: { status: this.batchStatusValue } });
        }
        this.$message.success("批量状态更新完成");
        this.batchDialogVisible = false;
        this.selectedIds = [];
        await this.load();
      } finally {
        this.batchLoading = false;
      }
    },
    async confirmBatchRole() {
      this.batchLoading = true;
      try {
        for (const id of this.selectedIds) {
          await api.adminUserRole(id, this.batchRoleValue);
          pushAdminLog({ module: "user", action: "update", content: `批量设置用户角色`, target: `用户 #${id}`, risky: false, meta: { role: this.batchRoleValue } });
        }
        this.$message.success("批量角色更新完成");
        this.batchDialogVisible = false;
        this.selectedIds = [];
        await this.load();
      } finally {
        this.batchLoading = false;
      }
    },
    async confirmBatchNote() {
      if (!String(this.batchNote || "").trim()) return this.$message.warning("请输入备注内容");
      this.batchLoading = true;
      try {
        await this.applyNote(this.selectedIds, this.batchNote.trim());
        this.selectedIds.forEach(id => pushAdminLog({ module: "user", action: "update", content: "批量修改用户备注", target: `用户 #${id}`, risky: false, meta: { note: this.batchNote.trim() } }));
        this.$message.success("批量备注已保存");
        this.batchDialogVisible = false;
        this.selectedIds = [];
        await this.load();
      } finally {
        this.batchLoading = false;
      }
    },
    confirmBatchExport() {
      const rows = this.filteredList.filter(item => this.selectedIds.includes(Number(item.id)));
      const exportRows = rows.length ? rows : this.filteredList;
      const csv = [["ID", "用户名", "手机号", "邮箱", "角色", "状态", "余额", "积分", "备注"], ...exportRows.map(item => [item.id, item.username, item.phone, item.email, this.roleText(item.role), this.statusText(item.status), this.money(item.balance), this.numberValue(item.points), item.note || ""])]
        .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
        .join("\n");
      const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "users-export.csv";
      a.click();
      URL.revokeObjectURL(url);
      this.batchDialogVisible = false;
    },
    async applyNote(ids, note) {
      const text = String(note || "").trim();
      const targets = this.list.filter(item => ids.includes(Number(item.id)));
      const updated = targets.map(item => ({ ...item, note: text }));
      updated.forEach(item => {
        const idx = this.list.findIndex(x => Number(x.id) === Number(item.id));
        if (idx !== -1) this.$set(this.list, idx, item);
      });
    },
    async toggleStatus(row) {
      const nextStatus = this.isDisabled(row.status) ? 1 : 0;
      await this.$confirm(`确定将用户 ${row.username} ${nextStatus === 1 ? "启用" : "禁用"} 吗？`, "状态确认", { type: "warning" });
      await api.adminUserStatus(row.id, nextStatus);
      pushAdminLog({ module: "user", action: "status", content: `${nextStatus === 1 ? "启用" : "禁用"}用户【${row.username}】`, target: `用户 #${row.id}`, risky: nextStatus === 0, meta: { status: nextStatus } });
      this.$message.success("状态已更新");
      await this.load();
    },
    async toggleRole(row) {
      const nextRole = this.isAdmin(row.role) ? 0 : 1;
      await this.$confirm(`确定将用户 ${row.username} 设置为 ${nextRole === 1 ? "管理员" : "普通用户"} 吗？`, "角色确认", { type: "warning" });
      await api.adminUserRole(row.id, nextRole);
      pushAdminLog({ module: "user", action: "update", content: `${nextRole === 1 ? "设为管理员" : "降为普通用户"}【${row.username}】`, target: `用户 #${row.id}`, risky: true, meta: { role: nextRole } });
      this.$message.success("角色已更新");
      await this.load();
    },
    roleText(role) {
      return Number(role) === 1 ? "管理员" : "普通用户";
    },
    statusText(status) {
      return Number(status) === 1 ? "正常" : "禁用";
    },
    roleTagType(role) {
      return Number(role) === 1 ? "success" : "info";
    },
    statusTagType(status) {
      return Number(status) === 1 ? "success" : "danger";
    },
    isAdmin(role) {
      return Number(role) === 1;
    },
    isDisabled(status) {
      return Number(status) === 0;
    },
    formatTime(value) {
      return value ? String(value).replace("T", " ").slice(0, 16) : "-";
    },
    money(value) {
      const num = Number(value || 0);
      return Number.isNaN(num) ? "0.00" : num.toFixed(2);
    },
    numberValue(value) {
      const num = Number(value || 0);
      return Number.isNaN(num) ? 0 : num;
    },
    avatarText(username) {
      return String(username || "U").slice(0, 1).toUpperCase();
    }
  }
};
</script>

<style scoped>
.admin-users-page{padding:0}.page-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-end;margin-bottom:16px}.page-subtitle{margin:8px 0 0;color:#8a94a6;font-size:13px;line-height:1.7}.page-head__stats{display:flex;gap:12px;flex-wrap:wrap}.stat-card{min-width:120px;padding:14px 16px;border-radius:16px;background:linear-gradient(135deg,#fff,#fff7f2);border:1px solid #f0e3dc}.stat-card span{display:block;color:#8a94a6;font-size:12px}.stat-card strong{display:block;margin-top:8px;font-size:22px;color:#1c2434}.filter-panel{padding:16px 18px;border:1px solid #eee;border-radius:18px;background:#fff7f3;margin-bottom:16px}.filter-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1.2fr;gap:14px}.filter-item{display:grid;gap:8px}.filter-item label{color:#5f6677;font-size:12px;font-weight:800}.filter-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}.table-toolbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;color:#6c7382}.toolbar-right{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.pager{display:flex;justify-content:flex-end;margin-top:14px}.detail-drawer{padding:6px 2px 24px}.detail-hero{display:flex;gap:14px;align-items:center;padding:18px;border-radius:18px;background:linear-gradient(135deg,#fff7f2 0%,#f8fbff 100%);border:1px solid #f0e7ea}.avatar-circle{width:58px;height:58px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#ff7a5c 0%,#ffb65d 100%);color:#fff;font-size:20px;font-weight:900}.detail-hero h3{margin:0;color:#1c2434}.detail-hero p{margin:6px 0 0;color:#8a94a6}.detail-tags{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.detail-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:16px}.detail-card{padding:14px 16px;border-radius:16px;background:#fff;border:1px solid #eef2f6}.detail-card span,.section-title{display:block;color:#8a94a6;font-size:12px}.detail-card b{display:block;margin-top:8px;color:#1c2434;font-size:14px;line-height:1.6;word-break:break-word}.detail-section{margin-top:16px;padding:16px;border-radius:16px;background:linear-gradient(135deg,#fff,#f8fbff);border:1px solid #eef2f6}.section-title{font-weight:800;margin-bottom:8px}.section-text{color:#5f6677;font-size:13px;line-height:1.8}.detail-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}.dialog-tip{color:#5f6677;line-height:1.7;margin-bottom:14px}.dialog-form{padding:4px 0 2px}@media (max-width:1100px){.filter-grid,.detail-grid{grid-template-columns:1fr 1fr}}@media (max-width:760px){.page-head,.table-toolbar{flex-direction:column;align-items:flex-start}.filter-grid{grid-template-columns:1fr}.page-head__stats{width:100%}.stat-card{flex:1;width:100%}}</style>
