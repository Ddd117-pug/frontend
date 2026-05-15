<template>
  <section class="user-center-page mall-surface-page">
    <div class="user-hero mall-hover-lift">
      <div class="profile-block">
        <div class="avatar-wrap">
          <div class="avatar-circle">
            <img v-if="profileForm.avatarUrl" :src="profileForm.avatarUrl" alt="avatar" class="avatar-image" />
            <i v-else class="el-icon-user-solid"></i>
          </div>
          <input ref="avatarInput" type="file" accept="image/*" class="hidden-file-input" @change="handleAvatarUpload" />
          <el-button size="mini" type="primary" class="upload-btn" @click="triggerAvatarUpload">上传头像</el-button>
        </div>
        <div class="profile-meta">
          <div class="profile-chip">USER CENTER · TOY COLLECTOR</div>
          <h1 class="profile-name">{{ profileForm.username || "潮玩玩家" }}</h1>
          <div class="profile-phone">手机号：{{ profileForm.phone || "暂未绑定手机号" }}</div>
        </div>
      </div>
      <div class="asset-panel">
        <div class="asset-card">
          <span>账户余额</span>
          <strong>¥{{ displayBalance }}</strong>
          <div class="asset-actions">
            <el-button size="mini" type="primary" @click="openRechargeDialog">充值余额</el-button>
          </div>
        </div>
        <div class="asset-card asset-card-accent">
          <span>潮玩积分</span>
          <strong>{{ displayPoints }}</strong>
          <div class="asset-actions">
            <el-button size="mini" type="warning" @click="openPointsDialog">积分兑换</el-button>
          </div>
        </div>
      </div>
    </div>

    <div class="user-center-layout">
      <aside class="sidebar-card mall-hover-lift">
        <div class="sidebar-title">功能导航</div>
        <button v-for="item in menus" :key="item.key" class="sidebar-item" :class="{ active: currentMenuKey === item.key }" @click="switchMenu(item.key)">
          <span class="sidebar-item__icon">{{ item.icon }}</span><span>{{ item.label }}</span>
        </button>
      </aside>

      <section class="content-card mall-hover-lift">
        <div class="content-head">
          <div><div class="content-chip">MODULE PANEL</div><h2 class="content-title">{{ currentMenuLabel }}</h2></div>
        </div>

        <div v-if="currentMenuKey === 'profile'" class="form-card">
          <div class="form-card__head"><h3>基本信息</h3><p>维护你的邮箱、手机号、性别和头像信息。</p></div>
          <el-form ref="profileFormRef" :model="profileForm" :rules="profileRules" label-width="98px" class="rounded-form">
            <el-form-item label="用户名"><el-input v-model="profileForm.username" disabled /></el-form-item>
            <el-form-item label="手机号" prop="phone">
              <div class="inline-row">
                <el-input v-model="profileForm.phone" :disabled="!phoneEditable" class="inline-input" placeholder="请输入手机号" />
                <el-button plain @click="togglePhoneEdit">{{ phoneEditable ? '完成编辑' : '编辑手机号' }}</el-button>
              </div>
            </el-form-item>
            <el-form-item label="邮箱" prop="email"><el-input v-model="profileForm.email" placeholder="请输入邮箱" /></el-form-item>
            <el-form-item label="性别" prop="gender">
              <el-select v-model="profileForm.gender" placeholder="请选择性别" class="full-width">
                <el-option label="男" :value="1" /><el-option label="女" :value="2" /><el-option label="保密" :value="0" />
              </el-select>
            </el-form-item>
            <el-form-item label="头像">
              <div class="inline-row">
                <el-button type="primary" plain @click="triggerAvatarUpload">上传头像</el-button>
                <el-input v-model="profileForm.avatarUrl" placeholder="请输入头像 URL 或使用左侧上传按钮" />
              </div>
            </el-form-item>
            <el-form-item><el-button type="primary" @click="saveProfile">保存信息</el-button></el-form-item>
          </el-form>
          <div class="account-danger-zone">
            <div><h4>注销账号</h4><p>注销后将清空当前登录状态，该操作不可恢复，请谨慎确认。</p></div>
            <button class="danger-btn" :disabled="cancelLoading" @click="handleCancelAccount">{{ cancelLoading ? '注销中...' : '注销账号' }}</button>
          </div>
        </div>

        <div v-else-if="currentMenuKey === 'password'" class="form-card password-card">
          <div class="form-card__head"><h3>修改密码</h3><p>建议定期更新密码，保护账号与订单信息安全。</p></div>
          <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="112px" class="rounded-form">
            <el-form-item label="旧密码" prop="oldPassword"><el-input v-model="passwordForm.oldPassword" type="password" show-password placeholder="请输入旧密码" /></el-form-item>
            <el-form-item label="新密码" prop="newPassword"><el-input v-model="passwordForm.newPassword" type="password" show-password placeholder="请输入不少于 6 位的新密码" /></el-form-item>
            <el-form-item label="确认新密码" prop="confirmPassword"><el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" /></el-form-item>
            <el-form-item><el-button type="primary" @click="changePassword">修改密码</el-button></el-form-item>
          </el-form>
        </div>

        <div v-else-if="currentMenuKey === 'address'" class="module-embed module-embed-address">
          <AddressesPanel />
        </div>

        <div v-else-if="currentMenuKey === 'favorite'" class="module-embed module-embed-favorite">
          <FavoritesPanel />
        </div>

        <div v-else-if="currentMenuKey === 'order'" class="module-embed module-embed-order">
          <OrdersPanel :embedded-in-user-center="true" :on-refund-click="switchToRefund" @go-refund="switchToRefund" />
        </div>

        <div v-else-if="currentMenuKey === 'refund'" class="form-card refund-card">
          <div class="form-card__head">
            <h3>售后退款</h3>
            <p>用户可提交退款原因，管理员审核后完成退款处理，便于查看售后申请进度。</p>
          </div>

          <div class="refund-summary">
            <div class="refund-stat">
              <span>待审核</span>
              <strong>{{ pendingAfterSales.length }}</strong>
            </div>
            <div class="refund-stat refund-stat-accent">
              <span>已处理</span>
              <strong>{{ processedAfterSales.length }}</strong>
            </div>
          </div>

          <el-empty v-if="!afterSales.length" description="当前还没有提交任何售后申请" />

          <div v-else class="refund-list">
            <article v-for="item in afterSales" :key="item.id" class="refund-item">
              <div class="refund-item__main">
                <div class="refund-item__top">
                  <div>
                    <div class="refund-order-no">订单号：{{ item.orderNo }}</div>
                    <div class="refund-order-time">申请时间：{{ formatOrderTime(item.createdAt || item.appliedAt) }}</div>
                  </div>
                  <el-tag :type="afterSaleTagType(item.status)">{{ afterSaleStatusText(item.status) }}</el-tag>
                </div>
                <div class="refund-item__meta">
                  <span>原因：{{ item.reason || '未填写' }}</span>
                  <span v-if="item.reply">处理意见：{{ item.reply }}</span>
                </div>
              </div>
              <div class="refund-item__actions">
                <el-button plain size="mini" @click="openAfterSaleOrderDetail(item.orderId)">查看订单</el-button>
              </div>
            </article>
          </div>

          <div class="refund-apply-block">
            <div class="refund-apply-head">
              <h4>可申请售后的订单</h4>
              <p>仅已支付或已发货订单可提交售后申请，每笔订单保留一条有效售后记录。</p>
            </div>
            <el-empty v-if="!availableRefundOrders.length" description="暂无可申请售后的订单" />
            <div v-else class="refund-list compact">
              <article v-for="order in availableRefundOrders" :key="order.id" class="refund-item">
                <div class="refund-item__main">
                  <div class="refund-order-no">订单号：{{ order.orderNo }}</div>
                  <div class="refund-item__meta">
                    <span>金额：￥{{ formatMoney(order.totalAmount) }}</span>
                    <span>状态：{{ refundPayTypeText(order.payType) }}</span>
                  </div>
                </div>
                <div class="refund-item__actions">
                  <el-button type="danger" size="mini" @click="openAfterSaleDialog(order)">申请售后</el-button>
                </div>
              </article>
            </div>
          </div>
        </div>

        <div v-else class="placeholder-card">
          <div class="placeholder-icon">✨</div><h3>{{ currentMenuLabel }}</h3><p>这个模块先保留展示位，当前优先完成个人信息、余额和积分能力。</p>
        </div>
      </section>
    </div>

    <el-dialog title="余额充值" :visible.sync="rechargeDialogVisible" width="420px">
      <div class="recharge-note">请选择支付方式并填写充值金额。</div>
      <div class="recharge-methods">
        <button
          v-for="item in rechargeMethods"
          :key="item.value"
          type="button"
          class="recharge-method"
          :class="{ active: rechargeMethod === item.value }"
          @click="rechargeMethod = item.value"
        >
          <span class="recharge-method__title">{{ item.label }}</span>
          <span class="recharge-method__sub">{{ item.desc }}</span>
        </button>
      </div>
      <div class="recharge-quick-actions">
        <el-button v-for="item in quickRechargeOptions" :key="item" @click="selectRechargeAmount(item)">¥{{ item }}</el-button>
      </div>
      <el-input v-model="rechargeAmount" type="number" min="0.01" placeholder="请输入充值金额" />
      <span slot="footer">
        <el-button @click="rechargeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="rechargeLoading" @click="submitRecharge">立即充值</el-button>
      </span>
    </el-dialog>

    <el-dialog title="积分兑换" :visible.sync="pointsDialogVisible" width="460px">
      <div class="points-panel">
        <div class="points-rule-card">
          <div class="points-rule-title">潮玩积分规则</div>
          <p>确认收货后，按订单实付金额取整发放积分，例如消费 ¥128.90 可获得 128 积分。</p>
          <p>积分可按 <b>100 积分 = ¥1.00 余额</b> 兑换，兑换后余额可用于订单余额支付。</p>
        </div>
        <div class="points-current">当前可用积分：<b>{{ displayPoints }}</b></div>
        <el-input v-model="exchangePoints" type="number" min="100" step="100" placeholder="请输入 100 的整数倍" />
        <div class="points-exchange-preview">预计到账余额：¥{{ exchangeAmountPreview }}</div>
      </div>
      <span slot="footer">
        <el-button @click="pointsDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="pointsExchangeLoading" @click="submitPointsExchange">确认兑换</el-button>
      </span>
    </el-dialog>

    <el-dialog title="提交售后申请" :visible.sync="afterSaleDialogVisible" width="520px">
      <div class="recharge-note">请填写本次退款原因，管理员审核后会更新售后状态。</div>
      <el-input v-model="afterSaleReason" type="textarea" :rows="4" maxlength="120" show-word-limit placeholder="例如：商品有瑕疵 / 不想要了 / 收到后与预期不符" />
      <span slot="footer">
        <el-button @click="afterSaleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="!!applyingOrderId" @click="submitAfterSale">提交申请</el-button>
      </span>
    </el-dialog>
  </section>
