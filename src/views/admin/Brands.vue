<template>
  <div class="admin-brands-page">
    <div class="card toolbar-card">
      <div class="toolbar-head">
        <div>
          <h3 class="page-title" style="margin:0 0 8px;">IP 管理</h3>
          <div class="toolbar-subtitle">支持搜索、筛选、批量操作、详情查看和 IP 商品联动，方便运营与素材管理。</div>
        </div>
        <div class="toolbar-actions">
          <el-button :disabled="!selectedIds.length" @click="openBatchDialog('export')">导出</el-button>
          <el-button :disabled="!selectedIds.length" @click="openBatchDialog('status')">批量上下架</el-button>
          <el-button :disabled="!selectedIds.length" @click="openBatchDialog('featured')">批量推荐</el-button>
          <el-button type="primary" @click="openCreate">新增 IP</el-button>
        </div>
      </div>

      <div class="stats-row">
        <div class="stat-card"><span>IP 总数</span><strong>{{ filteredBrands.length }}</strong></div>
        <div class="stat-card"><span>启用 IP</span><strong>{{ enabledCount }}</strong></div>
        <div class="stat-card"><span>推荐 IP</span><strong>{{ featuredCount }}</strong></div>
        <div class="stat-card"><span>关联商品</span><strong>{{ totalProducts }}</strong></div>
      </div>

      <el-form :inline="true" :model="query" class="query-form" @submit.native.prevent="load">
        <el-form-item><el-input v-model="query.keyword" placeholder="搜索 IP 名称 / 简介 / ID" clearable @keyup.enter.native="load" /></el-form-item>
        <el-form-item>
          <el-select v-model="query.status" clearable placeholder="状态">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="query.featured" clearable placeholder="推荐">
            <el-option label="推荐" :value="1" />
            <el-option label="未推荐" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="load">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="card">
      <el-table ref="tableRef" :data="pagedBrands" border row-key="id" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="Logo" width="92">
          <template slot-scope="s">
            <img v-if="s.row.logo" :src="resolveAssetUrl(s.row.logo)" class="logo-thumb" />
            <div v-else class="logo-fallback">{{ s.row.name ? s.row.name.charAt(0) : 'B' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="IP 名称" min-width="180">
          <template slot-scope="s">
            <button class="brand-link" @click="openDetail(s.row)">{{ s.row.name }}</button>
            <div class="brand-meta">
              <el-tag v-if="Number(s.row.featured)===1" size="mini" type="warning">推荐</el-tag>
              <el-tag v-if="Number(s.row.hot)===1" size="mini" type="danger">热门</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="productCount" label="商品数" width="100" />
        <el-table-column prop="sortOrder" label="排序" width="90" />
        <el-table-column label="状态" width="100">
          <template slot-scope="s"><el-tag :type="s.row.status === 1 ? 'success' : 'info'">{{ s.row.status === 1 ? '启用' : '停用' }}</el-tag></template>
        </el-table-column>
        <el-table-column label="简介" min-width="220">
          <template slot-scope="s">
            <div class="ellipsis-2">{{ s.row.description || '暂无简介' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="360" fixed="right">
          <template slot-scope="s">
            <el-button size="mini" type="primary" @click="openEdit(s.row)">编辑</el-button>
            <el-button size="mini" type="info" plain @click="openDetail(s.row)">详情</el-button>
            <el-button size="mini" type="success" plain @click="toggleFeatured(s.row)">{{ Number(s.row.featured)===1 ? '取消推荐' : '推荐' }}</el-button>
            <el-button size="mini" type="warning" plain @click="setStatus(s.row, Number(s.row.status)===1 ? 0 : 1)">{{ Number(s.row.status)===1 ? '停用' : '启用' }}</el-button>
            <el-button size="mini" type="danger" plain @click="removeBrand(s.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrap">
        <el-pagination background layout="total, prev, pager, next, jumper" :total="filteredBrands.length" :page-size="pageSize" :current-page.sync="currentPage" />
      </div>
    </div>

    <el-drawer title="IP 详情" :visible.sync="detailVisible" size="640px" destroy-on-close>
      <div v-if="detailBrand" class="detail-drawer">
        <div class="detail-hero">
          <img v-if="detailBrand.logo" :src="resolveAssetUrl(detailBrand.logo)" class="detail-logo" />
          <div v-else class="detail-logo-fallback">{{ detailBrand.name ? detailBrand.name.charAt(0) : 'B' }}</div>
          <div>
            <h3>{{ detailBrand.name }}</h3>
            <p>{{ detailBrand.description || '暂无 IP 简介' }}</p>
            <div class="detail-tags">
              <el-tag :type="detailBrand.status === 1 ? 'success' : 'info'">{{ detailBrand.status === 1 ? '启用' : '停用' }}</el-tag>
              <el-tag v-if="Number(detailBrand.featured)===1" type="warning">推荐</el-tag>
              <el-tag v-if="Number(detailBrand.hot)===1" type="danger">热门</el-tag>
              <el-tag effect="plain">商品数 {{ detailBrand.productCount || 0 }}</el-tag>
            </div>
          </div>
        </div>

        <div class="detail-grid">
          <div class="detail-card"><span>IP ID</span><b>{{ detailBrand.id }}</b></div>
          <div class="detail-card"><span>排序</span><b>{{ detailBrand.sortOrder || 0 }}</b></div>
          <div class="detail-card"><span>创建时间</span><b>{{ formatTime(detailBrand.createdAt || detailBrand.createTime) }}</b></div>
          <div class="detail-card"><span>更新时间</span><b>{{ formatTime(detailBrand.updatedAt || detailBrand.updateTime) }}</b></div>
        </div>

        <div class="detail-section">
          <div class="section-head">
            <div class="section-title">IP 商品</div>
            <el-button size="mini" plain @click="goBrandProducts(detailBrand)">查看全部商品</el-button>
          </div>
          <el-empty v-if="!brandProducts.length" description="暂无 IP 商品" />
          <div v-else class="product-list">
            <article v-for="item in brandProducts" :key="item.id" class="product-item">
              <img :src="resolveAssetUrl(item.coverUrl) || fallback" class="product-thumb" />
              <div class="product-main">
                <strong>{{ item.name }}</strong>
                <p>¥{{ money(item.price) }} · 库存 {{ item.stock }} · 销量 {{ item.saleCount }}</p>
              </div>
              <el-tag :type="item.status === 1 ? 'success' : 'info'">{{ item.status === 1 ? '上架' : '下架' }}</el-tag>
            </article>
          </div>
        </div>

        <div class="detail-actions">
          <el-button @click="openEdit(detailBrand)">编辑 IP</el-button>
          <el-button type="success" plain @click="toggleFeatured(detailBrand)">{{ Number(detailBrand.featured)===1 ? '取消推荐' : '设为推荐' }}</el-button>
          <el-button type="warning" plain @click="setStatus(detailBrand, Number(detailBrand.status)===1 ? 0 : 1)">{{ Number(detailBrand.status)===1 ? '停用' : '启用' }}</el-button>
        </div>
      </div>
    </el-drawer>

    <el-dialog :title="editingId ? '编辑 IP' : '新增 IP'" :visible.sync="dialogVisible" width="720px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="IP 名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="首字母"><el-input v-model="form.initial" maxlength="1" /></el-form-item>
        <el-form-item label="IP Logo">
          <div class="upload-block">
            <input ref="logoInput" type="file" accept="image/*" class="hidden-file-input" @change="handleLogoUpload" />
            <div class="upload-actions">
              <el-button type="primary" plain @click="triggerLogoUpload">上传Logo</el-button>
              <el-button v-if="form.logo" @click="clearLogo">清空Logo</el-button>
            </div>
            <div v-if="form.logo" class="logo-preview-wrap">
              <img :src="resolveAssetUrl(form.logo)" alt="logo" class="logo-preview" />
            </div>
          </div>
        </el-form-item>
        <el-form-item label="IP 封面"><el-input v-model="form.bannerUrl" placeholder="可填 IP 头图链接" /></el-form-item>
        <el-form-item label="IP 简介"><el-input v-model="form.description" type="textarea" :rows="4" maxlength="500" show-word-limit /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sortOrder" :min="0" /></el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="标签">
          <el-checkbox v-model="form.featured" :true-label="1" :false-label="0">推荐</el-checkbox>
          <el-checkbox v-model="form.hot" :true-label="1" :false-label="0">热门</el-checkbox>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitBrand">保存</el-button>
      </span>
    </el-dialog>

    <el-dialog title="批量操作" :visible.sync="batchDialogVisible" width="460px">
      <div class="dialog-tip">已选中 {{ selectedIds.length }} 个 IP。</div>
      <div v-if="batchAction==='status'" class="dialog-form">
        <el-radio-group v-model="batchStatusValue"><el-radio :label="1">启用</el-radio><el-radio :label="0">停用</el-radio></el-radio-group>
      </div>
      <div v-else-if="batchAction==='featured'" class="dialog-form">
        <el-radio-group v-model="batchFeaturedValue"><el-radio :label="1">推荐</el-radio><el-radio :label="0">取消推荐</el-radio></el-radio-group>
      </div>
      <span slot="footer">
        <el-button @click="batchDialogVisible = false">取消</el-button>
        <el-button v-if="batchAction==='status'" type="primary" :loading="batchLoading" @click="confirmBatchStatus">确认</el-button>
        <el-button v-else-if="batchAction==='featured'" type="primary" :loading="batchLoading" @click="confirmBatchFeatured">确认</el-button>
        <el-button v-else type="primary" @click="confirmBatchExport">导出</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { api } from "../../api";
import { resolveAssetUrl } from "../../utils/asset";
import { pushAdminLog } from "../../utils/adminLog";
const emptyBrand = () => ({ name: "", initial: "", logo: "", bannerUrl: "", description: "", sortOrder: 0, status: 1, featured: 0, hot: 0 });
export default {
  name: "AdminBrandsPage",
  data() {
    return {
      fallback: "https://dummyimage.com/120x120/f2f2f2/999&text=Toy",
      query: { keyword: "", status: null, featured: null },
      brands: [],
      selectedIds: [],
      currentPage: 1,
      pageSize: 10,
      dialogVisible: false,
      detailVisible: false,
      batchDialogVisible: false,
      batchAction: "",
      batchLoading: false,
      batchStatusValue: 1,
      batchFeaturedValue: 1,
      editingId: null,
      detailBrand: null,
      brandProducts: [],
      form: emptyBrand()
    };
  },
  async created() {
    await this.load();
  },
  computed: {
    filteredBrands() {
      const kw = String(this.query.keyword || "").trim().toLowerCase();
      return this.brands.filter(item => {
        if (this.query.status !== null && this.query.status !== undefined && Number(item.status) !== Number(this.query.status)) return false;
        if (this.query.featured !== null && this.query.featured !== undefined && Number(item.featured || 0) !== Number(this.query.featured)) return false;
        if (!kw) return true;
        return [item.id, item.name, item.description, item.initial].join(" ").toLowerCase().includes(kw);
      }).sort((a, b) => Number(b.sortOrder || 0) - Number(a.sortOrder || 0));
    },
    pagedBrands() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.filteredBrands.slice(start, start + this.pageSize);
    },
    enabledCount() { return this.brands.filter(item => Number(item.status) === 1).length; },
    featuredCount() { return this.brands.filter(item => Number(item.featured) === 1).length; },
    totalProducts() { return this.brands.reduce((sum, item) => sum + Number(item.productCount || 0), 0); }
  },
  methods: {
    resolveAssetUrl,
    async load() {
      const res = await api.adminBrands();
      this.brands = Array.isArray(res) ? res : res?.records || [];
      this.currentPage = Math.min(this.currentPage, Math.max(Math.ceil(this.filteredBrands.length / this.pageSize), 1));
      this.syncSelection();
    },
    syncSelection() {
      this.selectedIds = this.selectedIds.filter(id => this.filteredBrands.some(item => Number(item.id) === id));
    },
    handleSelectionChange(rows) {
      const visibleIds = this.pagedBrands.map(item => Number(item.id));
      const selectedVisible = rows.map(item => Number(item.id)).filter(id => visibleIds.includes(id));
      const retained = this.selectedIds.filter(id => !visibleIds.includes(id));
      this.selectedIds = Array.from(new Set([...retained, ...selectedVisible]));
    },
    resetQuery() { this.query = { keyword: "", status: null, featured: null }; this.currentPage = 1; this.load(); },
    openCreate() { this.editingId = null; this.form = emptyBrand(); this.dialogVisible = true; },
    async openEdit(row) { this.editingId = row.id; const detail = await api.adminBrandDetail(row.id).catch(() => row); this.form = { ...emptyBrand(), ...row, ...(detail || {}) }; this.dialogVisible = true; },
    async submitBrand() { if (!String(this.form.name || "").trim()) return this.$message.warning("请填写 IP 名称"); if (this.editingId) { await api.adminBrandUpdate(this.editingId, this.form); pushAdminLog({ module: "IP", action: "编辑", content: `编辑 IP【${this.form.name}】`, target: this.form.name, meta: { brandId: this.editingId } }); } else { await api.adminBrandAdd(this.form); pushAdminLog({ module: "IP", action: "新增", content: `新增 IP【${this.form.name}】`, target: this.form.name, meta: { brandName: this.form.name } }); } this.$message.success(this.editingId ? "IP 已更新" : "IP 已新增"); this.dialogVisible = false; await this.load(); },
    async handleLogoUpload(event) { const file = event.target.files && event.target.files[0]; if (!file) return; try { const res = await api.uploadFile(file); this.form.logo = res.url; } finally { event.target.value = ""; } },
    triggerLogoUpload() { this.$refs.logoInput && this.$refs.logoInput.click(); },
    clearLogo() { this.form.logo = ""; },
    openDetail(row) { this.detailBrand = row; this.brandProducts = []; this.detailVisible = true; this.loadDetail(row.id); },
    async loadDetail(id) { this.detailBrand = await api.adminBrandDetail(id).catch(() => this.detailBrand); const res = await api.adminBrandProducts({ brandId: id, pageNum: 1, pageSize: 6 }).catch(() => ({})); this.brandProducts = res.records || []; },
    goBrandProducts(row) { this.$router.push({ path: "/admin/products", query: { brandId: row.id } }); },
    async setStatus(row, status) { await api.adminBrandUpdate(row.id, { ...row, status }); pushAdminLog({ module: "IP", action: status === 1 ? "启用" : "停用", content: `IP 状态已${status === 1 ? "启用" : "停用"}`, target: row.name, risky: status === 0, meta: { brandId: row.id, nextStatus: status } }); this.$message.success("状态已更新"); await this.load(); },
    async toggleFeatured(row) { const next = Number(row.featured) === 1 ? 0 : 1; await api.adminBrandUpdate(row.id, { ...row, featured: next }); pushAdminLog({ module: "IP", action: next === 1 ? "推荐" : "取消推荐", content: `IP 已${next === 1 ? "设为推荐" : "取消推荐"}`, target: row.name, meta: { brandId: row.id, nextFeatured: next } }); this.$message.success("IP 推荐状态已更新"); await this.load(); },
    async removeBrand(row) { try { await this.$confirm(`确认删除 IP「${row.name}」吗？`, "提示", { type: "warning" }); } catch (e) { if (e === "cancel" || e === "close") return; } await api.adminBrandDelete(row.id); pushAdminLog({ module: "IP", action: "删除", content: `删除 IP【${row.name}】`, target: row.name, risky: true, meta: { brandId: row.id } }); this.$message.success("IP 已删除"); await this.load(); },
    openBatchDialog(action) { this.batchAction = action; this.batchDialogVisible = true; },
    async confirmBatchStatus() { this.batchLoading = true; try { for (const id of this.selectedIds) await api.adminBrandUpdate(id, { status: this.batchStatusValue }); const targets = this.brands.filter(item => this.selectedIds.includes(Number(item.id))).map(item => item.name).join("、"); pushAdminLog({ module: "IP", action: "批量上下架", content: `批量${this.batchStatusValue === 1 ? "启用" : "停用"} IP`, target: targets || `共 ${this.selectedIds.length} 个 IP`, risky: this.batchStatusValue === 0, meta: { ids: this.selectedIds, nextStatus: this.batchStatusValue } }); this.$message.success("批量状态更新完成"); this.batchDialogVisible = false; this.selectedIds = []; await this.load(); } finally { this.batchLoading = false; } },
    async confirmBatchFeatured() { this.batchLoading = true; try { for (const id of this.selectedIds) await api.adminBrandUpdate(id, { featured: this.batchFeaturedValue }); const targets = this.brands.filter(item => this.selectedIds.includes(Number(item.id))).map(item => item.name).join("、"); pushAdminLog({ module: "IP", action: "批量推荐", content: `批量${this.batchFeaturedValue === 1 ? "推荐" : "取消推荐"} IP`, target: targets || `共 ${this.selectedIds.length} 个 IP`, meta: { ids: this.selectedIds, nextFeatured: this.batchFeaturedValue } }); this.$message.success("批量推荐更新完成"); this.batchDialogVisible = false; this.selectedIds = []; await this.load(); } finally { this.batchLoading = false; } },
    confirmBatchExport() { const rows = this.filteredBrands.filter(item => this.selectedIds.includes(Number(item.id))); const exportRows = rows.length ? rows : this.filteredBrands; const csv = [["ID", "IP 名称", "状态", "推荐", "商品数", "排序", "简介"], ...exportRows.map(item => [item.id, item.name, item.status === 1 ? "启用" : "停用", Number(item.featured) === 1 ? "是" : "否", item.productCount || 0, item.sortOrder || 0, item.description || ""])] .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n"); const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8;" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "ips-export.csv"; a.click(); URL.revokeObjectURL(url); this.batchDialogVisible = false; },
    formatTime(v) { return v ? String(v).replace("T", " ").slice(0, 16) : "-"; },
    money(v) { const n = Number(v || 0); return Number.isNaN(n) ? "0.00" : n.toFixed(2); }
  }
};
</script>

<style scoped>
.admin-brands-page{display:grid;gap:18px}.toolbar-card{border-radius:16px;background:linear-gradient(180deg,#fcfdff 0%,#f7f9fc 100%)}.toolbar-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:18px}.toolbar-subtitle{color:#8a94a6;font-size:13px}.toolbar-actions{display:flex;gap:10px;flex-wrap:wrap}.stats-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:16px}.stat-card{padding:14px 16px;border-radius:16px;background:linear-gradient(135deg,#fff,#fff7f2);border:1px solid #f0e3dc}.stat-card span{display:block;color:#8a94a6;font-size:12px}.stat-card strong{display:block;margin-top:8px;font-size:22px;color:#1c2434}.query-form{margin-bottom:-18px}.logo-thumb,.detail-logo,.product-thumb{width:52px;height:52px;object-fit:cover;border-radius:10px;border:1px solid #e4eaf4}.logo-fallback,.detail-logo-fallback{width:52px;height:52px;display:grid;place-items:center;border-radius:10px;background:linear-gradient(135deg,#ff5f95 0%,#ff9d42 55%,#38d9ff 100%);color:#fff;font-weight:900}.brand-link{border:none;background:transparent;color:#1c2434;font-weight:800;cursor:pointer;padding:0}.brand-meta{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}.ellipsis-2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.6;color:#5f6677}.pagination-wrap{margin-top:18px;display:flex;justify-content:flex-end}.detail-drawer{padding:2px 0 24px}.detail-hero{display:flex;gap:14px;align-items:center;padding:18px;border-radius:18px;background:linear-gradient(135deg,#fff7f2 0%,#f8fbff 100%);border:1px solid #f0e7ea}.detail-hero h3{margin:0;color:#1c2434}.detail-hero p{margin:6px 0 0;color:#8a94a6}.detail-tags{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.detail-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:16px}.detail-card{padding:14px 16px;border-radius:16px;background:#fff;border:1px solid #eef2f6}.detail-card span,.section-title{display:block;color:#8a94a6;font-size:12px}.detail-card b{display:block;margin-top:8px;color:#1c2434;font-size:14px;line-height:1.6}.detail-section{margin-top:16px;padding:16px;border-radius:16px;background:linear-gradient(135deg,#fff,#f8fbff);border:1px solid #eef2f6}.section-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px}.section-title{font-weight:800}.product-list{display:grid;gap:12px}.product-item{display:flex;align-items:center;gap:12px;padding:12px;border-radius:14px;background:#fff;border:1px solid #eef2f6}.product-main{flex:1;min-width:0}.product-main strong{display:block;color:#1c2434}.product-main p{margin:6px 0 0;color:#8a94a6}.detail-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}.upload-block{display:grid;gap:12px}.upload-actions{display:flex;flex-wrap:wrap;gap:10px}.hidden-file-input{display:none}.logo-preview-wrap{width:132px;height:132px;border-radius:16px;overflow:hidden;border:1px solid #e4eaf4;background:#fff}.logo-preview{width:100%;height:100%;object-fit:contain}.dialog-tip{color:#5f6677;line-height:1.7;margin-bottom:14px}.dialog-form{padding:4px 0 2px}@media (max-width:1100px){.stats-row,.detail-grid{grid-template-columns:1fr 1fr}}@media (max-width:760px){.toolbar-head{flex-direction:column;align-items:flex-start}.stats-row,.detail-grid{grid-template-columns:1fr}.toolbar-actions{width:100%}}
</style>
