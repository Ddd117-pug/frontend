<template>
  <div class="card">
    <div class="address-header">
      <div>
        <h3 class="page-title" style="margin-bottom: 8px;">收货地址管理</h3>
        <div class="address-tip">维护常用收货地址，下单时可直接选择默认地址。</div>
      </div>
      <el-button type="primary" @click="openCreate">新增地址</el-button>
    </div>

    <el-empty v-if="!list.length" description="暂未添加收货地址" />

    <div v-else class="address-grid">
      <el-card v-for="item in list" :key="item.id" shadow="hover" class="address-card">
        <div class="address-card__head">
          <div>
            <span class="address-name">{{ item.receiverName }}</span>
            <span class="address-phone">{{ item.receiverPhone }}</span>
          </div>
          <el-tag v-if="item.isDefault === 1" size="mini" type="success">默认地址</el-tag>
        </div>
        <div class="address-text">{{ fullAddress(item) }}</div>
        <div class="address-postal" v-if="item.postalCode">邮编：{{ item.postalCode }}</div>
        <div class="address-actions">
          <el-button type="text" @click="openEdit(item)">编辑</el-button>
          <el-button v-if="item.isDefault !== 1" type="text" @click="setDefault(item)">设为默认</el-button>
          <el-button type="text" class="danger-text" @click="remove(item)">删除</el-button>
        </div>
      </el-card>
    </div>

    <el-dialog :title="editingId ? '编辑地址' : '新增地址'" :visible.sync="dialogVisible" width="560px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="92px">
        <el-form-item label="收货人" prop="receiverName"><el-input v-model="form.receiverName" /></el-form-item>
        <el-form-item label="手机号" prop="receiverPhone"><el-input v-model="form.receiverPhone" /></el-form-item>
        <el-form-item label="地址信息" prop="regionPath">
          <el-cascader
            v-model="form.regionPath"
            :options="regionOptions"
            :props="regionProps"
            placeholder="请选择省/市/区/街道"
            class="full-width"
            clearable
            filterable
          />
        </el-form-item>
        <el-form-item label="详细地址" prop="detail">
          <el-input v-model="form.detail" type="textarea" :rows="3" placeholder="请输入详细地址信息，如道路、门牌号、小区、楼栋号、单元等信息" />
        </el-form-item>
        <el-form-item label="邮编"><el-input v-model="form.postalCode" /></el-form-item>
        <el-form-item label="默认地址"><el-switch v-model="defaultFlag" /></el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">保存</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { api } from "../../api";
import { regionData } from "element-china-area-data";

const emptyForm = () => ({
  receiverName: "",
  receiverPhone: "",
  regionPath: [],
  province: "",
  city: "",
  district: "",
  detail: "",
  postalCode: ""
});

const findRegionLabel = (options, valuePath = []) => {
  let currentOptions = options;
  const labels = [];
  for (const value of valuePath) {
    const matched = (currentOptions || []).find(item => item.value === value || item.label === value);
    if (!matched) return valuePath;
    labels.push(matched.label);
    currentOptions = matched.children || [];
  }
  return labels;
};

const findRegionValuePath = (options, labels = []) => {
  let currentOptions = options;
  const values = [];
  for (const label of labels.filter(Boolean)) {
    const matched = (currentOptions || []).find(item => item.label === label || item.value === label);
    if (!matched) return labels.filter(Boolean);
    values.push(matched.value);
    currentOptions = matched.children || [];
  }
  return values;
};

export default {
  data() {
    return {
      list: [],
      dialogVisible: false,
      editingId: null,
      defaultFlag: false,
      form: emptyForm(),
      regionOptions: regionData,
      regionProps: { expandTrigger: "hover" },
      rules: {
        receiverName: [{ required: true, message: "请输入收货人", trigger: "blur" }],
        receiverPhone: [
          { required: true, message: "请输入手机号", trigger: "blur" },
          { pattern: /^1\d{10}$/, message: "手机号格式不正确", trigger: "blur" }
        ],
        regionPath: [{ type: "array", required: true, min: 3, message: "请选择省/市/区", trigger: "change" }],
        detail: [
          { required: true, message: "请输入详细地址", trigger: "blur" },
          { min: 2, max: 120, message: "详细地址长度需要在2-120个汉字或字符，不能包含表情符号", trigger: "blur" },
          { pattern: /^[\u4e00-\u9fa5a-zA-Z0-9\s#\-号栋幢单元室层楼弄巷村路街道小区院]+$/, message: "详细地址不能包含表情符号或特殊字符", trigger: "blur" }
        ]
      }
    };
  },
  async created() {
    await this.load();
  },
  methods: {
    async load() {
      this.list = await api.addressList();
    },
    fullAddress(item) {
      return [item.province, item.city, item.district, item.detail].filter(Boolean).join(" ");
    },
    resetForm() {
      this.form = emptyForm();
      this.editingId = null;
      this.defaultFlag = false;
      this.$nextTick(() => this.$refs.formRef && this.$refs.formRef.clearValidate());
    },
    openCreate() {
      this.resetForm();
      this.dialogVisible = true;
    },
    openEdit(item) {
      this.editingId = item.id;
      this.defaultFlag = item.isDefault === 1;
      this.form = {
        receiverName: item.receiverName || "",
        receiverPhone: item.receiverPhone || "",
        regionPath: findRegionValuePath(this.regionOptions, [item.province, item.city, item.district]),
        province: item.province || "",
        city: item.city || "",
        district: item.district || "",
        detail: item.detail || "",
        postalCode: item.postalCode || ""
      };
      this.dialogVisible = true;
      this.$nextTick(() => this.$refs.formRef && this.$refs.formRef.clearValidate());
    },
    async submit() {
      await this.$refs.formRef.validate();
      const [province = "", city = "", district = ""] = findRegionLabel(this.regionOptions, this.form.regionPath || []);
      const payload = {
        ...this.form,
        province,
        city,
        district,
        detail: this.form.detail.trim(),
        isDefault: this.defaultFlag ? 1 : 0
      };
      delete payload.regionPath;
      if (this.editingId) {
        await api.updateAddress(this.editingId, payload);
        this.$message.success("地址已更新");
      } else {
        await api.addAddress(payload);
        this.$message.success("地址已添加");
      }
      this.dialogVisible = false;
      await this.load();
    },
    async setDefault(item) {
      await api.setDefaultAddress(item.id);
      this.$message.success("默认地址已更新");
      await this.load();
    },
    async remove(item) {
      try {
        await this.$confirm("删除后不可恢复，确认删除该地址吗？", "提示", { type: "warning" });
      } catch (e) {
        if (e === "cancel" || e === "close") return;
      }
      await api.deleteAddress(item.id);
      this.$message.success("地址已删除");
      await this.load();
    }
  }
};
</script>

<style scoped>
.full-width {
  width: 100%;
}

.address-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.address-tip {
  color: #8a94a6;
  font-size: 13px;
}

.address-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.address-card {
  border-radius: 14px;
}

.address-card__head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.address-name {
  font-size: 16px;
  font-weight: 700;
  margin-right: 10px;
}

.address-phone {
  color: #5f6b7c;
}

.address-text {
  color: #2f3a4c;
  line-height: 1.7;
  min-height: 48px;
}

.address-postal {
  margin-top: 8px;
  color: #8a94a6;
  font-size: 13px;
}

.address-actions {
  margin-top: 12px;
  display: flex;
  gap: 12px;
}

.danger-text {
  color: #f56c6c;
}
</style>