</template>

<script>
import { api } from "../../api";
import AddressesPanel from "./Addresses.vue";
import FavoritesPanel from "./Favorites.vue";
import OrdersPanel from "../mall/Orders.vue";
const emptyProfile = () => ({ username: "", phone: "", email: "", balance: 0, points: 0, avatarUrl: "", gender: 0 });
const emptyPassword = () => ({ oldPassword: "", newPassword: "", confirmPassword: "" });
export default {
  name: "UserCenter",
  components: { AddressesPanel, FavoritesPanel, OrdersPanel },
  data() {
    const validatePhone = (rule, value, callback) => {
      if (!value) return callback(new Error("请输入手机号"));
      if (!/^1\d{10}$/.test(value)) return callback(new Error("手机号格式不正确"));
      callback();
    };
    const validateConfirmPassword = (rule, value, callback) => {
      if (!value) return callback(new Error("请确认新密码"));
      if (value !== this.passwordForm.newPassword) return callback(new Error("两次输入的新密码不一致"));
      callback();
    };
    return {
      activeMenu: "profile", profileForm: emptyProfile(), passwordForm: emptyPassword(), phoneEditable: false, cancelLoading: false, rechargeDialogVisible: false, rechargeLoading: false, rechargeAmount: "", rechargeMethod: "wechat", quickRechargeOptions: [50, 100, 200, 500], rechargeMethods: [{ value: "wechat", label: "微信支付", desc: "使用微信方式完成余额充值" }, { value: "alipay", label: "支付宝", desc: "使用支付宝方式完成余额充值" }],
      pointsDialogVisible: false, pointsExchangeLoading: false, exchangePoints: "",
      afterSales: [], refundOrders: [], refundSubmittingId: null, applyingOrderId: null, afterSaleReason: "", afterSaleDialogVisible: false, currentAfterSaleOrder: null,
      menus: [
        { key: "profile", label: "基本信息", icon: "👤" }, { key: "password", label: "修改密码", icon: "🔒" },
        { key: "address", label: "管理收货地址", icon: "📍" }, { key: "favorite", label: "我的收藏", icon: "💖" },
        { key: "order", label: "我的订单", icon: "📦" }, { key: "refund", label: "售后退款", icon: "🧾" }
      ],
      profileRules: { phone: [{ validator: validatePhone, trigger: "blur" }], email: [{ required: true, message: "请输入邮箱", trigger: "blur" }], gender: [{ required: true, message: "请选择性别", trigger: "change" }] },
      passwordRules: { oldPassword: [{ required: true, message: "请输入旧密码", trigger: "blur" }], newPassword: [{ required: true, message: "请输入新密码", trigger: "blur" }, { min: 6, message: "新密码不少于 6 位", trigger: "blur" }], confirmPassword: [{ validator: validateConfirmPassword, trigger: "blur" }] }
    };
  },
  computed: {
    currentMenuKey() {
      const tab = this.$route.query.tab;
      if (this.menus.some(item => item.key === tab)) return tab;
      return this.activeMenu || "profile";
    },
    currentMenuLabel() { const current = this.menus.find(item => item.key === this.currentMenuKey); return current ? current.label : "基本信息"; },
    activeMenuLabel() { const current = this.menus.find(item => item.key === this.activeMenu); return current ? current.label : "基本信息"; },
    displayBalance() { const value = Number(this.profileForm.balance || 0); return Number.isNaN(value) ? "0.00" : value.toFixed(2); },
    displayPoints() { return Number(this.profileForm.points || 0) || 0; },
    exchangeAmountPreview() {
      const points = Number(this.exchangePoints || 0);
      if (!points || points < 0) return "0.00";
      return (Math.floor(points / 100) || 0).toFixed(2);
    },
    pendingAfterSales() { return this.afterSales.filter(item => Number(item.status) === 0); },
    processedAfterSales() { return this.afterSales.filter(item => Number(item.status) !== 0); },
    availableRefundOrders() {
      const activeOrderIds = this.afterSales.filter(item => [0, 1, 3].includes(Number(item.status))).map(item => Number(item.orderId));
      return this.refundOrders.filter(item => this.canRefund(item) && !activeOrderIds.includes(Number(item.id)));
    }
  },
  async created() {
    await Promise.all([this.loadProfile(), this.loadRefundOrders(), this.loadAfterSales()]);
    this.syncMenuFromRoute();
    this.openRefundDialogFromRoute();
  },
  watch: {
    '$route.query.tab': {
      immediate: true,
      handler() {
        this.syncMenuFromRoute();
        this.$nextTick(() => this.openRefundDialogFromRoute());
      }
    },
    '$route.query.orderId': {
      immediate: true,
      handler() {
        this.$nextTick(() => this.openRefundDialogFromRoute());
      }
    }
  },
  methods: {
    syncMenuFromRoute() {
      const tab = this.$route.query.tab;
      if (this.menus.some(item => item.key === tab)) {
        this.activeMenu = tab;
      }
    },
    switchMenu(key) {
      this.activeMenu = key;
      const nextQuery = { ...this.$route.query };
      if (key === "profile") {
        delete nextQuery.tab;
        delete nextQuery.orderId;
      } else {
        nextQuery.tab = key;
        if (key !== "refund") delete nextQuery.orderId;
      }
      this.$router.replace({ path: this.$route.path, query: nextQuery }).catch(() => {});
    },
    openRefundDialogFromRoute() {
      if (this.currentMenuKey !== "refund") return;
      const orderId = Number(this.$route.query.orderId) || Number(sessionStorage.getItem("mall-refund-order-id"));
      if (!orderId) return;
      const target = this.refundOrders.find(item => Number(item.id) === orderId);
      if (target) {
        this.openAfterSaleDialog(target);
        sessionStorage.removeItem("mall-refund-order-id");
      }
    },
    async loadProfile() {
      const me = (await api.me()) || {};
      this.profileForm = { username: me.username || "", phone: me.phone || "", email: me.email || "", balance: me.balance || 0, points: me.points || 0, avatarUrl: me.avatarUrl || "", gender: me.gender === undefined || me.gender === null ? 0 : me.gender };
    },
    async loadRefundOrders() {
      const res = await api.orderList({ pageNum: 1, pageSize: 50 });
      this.refundOrders = (res.records || []).filter(item => [1, 2, 3, 4].includes(Number(item.status)));
    },
    async loadAfterSales() {
      this.afterSales = (await api.myAfterSales()) || [];
    },
    formatMoney(value) {
      const amount = Number(value || 0);
      return Number.isNaN(amount) ? "0.00" : amount.toFixed(2);
    },
    afterSaleStatusText(status) {
      return ({ 0: "待审核", 1: "已通过", 2: "已驳回", 3: "已退款" })[Number(status)] || "未知状态";
    },
    afterSaleTagType(status) {
      return ({ 0: "warning", 1: "", 2: "danger", 3: "success" })[Number(status)] || "info";
    },
    openAfterSaleDialog(order) {
      this.currentAfterSaleOrder = order;
      this.afterSaleReason = "";
      this.afterSaleDialogVisible = true;
    },
    switchToRefund(order) {
      const query = { ...this.$route.query, tab: "refund", t: Date.now() };
      if (order && order.id) {
        query.orderId = order.id;
        sessionStorage.setItem("mall-refund-order-id", String(order.id));
      }
      const targetUrl = `${window.location.origin}/mall/profile?tab=refund${order && order.id ? `&orderId=${order.id}` : ""}&t=${query.t}`;
      this.activeMenu = "refund";
      this.$nextTick(() => {
        if (order) {
          this.openAfterSaleDialog(order);
        }
      });
      if (this.$route.path === "/mall/profile") {
        this.$router.replace({ path: "/mall/profile", query }).catch(() => {
          window.location.assign(targetUrl);
        });
        return;
      }
      window.location.assign(targetUrl);
    },
    async openAfterSaleOrderDetail(orderId) {
      try {
        const detail = await api.orderDetail(orderId);
        const lines = (detail.items || []).map(item => `${item.productName}${item.styleOption ? `（${item.styleOption}）` : ""} × ${item.quantity} = ￥${item.amount}`);
        await this.$alert(lines.join("<br/>") || "暂无订单明细", "订单明细", { dangerouslyUseHTMLString: true });
      } catch (e) {
        if (e === "cancel" || e === "close") return;
      }
    },
    async submitAfterSale() {
      if (!this.currentAfterSaleOrder || !String(this.afterSaleReason || "").trim()) {
        return this.$message.warning("请先填写售后原因");
      }
      this.applyingOrderId = this.currentAfterSaleOrder.id;
      try {
        await api.applyAfterSale(this.currentAfterSaleOrder.id, { reason: this.afterSaleReason.trim() });
        this.$message.success("售后申请已提交，等待管理员审核");
        this.afterSaleDialogVisible = false;
        await Promise.all([this.loadAfterSales(), this.loadRefundOrders()]);
      } catch (e) {
        this.$message.error(e?.message || "售后申请提交失败");
      } finally {
        this.applyingOrderId = null;
      }
    },
    refundPayTypeText(type) {
      return ({ 0: "余额支付", 1: "微信支付", 2: "支付宝支付" })[type] || "待选择";
    },
    canRefund(order) {
      return [1, 2, 3].includes(Number(order.status));
    },
    async saveProfile() {
      await this.$refs.profileFormRef.validate();
      await api.updateMe({ phone: this.profileForm.phone, email: this.profileForm.email, avatarUrl: this.profileForm.avatarUrl, gender: this.profileForm.gender });
      this.phoneEditable = false; this.$message.success("修改成功"); await this.loadProfile();
    },
    triggerAvatarUpload() { this.$refs.avatarInput && this.$refs.avatarInput.click(); },
    handleAvatarUpload(event) {
      const file = event.target.files && event.target.files[0]; if (!file) return;
      const reader = new FileReader(); reader.onload = e => { this.profileForm.avatarUrl = e.target.result; this.$message.success("头像预览已更新"); }; reader.readAsDataURL(file); event.target.value = "";
    },
    togglePhoneEdit() { this.phoneEditable = !this.phoneEditable; if (this.phoneEditable) this.$message.info("现在可以直接修改手机号了"); },
    openRechargeDialog() { this.rechargeAmount = ""; this.rechargeMethod = "wechat"; this.rechargeDialogVisible = true; },
    openPointsDialog() { this.exchangePoints = this.displayPoints >= 100 ? String(Math.floor(this.displayPoints / 100) * 100) : ""; this.pointsDialogVisible = true; },
    selectRechargeAmount(amount) { this.rechargeAmount = String(amount); },
    async submitRecharge() {
      const amount = Number(this.rechargeAmount);
      if (!amount || amount <= 0) return this.$message.warning("请输入正确的充值金额");
      this.rechargeLoading = true;
      try {
        await api.recharge({ amount });
        const methodText = this.rechargeMethod === "alipay" ? "支付宝（模拟）" : "微信支付（模拟）";
        const nextBalance = (Number(this.profileForm.balance || 0) + amount).toFixed(2);
        this.$message.success(`${methodText}充值成功，当前余额 ¥${nextBalance}`);
        await this.$alert(`已通过${methodText}完成充值。<br/>系统已成功入账，可用于订单支付。<br/>当前余额：<b>¥${nextBalance}</b>`, "充值完成", {
          dangerouslyUseHTMLString: true,
          confirmButtonText: "知道了"
        });
        this.rechargeDialogVisible = false;
        await this.loadProfile();
      } finally {
        this.rechargeLoading = false;
      }
    },
    async submitPointsExchange() {
      const points = Number(this.exchangePoints);
      if (!points || points < 100) return this.$message.warning("至少需要兑换 100 积分");
      if (points % 100 !== 0) return this.$message.warning("兑换积分必须是 100 的整数倍");
      if (points > this.displayPoints) return this.$message.warning("当前积分不足");
      this.pointsExchangeLoading = true;
      try {
        await api.exchangePoints({ points });
        const amount = (points / 100).toFixed(2);
        this.$message.success(`兑换成功，${points} 积分已兑换为 ¥${amount} 余额`);
        this.pointsDialogVisible = false;
        await this.loadProfile();
      } finally {
        this.pointsExchangeLoading = false;
      }
    },
    async changePassword() {
      await this.$refs.passwordFormRef.validate();
      if (this.passwordForm.oldPassword === this.passwordForm.newPassword) return this.$message.warning("新旧密码不能一致");
      await api.changePassword({ oldPassword: this.passwordForm.oldPassword, newPassword: this.passwordForm.newPassword });
      this.$message.success("修改成功"); this.passwordForm = emptyPassword(); this.$nextTick(() => this.$refs.passwordFormRef && this.$refs.passwordFormRef.clearValidate());
    },
    async handleCancelAccount() {
      const passphrase = "确认注销";
      try {
        await this.$confirm("注销后将清空当前账号登录状态，该操作不可恢复。确认继续吗？", "危险操作确认", { type: "warning", confirmButtonText: "继续", cancelButtonText: "取消" });
        const { value } = await this.$prompt(`请输入“${passphrase}”以完成最终确认`, "二次确认", { confirmButtonText: "立即注销", cancelButtonText: "我再想想", inputPlaceholder: passphrase, inputValidator: input => input === passphrase, inputErrorMessage: `请输入“${passphrase}”` });
        if (value !== passphrase) return;
      } catch (e) { if (e === "cancel" || e === "close") return; return; }
      this.cancelLoading = true;
      try { await api.cancelAccount(); this.$store.commit("CLEAR_AUTH"); this.$message.success("账号已注销"); this.$router.push("/login"); } finally { this.cancelLoading = false; }
    }
  }
};
</script>

