<template>
  <div class="admin-home-config-page">
    <el-card class="hero-card" shadow="never">
      <div class="hero-head">
        <div>
          <div class="hero-badge">HOME OPS</div>
          <h2 class="hero-title">首页运营配置</h2>
          <p class="hero-desc">管理首页 Banner、推荐位和专题入口，支持图片上传、排序调整、状态切换与快速复制，满足本科毕设对后台管理系统的完整性要求。</p>
        </div>
        <div class="hero-actions">
          <el-button plain :loading="loadingSeed" @click="seedDemo">生成示例数据</el-button>
          <el-button type="primary" @click="openCreate">新增配置</el-button>
          <el-button @click="load">刷新</el-button>
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
        <el-radio-group v-model="typeFilter" size="small" @change="resetToFirstPage">
          <el-radio-button label="all">全部</el-radio-button>
          <el-radio-button label="banner">Banner</el-radio-button>
          <el-radio-button label="module">模块</el-radio-button>
          <el-radio-button label="topic">专题</el-radio-button>
        </el-radio-group>
        <div class="toolbar-right">
          <el-input v-model="query" clearable prefix-icon="el-icon-search" placeholder="搜索标题 / 副标题 / 跳转值" @input="resetToFirstPage" />
          <div class="panel-hint">当前筛选：{{ typeFilterLabel }} · 共 {{ filteredList.length }} 条</div>
        </div>
      </div>

      <el-table :data="pagedList" border v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="72" />
        <el-table-column prop="type" label="类型" width="110">
          <template slot-scope="s"><el-tag size="mini" effect="dark">{{ typeLabel(s.row.type) }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="180" />
        <el-table-column prop="subtitle" label="副标题" min-width="240" show-overflow-tooltip />
        <el-table-column label="跳转" min-width="180" show-overflow-tooltip>
          <template slot-scope="s">
            <span class="link-text">{{ targetLabel(s.row) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="imageUrl" label="图片" min-width="180" show-overflow-tooltip />
        <el-table-column prop="sortOrder" label="排序" width="90" />
        <el-table-column label="状态" width="100">
          <template slot-scope="s"><el-tag :type="Number(s.row.status) === 1 ? 'success' : 'info'">{{ Number(s.row.status) === 1 ? '启用' : '停用' }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template slot-scope="s">
            <div class="action-wrap">
              <el-button size="mini" type="primary" @click="openEdit(s.row)">编辑</el-button>
              <el-button size="mini" plain @click="cloneRow(s.row)">复制</el-button>
              <el-button size="mini" :type="Number(s.row.status) === 1 ? 'warning' : 'success'" plain @click="toggleStatus(s.row)">{{ Number(s.row.status) === 1 ? '停用' : '启用' }}</el-button>
              <el-button size="mini" plain @click="moveRow(s.row, -1)">上移</el-button>
              <el-button size="mini" plain @click="moveRow(s.row, 1)">下移</el-button>
              <el-button size="mini" type="danger" plain @click="removeRow(s.row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination background layout="total, prev, pager, next, jumper" :total="filteredList.length" :page-size="pageSize" :current-page.sync="currentPage" @current-change="syncPage" />
      </div>
    </el-card>

    <el-dialog :title="editingId ? '编辑配置' : '新增配置'" :visible.sync="dialogVisible" width="820px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" class="config-form">
        <el-form-item label="类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择类型" style="width:100%;">
            <el-option label="Banner" value="banner" />
            <el-option label="模块" value="module" />
            <el-option label="专题" value="topic" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题" prop="title"><el-input v-model="form.title" placeholder="例如：春日上新 · 潮玩限定" /></el-form-item>
        <el-form-item label="副标题" prop="subtitle"><el-input v-model="form.subtitle" placeholder="例如：首页主视觉推荐文案" /></el-form-item>
        <el-form-item label="图片地址" prop="imageUrl">
          <div class="image-field">
            <el-input v-model="form.imageUrl" placeholder="请输入图片 URL，或点击右侧上传" />
            <el-upload class="upload-trigger" action="#" :show-file-list="false" :http-request="onUpload" :before-upload="beforeUpload">
              <el-button size="mini" :loading="uploading">上传图片</el-button>
            </el-upload>
          </div>
          <div class="form-tip">建议使用 16:9 横图或接近 1:1 的方图，能更适配首页轮播与推荐位。</div>
        </el-form-item>
        <el-form-item label="跳转类型" prop="targetType">
          <el-select v-model="form.targetType" placeholder="请选择跳转类型" style="width:100%;">
            <el-option label="路由 Route" value="route" />
            <el-option label="链接 URL" value="url" />
            <el-option label="品牌 Brand" value="brand" />
            <el-option label="商品 Product" value="product" />
            <el-option label="分类 Category" value="category" />
          </el-select>
        </el-form-item>
        <el-form-item label="跳转目标值" prop="targetValue"><el-input v-model="form.targetValue" placeholder="路由路径、URL、品牌ID、商品ID 或分类ID" /></el-form-item>
        <el-form-item label="排序" prop="sortOrder"><el-input-number v-model="form.sortOrder" :min="0" :max="999" /></el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <div class="dialog-preview" v-if="form.imageUrl || form.title">
        <div class="dialog-preview__title">预览</div>
        <div class="dialog-preview__card">
          <img v-if="form.imageUrl" :src="form.imageUrl" class="dialog-preview__img" />
          <div class="dialog-preview__meta">
            <div class="dialog-preview__chip">{{ typeLabel(form.type) }}</div>
            <div class="dialog-preview__name">{{ form.title || '未填写标题' }}</div>
            <div class="dialog-preview__sub">{{ form.subtitle || '未填写副标题' }}</div>
            <div class="dialog-preview__link">跳转：{{ targetLabel(form) }}</div>
          </div>
        </div>
      </div>
      <span slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitForm">保存</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { api } from '../../api';
import { pushAdminLog } from '../../utils/adminLog';

const emptyForm = () => ({ type: 'banner', title: '', subtitle: '', imageUrl: '', linkUrl: '', targetType: 'route', targetValue: '', sortOrder: 0, status: 1 });
const demoConfigs = [
  { type: 'banner', title: '春日上新 · 潮玩限定', subtitle: '首页大图轮播位，支持跳转到商品详情页。', imageUrl: '/images/banners/banner1.jpg', linkUrl: '/mall/product/43', targetType: 'product', targetValue: '43', sortOrder: 1, status: 1 },
  { type: 'banner', title: '收藏热榜 · 本周推荐', subtitle: '为热卖商品单独开一个运营位，提升转化。', imageUrl: '/images/banners/banner2.jpg', linkUrl: '/mall/products?tab=hot', targetType: 'route', targetValue: '/mall/products?tab=hot', sortOrder: 2, status: 1 },
  { type: 'module', title: '品牌推荐区', subtitle: '首页品牌专区，前台可根据配置展示不同模块。', imageUrl: '/images/banners/banner3.jpg', linkUrl: '/mall/brands', targetType: 'route', targetValue: '/mall/brands', sortOrder: 3, status: 1 }
];

export default {
  data() {
    return {
      loading: false,
      loadingSeed: false,
      saving: false,
      uploading: false,
      list: [],
      dialogVisible: false,
      editingId: null,
      typeFilter: 'all',
      query: '',
      currentPage: 1,
      pageSize: 8,
      form: emptyForm(),
      rules: {
        type: [{ required: true, message: '请选择类型', trigger: 'change' }],
        title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
        imageUrl: [{ required: true, message: '请上传或填写图片地址', trigger: 'blur' }],
        targetType: [{ required: true, message: '请选择跳转类型', trigger: 'change' }],
        targetValue: [{ required: true, message: '请输入跳转目标值', trigger: 'blur' }]
      }
    };
  },
  computed: {
    filteredList() {
      const kw = String(this.query || '').trim().toLowerCase();
      let list = this.list;
      if (this.typeFilter !== 'all') list = list.filter(item => item.type === this.typeFilter);
      if (!kw) return list;
      return list.filter(item => [item.title, item.subtitle, item.imageUrl, item.targetValue, item.linkUrl].join(' ').toLowerCase().includes(kw));
    },
    pagedList() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.filteredList.slice(start, start + this.pageSize);
    },
    typeFilterLabel() {
      return this.typeLabel(this.typeFilter);
    },
    overviewCards() {
      const total = this.list.length;
      const active = this.list.filter(item => Number(item.status) === 1).length;
      const banners = this.list.filter(item => item.type === 'banner').length;
      const maxSort = this.list.reduce((max, item) => Math.max(max, Number(item.sortOrder || 0)), 0);
      return [
        { key: 'total', label: '配置总数', value: total },
        { key: 'active', label: '已启用', value: active },
        { key: 'banner', label: 'Banner 数', value: banners },
        { key: 'sort', label: '最高排序', value: maxSort }
      ];
    }
  },
  watch: {
    dialogVisible(val) {
      if (!val) this.resetForm();
    }
  },
  created() { this.load(); },
  methods: {
    async load() {
      this.loading = true;
      try {
        const res = await api.adminHomeOperationConfigs();
        this.list = Array.isArray(res) ? res : res?.records || res?.data || [];
      } finally {
        this.loading = false;
      }
    },
    resetToFirstPage() {
      this.currentPage = 1;
    },
    syncPage(page) {
      this.currentPage = page;
    },
    resetForm() {
      this.form = emptyForm();
      this.editingId = null;
      if (this.$refs.formRef) this.$refs.formRef.clearValidate();
    },
    typeLabel(type) {
      const map = { banner: 'Banner', module: '模块', topic: '专题', all: '全部' };
      return map[type] || type || '未分类';
    },
    targetLabel(row) {
      const type = row?.targetType || 'route';
      const value = row?.targetValue || row?.linkUrl || '-';
      const map = { url: '链接', brand: '品牌', product: '商品', category: '分类', route: '路由' };
      return `${map[type] || '路由'} · ${value}`;
    },
    openCreate() {
      this.editingId = null;
      this.form = emptyForm();
      this.dialogVisible = true;
    },
    openEdit(row) {
      this.editingId = row.id;
      this.form = { ...emptyForm(), ...row };
      this.dialogVisible = true;
    },
    cloneRow(row) {
      this.editingId = null;
      this.form = { ...emptyForm(), ...row, title: `${row.title}（复制）` };
      this.dialogVisible = true;
    },
    async submitForm() {
      this.$refs.formRef.validate(async valid => {
        if (!valid) return;
        this.saving = true;
        try {
          const payload = { ...this.form, sortOrder: Number(this.form.sortOrder || 0), status: Number(this.form.status || 0) };
          if (this.editingId) {
            await api.adminHomeOperationConfigUpdate(this.editingId, payload);
            pushAdminLog({ module: 'home', action: 'update', content: `编辑首页配置【${payload.title}】`, target: `配置 #${this.editingId}`, risky: false, meta: payload });
            this.$message.success('配置已更新');
          } else {
            const res = await api.adminHomeOperationConfigCreate(payload);
            const id = res?.id || res?.data?.id || 'new';
            pushAdminLog({ module: 'home', action: 'create', content: `新增首页配置【${payload.title}】`, target: `配置 #${id}`, risky: false, meta: payload });
            this.$message.success('配置已新增');
          }
          this.dialogVisible = false;
          await this.load();
        } finally {
          this.saving = false;
        }
      });
    },
    async seedDemo() {
      this.loadingSeed = true;
      try {
        for (const item of demoConfigs) {
          await api.adminHomeOperationConfigCreate(item);
        }
        pushAdminLog({ module: 'home', action: 'seed', content: '新增首页配置示例数据', target: 'home_operation_config', risky: false, meta: { count: demoConfigs.length } });
        this.$message.success('示例数据已添加');
        await this.load();
      } finally {
        this.loadingSeed = false;
      }
    },
    async toggleStatus(row) {
      const next = Number(row.status) === 1 ? 0 : 1;
      await api.adminHomeOperationConfigUpdate(row.id, { ...row, status: next });
      pushAdminLog({ module: 'home', action: 'status', content: `${next === 1 ? '启用' : '停用'}首页配置【${row.title}】`, target: `配置 #${row.id}`, risky: false, meta: { status: next } });
      this.$message.success(next === 1 ? '已启用' : '已停用');
      await this.load();
    },
    async moveRow(row, direction) {
      const currentIndex = this.list.findIndex(item => item.id === row.id);
      const targetIndex = currentIndex + direction;
      if (currentIndex < 0 || targetIndex < 0 || targetIndex >= this.list.length) return;
      const target = this.list[targetIndex];
      const currentSort = Number(row.sortOrder || 0);
      const targetSort = Number(target.sortOrder || 0);
      await Promise.all([
        api.adminHomeOperationConfigUpdate(row.id, { ...row, sortOrder: targetSort }),
        api.adminHomeOperationConfigUpdate(target.id, { ...target, sortOrder: currentSort })
      ]);
      pushAdminLog({ module: 'home', action: 'sort', content: `调整首页配置排序【${row.title}】`, target: `配置 #${row.id}`, risky: false, meta: { direction } });
      this.$message.success('排序已调整');
      await this.load();
    },
    beforeUpload(file) {
      const isImage = /^image\//.test(file.type);
      if (!isImage) this.$message.error('只能上传图片文件');
      return isImage;
    },
    async onUpload(options) {
      this.uploading = true;
      try {
        const uploaded = await api.uploadFile(options.file);
        const url = uploaded?.url || uploaded?.data?.url || uploaded?.fileUrl || uploaded?.data?.fileUrl || '';
        if (url) {
          this.form.imageUrl = url;
          this.$message.success('图片上传成功');
        } else {
          this.$message.warning('上传成功，但未返回图片地址');
        }
      } finally {
        this.uploading = false;
      }
    },
    async removeRow(row) {
      try {
        await this.$confirm(`确认删除配置「${row.title}」吗？`, '提示', { type: 'warning' });
      } catch (e) {
        if (e === 'cancel' || e === 'close') return;
      }
      await api.adminHomeOperationConfigDelete(row.id);
      pushAdminLog({ module: 'home', action: 'delete', content: `删除首页配置【${row.title}】`, target: `配置 #${row.id}`, risky: true });
      this.$message.success('配置已删除');
      await this.load();
    }
  }
};
</script>

<style scoped>
.admin-home-config-page { display:grid; gap:18px; }
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
.panel-toolbar { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:14px; }
.toolbar-right { display:flex; align-items:center; gap:12px; flex-wrap:wrap; justify-content:flex-end; }
.panel-hint { color:#8a94a6; font-size:12px; }
.link-text { color:#3b82f6; }
.action-wrap { display:flex; flex-wrap:wrap; gap:6px; }
.pagination-wrap { margin-top:18px; display:flex; justify-content:flex-end; }
.config-form :deep(.el-form-item) { margin-bottom:18px; }
.image-field { display:flex; gap:10px; align-items:center; }
.upload-trigger { flex:none; }
.form-tip { margin-top:8px; color:#8a94a6; font-size:12px; line-height:1.6; }
.dialog-preview { margin-top:16px; padding-top:16px; border-top:1px dashed #e7eaf0; }
.dialog-preview__title { font-size:13px; font-weight:700; color:#3a4256; margin-bottom:10px; }
.dialog-preview__card { display:flex; gap:12px; align-items:stretch; border:1px solid #eef1f6; border-radius:14px; overflow:hidden; background:#fff; }
.dialog-preview__img { width:190px; height:126px; object-fit:cover; background:#f5f6f8; }
.dialog-preview__meta { padding:12px; display:flex; flex-direction:column; gap:8px; }
.dialog-preview__chip { width:max-content; padding:4px 10px; border-radius:999px; background:#fff3f7; color:#ff5f92; font-size:11px; font-weight:800; }
.dialog-preview__name { font-size:16px; font-weight:800; color:#1f2033; }
.dialog-preview__sub, .dialog-preview__link { font-size:13px; color:#7e8798; line-height:1.6; }
@media (max-width: 1100px) { .hero-head, .panel-toolbar { flex-direction:column; align-items:flex-start; } .hero-actions, .toolbar-right { justify-content:flex-start; } }
@media (max-width: 768px) { .mini-stat strong { font-size:20px; } .dialog-preview__card { flex-direction:column; } .dialog-preview__img { width:100%; height:180px; } }
</style>