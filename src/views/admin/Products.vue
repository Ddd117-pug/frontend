<template>
  <div class="admin-products-page">
    <el-card class="hero-card" shadow="never">
      <div class="hero-head">
        <div>
          <div class="hero-badge">PRODUCT OPS</div>
          <h2 class="hero-title">商品管理</h2>
          <p class="hero-desc">支持商品新增、编辑、上下架、删除、按品牌筛选，并在列表与详情中联动展示品牌信息，满足完整后台商品管理场景。</p>
        </div>
        <div class="hero-actions">
          <el-button @click="categoryDialogVisible = true">分类管理</el-button>
          <el-button type="primary" @click="openCreate">新增商品</el-button>
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
          <p>支持按商品名、分类、品牌与状态查询。</p>
        </div>
        <el-form :inline="true" :model="query" class="query-form" @submit.native.prevent="load">
          <el-form-item><el-input v-model="query.keyword" placeholder="搜索商品名 / 副标题" clearable @keyup.enter.native="load" /></el-form-item>
          <el-form-item>
            <el-select v-model="query.categoryId" clearable placeholder="分类" @change="load">
              <el-option v-for="item in categories" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="query.brandId" clearable placeholder="品牌" @change="load">
              <el-option v-for="item in brands" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="query.status" clearable placeholder="状态" @change="load">
              <el-option label="上架" :value="1" />
              <el-option label="下架" :value="0" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="load">查询</el-button>
            <el-button @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table :data="list" border stripe v-loading="loading" empty-text="暂无商品数据">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="封面" width="92">
          <template slot-scope="s">
            <img :src="resolveAssetUrl(s.row.coverUrl) || fallback" class="cover-thumb" />
          </template>
        </el-table-column>
        <el-table-column prop="name" label="商品名" min-width="180" />
        <el-table-column label="品牌" min-width="140">
          <template slot-scope="s">
            <div class="brand-cell">
              <strong>{{ brandName(s.row.brandId) }}</strong>
              <span>{{ brandCode(s.row.brandId) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="分类" width="120">
          <template slot-scope="s">{{ categoryName(s.row.categoryId) }}</template>
        </el-table-column>
        <el-table-column label="类型" width="100">
          <template slot-scope="s">
            <el-tag :type="Number(s.row.isBlindBox) === 1 ? 'warning' : 'info'">{{ Number(s.row.isBlindBox) === 1 ? '盲盒商品' : '普通商品' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="价格" width="110">
          <template slot-scope="s">￥{{ money(s.row.price) }}</template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="90" />
        <el-table-column prop="saleCount" label="销量" width="90" />
        <el-table-column label="状态" width="100">
          <template slot-scope="s"><el-tag :type="Number(s.row.status) === 1 ? 'success' : 'info'">{{ Number(s.row.status) === 1 ? '上架' : '下架' }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="360" fixed="right">
          <template slot-scope="s">
            <el-button size="mini" type="info" plain @click="openDetail(s.row)">详情</el-button>
            <el-button size="mini" type="primary" @click="openEdit(s.row)">编辑</el-button>
            <el-button size="mini" type="success" @click="setStatus(s.row, 1)">上架</el-button>
            <el-button size="mini" @click="setStatus(s.row, 0)">下架</el-button>
            <el-button size="mini" type="danger" plain @click="removeProduct(s.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrap">
        <el-pagination background layout="prev, pager, next, total" :total="total" :page-size="query.pageSize" :current-page.sync="query.pageNum" @current-change="load" />
      </div>
    </el-card>

    <el-dialog :title="editingId ? '编辑商品' : '新增商品'" :visible.sync="productDialogVisible" width="760px">
      <el-form :model="form" label-width="100px" class="product-form">
        <el-form-item label="商品名"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="品牌">
          <el-select v-model="form.brandId" placeholder="请选择品牌" filterable style="width:100%;">
            <el-option v-for="item in brands" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
          <div class="form-tip">当前选择：{{ brandName(form.brandId) || '未选择品牌' }}</div>
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.categoryId" placeholder="请选择分类" filterable style="width:100%;">
            <el-option v-for="item in categories" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="副标题"><el-input v-model="form.subTitle" /></el-form-item>
        <el-form-item label="商品类型">
          <el-radio-group v-model="form.isBlindBox" @change="handleProductTypeChange">
            <el-radio :label="0">普通商品</el-radio>
            <el-radio :label="1">盲盒商品</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="商品封面">
          <div class="upload-block">
            <input ref="coverInput" type="file" accept="image/*" class="hidden-file-input" @change="handleCoverUpload" />
            <div class="upload-actions">
              <el-button type="primary" plain @click="triggerCoverUpload">上传封面</el-button>
              <el-button v-if="form.coverUrl" @click="clearCover">清空封面</el-button>
            </div>
            <div v-if="form.coverUrl" class="upload-preview-single"><img :src="resolveAssetUrl(form.coverUrl)" alt="cover" class="upload-preview-image" /></div>
          </div>
        </el-form-item>
        <el-form-item label="轮播图">
          <div class="upload-block">
            <input ref="bannerInput" type="file" accept="image/*" multiple class="hidden-file-input" @change="handleBannerUpload" />
            <div class="upload-actions">
              <el-button type="primary" plain @click="triggerBannerUpload">上传轮播图</el-button>
              <el-button v-if="bannerList.length" @click="clearBanners">清空轮播图</el-button>
            </div>
            <div v-if="bannerList.length" class="upload-preview-grid">
              <div v-for="(item, index) in bannerList" :key="index" class="upload-preview-card">
                <img :src="resolveAssetUrl(item)" :alt="`banner-${index}`" class="upload-preview-image" />
                <button type="button" class="preview-remove" @click="removeBanner(index)">删除</button>
              </div>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="详情图">
          <div class="upload-block">
            <input ref="detailImageInput" type="file" accept="image/*" multiple class="hidden-file-input" @change="handleDetailImageUpload" />
            <div class="upload-actions">
              <el-button type="primary" plain @click="triggerDetailImageUpload">上传详情图</el-button>
              <el-button v-if="detailImageList.length" @click="clearDetailImages">清空详情图</el-button>
            </div>
            <div v-if="detailImageList.length" class="upload-preview-grid">
              <div v-for="(item, index) in detailImageList" :key="`detail-${index}`" class="upload-preview-card">
                <img :src="resolveAssetUrl(item)" :alt="`detail-${index}`" class="upload-preview-image" />
                <button type="button" class="preview-remove" @click="removeDetailImage(index)">删除</button>
              </div>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="材质"><el-input v-model="form.material" /></el-form-item>
        <el-form-item label="尺寸"><el-input v-model="form.size" /></el-form-item>
        <el-form-item label="价格"><el-input-number v-model="form.price" :min="0" :precision="2" /></el-form-item>
        <el-form-item label="原价"><el-input-number v-model="form.originalPrice" :min="0" :precision="2" /></el-form-item>
        <el-form-item label="库存"><el-input-number v-model="form.stock" :min="0" /></el-form-item>
        <el-form-item label="销量"><el-input-number v-model="form.saleCount" :min="0" /></el-form-item>
        <el-form-item label="商品标签">
          <el-checkbox v-model="form.isHot" :true-label="1" :false-label="0">热门</el-checkbox>
          <el-checkbox v-model="form.isNew" :true-label="1" :false-label="0">新品</el-checkbox>
        </el-form-item>
        <template v-if="form.isBlindBox === 1">
          <el-form-item label="款式描述"><el-input v-model="form.styleDesc" placeholder="如：随机1个 不支持7天无理由退换货；整盒12个 不支持7天无理由退换货" /></el-form-item>
          <el-form-item label="盲盒说明"><el-input v-model="form.blindBoxInfo" type="textarea" :rows="3" placeholder="如：随机发货，不支持指定款式；整盒12个端盒发货" /></el-form-item>
        </template>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">上架</el-radio>
            <el-radio :label="0">下架</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="商品详情"><el-input v-model="form.description" type="textarea" :rows="5" /></el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="productDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitProduct">保存</el-button>
      </span>
    </el-dialog>

    <el-dialog title="商品详情" :visible.sync="detailDialogVisible" width="900px">
      <div v-if="detailProduct" class="detail-panel">
        <div class="detail-hero">
          <img :src="resolveAssetUrl(detailProduct.coverUrl) || fallback" class="detail-cover" />
          <div class="detail-hero__meta">
            <h3>{{ detailProduct.name }}</h3>
            <p>{{ detailProduct.subTitle || '暂无副标题' }}</p>
            <div class="detail-tags">
              <el-tag type="warning">{{ Number(detailProduct.isBlindBox) === 1 ? '盲盒商品' : '普通商品' }}</el-tag>
              <el-tag type="success">{{ Number(detailProduct.status) === 1 ? '上架' : '下架' }}</el-tag>
              <el-tag effect="plain">分类：{{ categoryName(detailProduct.categoryId) }}</el-tag>
            </div>
          </div>
        </div>

        <el-row :gutter="12" class="detail-metrics">
          <el-col :span="6" v-for="item in detailMetrics" :key="item.key">
            <div class="detail-stat">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </div>
          </el-col>
        </el-row>

        <div class="detail-section">
          <div class="section-head">
            <div>
              <h3>品牌信息</h3>
              <p>商品与品牌联动展示，便于查看商品归属。</p>
            </div>
            <div class="section-head__badge section-head__badge--soft">BRAND</div>
          </div>
          <div class="brand-info-card">
            <div class="brand-info-card__avatar">{{ brandName(detailProduct.brandId)?.charAt(0) || 'B' }}</div>
            <div class="brand-info-card__meta">
              <strong>{{ brandName(detailProduct.brandId) || '未设置品牌' }}</strong>
              <span>{{ brandCode(detailProduct.brandId) }}</span>
              <p>{{ brandInfo(detailProduct.brandId) }}</p>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <div class="section-head">
            <div>
              <h3>商品图集</h3>
              <p>封面、轮播图和详情图统一展示。</p>
            </div>
            <div class="section-head__badge">GALLERY</div>
          </div>
          <div class="gallery-grid">
            <div v-if="detailProduct.coverUrl" class="gallery-item"><img :src="resolveAssetUrl(detailProduct.coverUrl)" /></div>
            <div v-for="(img, index) in detailBanners" :key="`b-${index}`" class="gallery-item"><img :src="resolveAssetUrl(img)" /></div>
            <div v-for="(img, index) in detailImages" :key="`d-${index}`" class="gallery-item"><img :src="resolveAssetUrl(img)" /></div>
          </div>
        </div>

        <div class="detail-section">
          <div class="section-head">
            <div>
              <h3>商品说明</h3>
              <p>商品详情与盲盒信息。</p>
            </div>
            <div class="section-head__badge">INFO</div>
          </div>
          <div class="detail-copy">{{ detailProduct.description || '暂无详情说明' }}</div>
          <div v-if="Number(detailProduct.isBlindBox) === 1" class="blindbox-note">
            <strong>盲盒说明</strong>
            <p>{{ detailProduct.blindBoxInfo || '暂无盲盒说明' }}</p>
            <span>{{ detailProduct.styleDesc || '暂无款式描述' }}</span>
          </div>
        </div>
      </div>
    </el-dialog>

    <el-dialog title="分类管理" :visible.sync="categoryDialogVisible" width="760px">
      <div class="category-toolbar">
        <el-button type="primary" size="mini" @click="openCategoryCreate">新增分类</el-button>
      </div>
      <el-table :data="categories" border>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="name" label="分类名" />
        <el-table-column prop="sortOrder" label="排序" width="90" />
        <el-table-column label="状态" width="100">
          <template slot-scope="s"><el-tag :type="Number(s.row.status) === 1 ? 'success' : 'info'">{{ Number(s.row.status) === 1 ? '启用' : '停用' }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="iconUrl" label="图标链接" />
        <el-table-column label="操作" width="180">
          <template slot-scope="s">
            <el-button size="mini" type="primary" @click="openCategoryEdit(s.row)">编辑</el-button>
            <el-button size="mini" type="danger" plain @click="removeCategory(s.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-divider />
      <el-form :model="categoryForm" label-width="90px">
        <el-form-item label="分类名称"><el-input v-model="categoryForm.name" /></el-form-item>
        <el-form-item label="父级ID"><el-input-number v-model="categoryForm.parentId" :min="0" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="categoryForm.sortOrder" :min="0" /></el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="categoryForm.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="图标链接"><el-input v-model="categoryForm.iconUrl" /></el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="resetCategoryForm">清空</el-button>
        <el-button type="primary" @click="submitCategory">{{ categoryEditingId ? '更新分类' : '新增分类' }}</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { api } from "../../api";
import { resolveAssetUrl } from "../../utils/asset";

const REMOVED_CATEGORY_NAME = "即将开售";
const emptyProduct = () => ({ name: "", brandId: null, categoryId: null, subTitle: "", description: "", coverUrl: "", bannerUrls: "", detailImageUrls: "", price: 0, originalPrice: 0, stock: 0, saleCount: 0, material: "", size: "", isBlindBox: 0, blindBoxInfo: "", styleDesc: "", isHot: 0, isNew: 0, status: 1 });
const emptyCategory = () => ({ name: "", parentId: 0, sortOrder: 0, status: 1, iconUrl: "" });

export default {
  data() {
    return {
      fallback: "https://dummyimage.com/120x120/f2f2f2/999&text=Toy",
      query: { keyword: "", categoryId: null, brandId: null, status: null, pageNum: 1, pageSize: 10 },
      list: [],
      total: 0,
      categories: [],
      brands: [],
      productDialogVisible: false,
      categoryDialogVisible: false,
      detailDialogVisible: false,
      editingId: null,
      categoryEditingId: null,
      form: emptyProduct(),
      categoryForm: emptyCategory(),
      bannerList: [],
      detailImageList: [],
      detailProduct: null,
      detailBanners: [],
      detailImages: []
    };
  },
  computed: {
    overviewCards() {
      const total = this.total;
      const onSale = this.list.filter(item => Number(item.status) === 1).length;
      const blindBox = this.list.filter(item => Number(item.isBlindBox) === 1).length;
      const brandCount = new Set(this.list.map(item => item.brandId).filter(Boolean)).size;
      return [
        { key: 'total', label: '商品总数', value: total },
        { key: 'sale', label: '上架商品', value: onSale },
        { key: 'blind', label: '盲盒商品', value: blindBox },
        { key: 'brand', label: '关联品牌', value: brandCount }
      ];
    },
    detailMetrics() {
      const p = this.detailProduct || {};
      return [
        { key: 'price', label: '销售价', value: `￥${this.money(p.price)}` },
        { key: 'origin', label: '原价', value: `￥${this.money(p.originalPrice)}` },
        { key: 'stock', label: '库存', value: p.stock ?? 0 },
        { key: 'sale', label: '销量', value: p.saleCount ?? 0 }
      ];
    }
  },
  async created() {
    await Promise.all([this.loadBrands(), this.loadCategories(), this.load()]);
  },
  methods: {
    resolveAssetUrl,
    money(v) { const n = Number(v || 0); return Number.isNaN(n) ? '0.00' : n.toFixed(2); },
    brandName(id) { return this.brands.find(v => Number(v.id) === Number(id))?.name || '-'; },
    brandCode(id) { return this.brands.find(v => Number(v.id) === Number(id))?.initial || ''; },
    brandInfo(id) { return this.brands.find(v => Number(v.id) === Number(id))?.description || '暂无品牌简介'; },
    categoryName(id) { return this.categories.find(v => Number(v.id) === Number(id))?.name || '-'; },
    async load() {
      this.loading = true;
      try {
        const res = await api.adminProducts(this.query);
        this.list = res.records || [];
        this.total = res.total || 0;
      } finally {
        this.loading = false;
      }
    },
    async loadCategories() {
      const categories = await api.adminCategories();
      this.categories = (categories || []).filter(item => item.name !== REMOVED_CATEGORY_NAME);
    },
    async loadBrands() {
      const res = await api.adminBrands();
      this.brands = Array.isArray(res) ? res : res?.records || [];
    },
    resetQuery() {
      this.query = { keyword: "", categoryId: null, brandId: null, status: null, pageNum: 1, pageSize: 10 };
      this.load();
    },
    openCreate() {
      this.editingId = null;
      this.form = emptyProduct();
      this.bannerList = [];
      this.detailImageList = [];
      this.productDialogVisible = true;
    },
    handleProductTypeChange(value) {
      if (Number(value) !== 1) {
        this.form.styleDesc = "";
        this.form.blindBoxInfo = "";
      }
    },
    triggerCoverUpload() { this.$refs.coverInput && this.$refs.coverInput.click(); },
    async handleCoverUpload(event) {
      const file = event.target.files && event.target.files[0]; if (!file) return;
      try { const res = await api.uploadFile(file); this.form.coverUrl = res.url || res.data?.url || ''; this.$message.success('封面上传成功'); } finally { event.target.value = ''; }
    },
    clearCover() { this.form.coverUrl = ''; },
    triggerBannerUpload() { this.$refs.bannerInput && this.$refs.bannerInput.click(); },
    triggerDetailImageUpload() { this.$refs.detailImageInput && this.$refs.detailImageInput.click(); },
    async handleBannerUpload(event) {
      const files = Array.from(event.target.files || []); if (!files.length) return;
      try { const uploaded = await Promise.all(files.map(file => api.uploadFile(file).then(res => res.url || res.data?.url || '').catch(() => ''))); this.bannerList = this.bannerList.concat(uploaded.filter(Boolean)); this.form.bannerUrls = this.bannerList.join(','); this.$message.success('轮播图上传成功'); } finally { event.target.value = ''; }
    },
    async handleDetailImageUpload(event) {
      const files = Array.from(event.target.files || []); if (!files.length) return;
      try { const uploaded = await Promise.all(files.map(file => api.uploadFile(file).then(res => res.url || res.data?.url || '').catch(() => ''))); this.detailImageList = this.detailImageList.concat(uploaded.filter(Boolean)); this.form.detailImageUrls = this.detailImageList.join(','); this.$message.success('详情图上传成功'); } finally { event.target.value = ''; }
    },
    removeBanner(index) { this.bannerList.splice(index, 1); this.form.bannerUrls = this.bannerList.join(','); },
    removeDetailImage(index) { this.detailImageList.splice(index, 1); this.form.detailImageUrls = this.detailImageList.join(','); },
    clearBanners() { this.bannerList = []; this.form.bannerUrls = ''; },
    clearDetailImages() { this.detailImageList = []; this.form.detailImageUrls = ''; },
    async openEdit(row) {
      this.editingId = row.id;
      const detail = await api.adminProductDetail(row.id);
      const data = detail?.data || detail || row;
      this.form = { ...emptyProduct(), ...data };
      this.bannerList = this.form.bannerUrls ? String(this.form.bannerUrls).split(',').map(item => item.trim()).filter(Boolean) : [];
      this.detailImageList = this.form.detailImageUrls ? String(this.form.detailImageUrls).split(',').map(item => item.trim()).filter(Boolean) : [];
      this.productDialogVisible = true;
    },
    async openDetail(row) {
      const detail = await api.adminProductDetail(row.id);
      const data = detail?.data || detail || row;
      this.detailProduct = data;
      this.detailBanners = String(data.bannerUrls || '').split(',').map(v => v.trim()).filter(Boolean);
      this.detailImages = String(data.detailImageUrls || '').split(',').map(v => v.trim()).filter(Boolean);
      this.detailDialogVisible = true;
    },
    async submitProduct() {
      if (!String(this.form.name || '').trim()) return this.$message.warning('请填写商品名');
      if (!this.form.brandId) return this.$message.warning('请选择品牌');
      if (!this.form.categoryId) return this.$message.warning('请选择商品分类');
      if (this.form.price === null || this.form.price === undefined) return this.$message.warning('请填写商品价格');
      this.form.bannerUrls = this.bannerList.join(',');
      this.form.detailImageUrls = this.detailImageList.join(',');
      const payload = { ...this.form, isBlindBox: Number(this.form.isBlindBox) || 0, brandId: Number(this.form.brandId) || null };
      if (payload.isBlindBox !== 1) { payload.styleDesc = ''; payload.blindBoxInfo = ''; }
      if (this.editingId) { await api.adminProductUpdate(this.editingId, payload); this.$message.success('商品已更新'); }
      else { await api.adminProductAdd(payload); this.$message.success('商品已新增'); }
      this.productDialogVisible = false;
      await this.load();
    },
    async setStatus(row, status) { await api.adminProductStatus(row.id, status); this.$message.success('状态已更新'); await this.load(); },
    async removeProduct(row) { try { await this.$confirm(`确认删除商品「${row.name}」吗？`, '提示', { type: 'warning' }); } catch (e) { if (e === 'cancel' || e === 'close') return; } await api.adminProductDelete(row.id); this.$message.success('商品已删除'); await this.load(); },
    openCategoryCreate() { this.categoryEditingId = null; this.categoryForm = emptyCategory(); },
    openCategoryEdit(row) { this.categoryEditingId = row.id; this.categoryForm = { ...row }; },
    resetCategoryForm() { this.openCategoryCreate(); },
    async submitCategory() { if (this.categoryEditingId) { await api.adminCategoryUpdate(this.categoryEditingId, this.categoryForm); this.$message.success('分类已更新'); } else { await api.adminCategoryAdd(this.categoryForm); this.$message.success('分类已新增'); } await this.loadCategories(); this.openCategoryCreate(); },
    async removeCategory(row) { try { await this.$confirm(`确认删除分类「${row.name}」吗？`, '提示', { type: 'warning' }); } catch (e) { if (e === 'cancel' || e === 'close') return; } await api.adminCategoryDelete(row.id); this.$message.success('分类已删除'); await this.loadCategories(); }
  }
};
</script>

<style scoped>
.admin-products-page { display:grid; gap:18px; }
.hero-card, .panel-card { border:1px solid #eef1f6; border-radius:18px; background:linear-gradient(135deg,#ffffff 0%,#fbfcff 100%); }
.hero-head, .panel-toolbar { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; }
.hero-badge { display:inline-flex; padding:7px 12px; border-radius:999px; background:#eef6ff; color:#3b82f6; font-size:11px; font-weight:800; letter-spacing:1.2px; }
.hero-title { margin:10px 0 0; font-size:28px; font-weight:900; color:#202536; }
.hero-desc { margin:8px 0 0; color:#7b8395; line-height:1.7; max-width:860px; }
.hero-actions { display:flex; gap:10px; flex-wrap:wrap; }
.hero-stats { margin-top:16px; }
.mini-stat { border:1px solid #eef1f6; border-radius:16px; background:linear-gradient(135deg,#fff,#fbfcff); padding:14px 16px; }
.mini-stat span { display:block; color:#7b8395; font-size:12px; }
.mini-stat strong { display:block; margin-top:8px; color:#202536; font-size:24px; font-weight:900; }
.panel-title-block h3 { margin:0; color:#202536; font-size:18px; font-weight:900; }
.panel-title-block p { margin:6px 0 0; color:#7b8395; font-size:13px; }
.query-form { display:flex; flex-wrap:wrap; gap:0 10px; margin-bottom:-18px; }
.cover-thumb, .detail-cover { width:52px; height:52px; object-fit:cover; border-radius:10px; border:1px solid #e4eaf4; }
.brand-cell strong { display:block; color:#202536; }
.brand-cell span { display:block; color:#7b8395; font-size:12px; margin-top:4px; }
.upload-block { display:grid; gap:12px; }
.upload-actions { display:flex; flex-wrap:wrap; gap:10px; }
.hidden-file-input { display:none; }
.upload-preview-single { width:132px; height:132px; border-radius:16px; overflow:hidden; border:1px solid #e4eaf4; background:#fff; }
.upload-preview-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(120px,1fr)); gap:12px; }
.upload-preview-card { position:relative; border-radius:16px; overflow:hidden; border:1px solid #e4eaf4; background:#fff; padding:6px; }
.upload-preview-image { width:100%; height:120px; object-fit:cover; border-radius:12px; display:block; }
.preview-remove { position:absolute; right:12px; bottom:12px; border:none; border-radius:999px; padding:4px 10px; background:rgba(37,42,61,.82); color:#fff; font-size:12px; cursor:pointer; }
.pagination-wrap { margin-top:18px; display:flex; justify-content:flex-end; }
.product-form :deep(.el-form-item) { margin-bottom:18px; }
.form-tip { margin-top:8px; color:#7b8395; font-size:12px; }
.detail-panel { display:grid; gap:16px; }
.detail-hero { display:flex; gap:14px; align-items:center; padding:18px; border-radius:18px; background:linear-gradient(135deg,#fff7f2 0%,#f8fbff 100%); border:1px solid #f0e7ea; }
.detail-cover { width:96px; height:96px; border-radius:16px; }
.detail-hero__meta h3 { margin:0; color:#1c2434; font-size:20px; }
.detail-hero__meta p { margin:6px 0 0; color:#7b8395; }
.detail-tags { display:flex; gap:8px; flex-wrap:wrap; margin-top:10px; }
.detail-metrics { margin-top:4px; }
.detail-stat, .brand-info-card, .detail-section { border:1px solid #eef1f6; border-radius:16px; background:#fff; }
.detail-stat { padding:14px 16px; }
.detail-stat span { display:block; color:#7b8395; font-size:12px; }
.detail-stat strong { display:block; margin-top:8px; color:#202536; font-size:18px; font-weight:900; }
.detail-section { padding:16px; background:linear-gradient(135deg,#fff,#f8fbff); }
.section-head { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:12px; }
.section-head h3 { margin:0; color:#202536; font-size:18px; font-weight:900; }
.section-head p { margin:6px 0 0; color:#7b8395; font-size:13px; }
.section-head__badge { display:inline-flex; padding:8px 12px; border-radius:999px; background:#fff3f7; color:#ff5f92; font-size:12px; font-weight:800; }
.section-head__badge--soft { background:#eef6ff; color:#3b82f6; }
.brand-info-card { display:flex; gap:14px; align-items:flex-start; padding:16px; }
.brand-info-card__avatar { width:58px; height:58px; border-radius:16px; display:grid; place-items:center; background:linear-gradient(135deg,#ff7a5c,#4f7cff); color:#fff; font-weight:900; font-size:22px; }
.brand-info-card__meta strong { display:block; color:#202536; font-size:16px; }
.brand-info-card__meta span { display:block; margin-top:4px; color:#7b8395; font-size:12px; }
.brand-info-card__meta p { margin:8px 0 0; color:#5f6878; line-height:1.7; }
.gallery-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(140px,1fr)); gap:12px; }
.gallery-item { border-radius:14px; overflow:hidden; border:1px solid #e8eef6; background:#fff; min-height:140px; }
.gallery-item img { width:100%; height:100%; object-fit:cover; display:block; }
.detail-copy { color:#3a4256; line-height:1.8; white-space:pre-wrap; }
.blindbox-note { margin-top:14px; padding:14px 16px; border-radius:14px; background:#fff7f2; border:1px solid #f4e1d8; }
.blindbox-note strong { display:block; color:#1f2033; }
.blindbox-note p, .blindbox-note span { display:block; margin-top:8px; color:#5f6878; line-height:1.7; }
.category-toolbar { margin-bottom:12px; display:flex; justify-content:flex-end; }
@media (max-width: 1100px) { .hero-head, .panel-toolbar { flex-direction:column; } .hero-actions { justify-content:flex-start; } }
</style>