<style scoped>
.user-center-page,.asset-panel{display:grid}.user-center-page{gap:22px}.user-hero,.sidebar-card,.content-card{position:relative;overflow:hidden;border-radius:28px;border:1px solid var(--mall-card-border);box-shadow:var(--mall-shadow)}.user-hero{display:grid;grid-template-columns:1.2fr .8fr;gap:24px;padding:30px;background:var(--mall-soft-card)}.profile-block{display:flex;align-items:center;gap:20px}.avatar-wrap{display:grid;justify-items:center;gap:12px}.avatar-circle{width:108px;height:108px;border-radius:50%;display:grid;place-items:center;overflow:hidden;background:linear-gradient(135deg,rgba(255,255,255,.95) 0%,rgba(255,242,239,.98) 100%);box-shadow:0 16px 30px rgba(255,122,92,.16);color:#ff7a5c;font-size:40px}.avatar-image{width:100%;height:100%;object-fit:cover}.hidden-file-input{display:none}.profile-chip,.content-chip{display:inline-flex;align-items:center;padding:8px 14px;border-radius:999px;background:rgba(255,255,255,.76);color:#ff6f7d;font-size:11px;font-weight:800;letter-spacing:1.5px}.profile-name,.content-title,.sidebar-title{color:var(--mall-text);font-weight:900}.profile-name{margin:16px 0 0;font-size:34px}.profile-phone{margin-top:12px;color:var(--mall-subtext)}.asset-panel{gap:14px;align-content:center}.asset-card{padding:22px;border-radius:24px;background:rgba(255,255,255,.78)}.asset-actions{margin-top:14px}.recharge-note{margin-bottom:12px;color:#8a94a6;font-size:13px;line-height:1.7}.recharge-methods{display:grid;gap:10px;margin-bottom:14px}.recharge-method{width:100%;padding:14px 16px;border:1px solid #f0dfe2;border-radius:16px;background:#fff;text-align:left;cursor:pointer;transition:all .2s ease}.recharge-method.active{border-color:#ff8d80;background:linear-gradient(135deg,rgba(255,122,92,.08) 0%,rgba(255,181,93,.12) 100%);box-shadow:0 10px 22px rgba(255,122,92,.12)}.recharge-method__title{display:block;color:#252a3d;font-size:14px;font-weight:800}.recharge-method__sub{display:block;margin-top:6px;color:#8a94a6;font-size:12px}.recharge-quick-actions{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:14px}.asset-card strong{display:block;margin-top:10px;font-size:30px;color:var(--mall-text)}.points-panel{display:grid;gap:14px}.points-rule-card{padding:16px 18px;border-radius:18px;background:linear-gradient(135deg,#fff8f2 0%,#f3fcff 100%);border:1px solid #f0e7ea}.points-rule-title{color:#252a3d;font-weight:900;margin-bottom:8px}.points-rule-card p{margin:6px 0;color:#697386;font-size:13px;line-height:1.8}.points-current,.points-exchange-preview{color:#5d6579;font-size:14px}.points-current b{color:#252a3d;font-size:18px}.asset-card-accent{background:linear-gradient(135deg,rgba(255,122,92,.12) 0%,rgba(255,181,93,.18) 100%)}.user-center-layout{display:grid;grid-template-columns:260px minmax(0,1fr);gap:22px}.sidebar-card,.content-card{background:var(--mall-card-bg);padding:24px}.sidebar-title{margin-bottom:16px;font-size:20px}.sidebar-item{width:100%;display:flex;align-items:center;gap:12px;padding:14px 16px;border:none;border-radius:18px;background:transparent;color:#5d6579;font-size:14px;font-weight:700;cursor:pointer;text-align:left}.sidebar-item+.sidebar-item{margin-top:10px}.sidebar-item.active{background:linear-gradient(90deg,#ff7a5c 0%,#ff8d80 46%,#ffb65d 100%);color:#fff}.content-head{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:22px}.content-title{margin:14px 0 0;font-size:30px}.form-card,.placeholder-card,.module-embed{padding:24px;border-radius:24px;background:linear-gradient(135deg,#fffaf6 0%,#fffefe 56%,#f7fbff 100%)}.form-card__head h3,.placeholder-card h3{margin:0;color:var(--mall-text);font-size:22px;font-weight:900}.form-card__head p,.placeholder-card p,.content-tip{margin:10px 0 0;color:var(--mall-subtext);font-size:13px;line-height:1.8}.rounded-form{margin-top:22px}.rounded-form :deep(.el-input__inner),.rounded-form :deep(.el-select .el-input__inner){border-radius:14px;min-height:44px;border-color:#f0dfe2;box-shadow:none}.full-width{width:100%}.inline-row{display:flex;gap:12px;align-items:center}.inline-input{flex:1}.account-danger-zone{margin-top:22px;padding:20px 22px;border-radius:22px;background:linear-gradient(135deg,rgba(255,245,245,.96) 0%,rgba(255,238,241,.98) 52%,rgba(255,247,242,.96) 100%);display:flex;align-items:center;justify-content:space-between;gap:18px}.account-danger-zone h4{margin:0;color:#b63846}.danger-btn{min-width:132px;height:42px;padding:0 18px;border:none;border-radius:999px;background:linear-gradient(90deg,#ff5f6d 0%,#ff7b66 42%,#ff9d5c 100%);color:#fff;font-weight:900;cursor:pointer}.password-card{max-width:760px}.placeholder-card{min-height:360px;display:grid;place-items:center;text-align:center}.placeholder-icon{font-size:42px}.module-embed{padding:0;background:transparent}.module-embed :deep(.card){border:none;box-shadow:none;background:transparent;padding:0}.module-embed :deep(.page-title){margin:0 0 8px!important}.refund-card{display:grid;gap:18px}.refund-summary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.refund-stat{padding:18px 20px;border-radius:20px;background:rgba(255,255,255,.78);box-shadow:inset 0 0 0 1px #f0e7ea}.refund-stat span{color:#8a94a6;font-size:13px}.refund-stat strong{display:block;margin-top:8px;color:#252a3d;font-size:28px;font-weight:900}.refund-stat-accent{background:linear-gradient(135deg,rgba(255,122,92,.1) 0%,rgba(255,181,93,.16) 100%)}.refund-list{display:grid;gap:14px}.refund-item{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:18px 20px;border-radius:22px;background:linear-gradient(135deg,#fff8f3 0%,#fffcfe 56%,#f3fbff 100%);box-shadow:inset 0 0 0 1px #f0ebef}.refund-item__main{flex:1;min-width:0}.refund-item__top{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.refund-order-no{color:#252a3d;font-size:16px;font-weight:900}.refund-order-time{margin-top:8px;color:#8a94a6;font-size:12px}.refund-item__meta{display:flex;flex-wrap:wrap;gap:14px;margin-top:12px;color:#616a7c;font-size:13px}.refund-item__actions{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end}@media (max-width:1100px){.user-hero,.user-center-layout{grid-template-columns:1fr}}@media (max-width:760px){.user-hero,.sidebar-card,.content-card,.form-card,.placeholder-card,.module-embed{padding:20px;border-radius:22px}.profile-block,.content-head,.inline-row,.account-danger-zone,.refund-item,.refund-item__top{display:grid}.profile-name{font-size:28px}.content-title{font-size:26px}.refund-summary{grid-template-columns:1fr}}
</style>
