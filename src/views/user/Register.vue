<template>
  <div class="auth-wrap">
    <div class="bg-grid"></div>
    <div class="orb orb-pink"></div>
    <div class="orb orb-yellow"></div>
    <div class="orb orb-cyan"></div>

    <div class="auth-shell">
      <section class="brand-stage">
        <div class="stage-topline">ART TOY · LIMITED DROP · COLLECT NOW</div>

        <div class="brand-mark">
          <div class="mark-badge">T</div>
          <div class="mark-text">
            <div class="cn">潮玩商城</div>
            <div class="en">TOY POP UNIVERSE</div>
          </div>
        </div>

        <h1 class="hero-title">
          开启你的
          <span>潮玩收藏旅程</span>
        </h1>

        <p class="hero-desc">
          创建账号后即可收藏心仪单品、管理订单、解锁你的潮玩世界。像真正的潮玩品牌官网一样，开始你的探索与收集。
        </p>

        <div class="stage-cards">
          <article class="promo-card large-card pink-card">
            <div class="promo-label">JOIN NOW</div>
            <div class="promo-title">成为会员</div>
            <div class="promo-text">领取你的专属身份入口，第一时间查看限定新品与人气热卖。</div>
            <div class="toy toy-bear"></div>
          </article>

          <div class="mini-card-stack">
            <article class="promo-card mini-card yellow-card">
              <div class="promo-label">NEW USER</div>
              <div class="promo-title">新人大礼</div>
            </article>
            <article class="promo-card mini-card cyan-card">
              <div class="promo-label">FAST ACCESS</div>
              <div class="promo-title">快捷下单</div>
            </article>
          </div>
        </div>
      </section>

      <section class="auth-panel">
        <div class="panel-decoration"></div>
        <div class="panel-chip alt-chip">JOIN TOY POP</div>
        <div class="panel-title">创建你的潮玩账号</div>
        <div class="panel-subtitle">注册后即可查看商品、收藏与订单信息</div>

        <el-form :model="form" class="auth-form" @submit.native.prevent>
          <div class="field-label">用户名</div>
          <el-form-item>
            <el-input v-model="form.username" placeholder="请输入用户名" class="toy-input" />
          </el-form-item>

          <div class="field-label">密码</div>
          <el-form-item>
            <el-input v-model="form.password" type="password" placeholder="请输入 6-20 位密码" show-password class="toy-input" />
          </el-form-item>

          <div class="field-label">手机号</div>
          <el-form-item>
            <el-input v-model="form.phone" placeholder="请输入手机号" class="toy-input" />
          </el-form-item>

          <div class="field-label">邮箱</div>
          <el-form-item>
            <el-input v-model="form.email" placeholder="请输入邮箱，用于找回密码" class="toy-input" />
          </el-form-item>

          <el-button class="primary-btn" @click="onRegister">立即注册</el-button>
        </el-form>

        <div class="switch-box">
          <div>
            <div class="switch-box-title">已经有账号？</div>
            <div class="switch-box-desc">返回登录页，继续你的潮玩探索。</div>
          </div>
          <button class="switch-btn" @click="$router.push('/login')">去登录</button>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { api } from "../../api";

export default {
  data() {
    return {
      form: { username: "", password: "", phone: "", email: "" }
    };
  },
  methods: {
    async onRegister() {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!String(this.form.email || "").trim()) {
        return this.$message.warning("请输入邮箱，邮箱将用于找回密码");
      }
      if (!emailPattern.test(String(this.form.email || "").trim())) {
        return this.$message.warning("请输入正确的邮箱格式");
      }
      await api.register({ ...this.form, email: this.form.email.trim() });
      this.$message.success("注册成功，请登录");
      if (this.$route.path !== "/login") {
        this.$router.push("/login");
      }
    }
  }
};
</script>

<style scoped>
.auth-wrap {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 34px;
  background: linear-gradient(135deg, #fff7ef 0%, #fff2f6 34%, #eefcff 100%);
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(255, 255, 255, 0.65) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.65) 1px, transparent 1px);
  background-size: 36px 36px;
  opacity: 0.35;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(24px);
  opacity: 0.55;
}

.orb-pink { width: 260px; height: 260px; top: 70px; left: -40px; background: #ff76b0; }
.orb-yellow { width: 220px; height: 220px; right: 6%; top: 8%; background: #ffcb47; }
.orb-cyan { width: 280px; height: 280px; right: -60px; bottom: 30px; background: #72e6ff; }

.auth-shell {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1240px;
  display: grid;
  grid-template-columns: 1.15fr 0.78fr;
  gap: 30px;
  align-items: center;
}

.brand-stage { padding: 12px 8px 12px 0; }
.stage-topline { font-size: 12px; font-weight: 700; letter-spacing: 2.5px; color: #ff5f91; margin-bottom: 18px; }
.brand-mark { display: flex; align-items: center; gap: 16px; margin-bottom: 26px; }
.mark-badge { width: 74px; height: 74px; border-radius: 22px; background: linear-gradient(135deg, #ff5d90 0%, #ff8c42 52%, #ffd24d 100%); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 34px; font-weight: 900; box-shadow: 0 18px 34px rgba(255, 116, 123, 0.28); }
.mark-text .cn { font-size: 34px; line-height: 1.1; font-weight: 900; color: #1f2033; }
.mark-text .en { margin-top: 6px; font-size: 13px; letter-spacing: 2px; color: #7d8698; font-weight: 700; }
.hero-title { margin: 0; font-size: 78px; line-height: 0.96; font-weight: 900; letter-spacing: -2px; color: #1a1a2b; }
.hero-title span { display: block; margin-top: 10px; background: linear-gradient(90deg, #ff5f93 0%, #ff9d42 55%, #17cfff 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.hero-desc { max-width: 580px; margin: 28px 0 30px; font-size: 16px; line-height: 1.95; color: #52596b; }
.stage-cards { display: grid; grid-template-columns: 1.1fr 0.82fr; gap: 18px; max-width: 720px; }
.mini-card-stack { display: grid; gap: 18px; }
.promo-card { position: relative; overflow: hidden; border-radius: 28px; box-shadow: 0 18px 42px rgba(36, 35, 63, 0.12); }
.large-card { min-height: 250px; padding: 26px 24px; }
.mini-card { min-height: 116px; padding: 22px 20px; }
.pink-card { background: linear-gradient(135deg, #ff5b95 0%, #ff7d7e 48%, #ffb24e 100%); color: #fff; }
.yellow-card { background: linear-gradient(135deg, #ffe17c 0%, #ffbb3c 100%); color: #3f2e00; }
.cyan-card { background: linear-gradient(135deg, #8beeff 0%, #4cd6ff 100%); color: #003d4c; }
.promo-label { font-size: 11px; font-weight: 800; letter-spacing: 2px; opacity: 0.85; }
.promo-title { margin-top: 12px; font-size: 28px; font-weight: 900; }
.promo-text { margin-top: 10px; max-width: 250px; line-height: 1.8; font-size: 14px; }
.toy { position: absolute; right: 22px; bottom: 18px; }
.toy-bear { width: 106px; height: 126px; border-radius: 48px 48px 38px 38px; background: rgba(255, 255, 255, 0.22); box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.16); }
.toy-bear::before, .toy-bear::after { content: ""; position: absolute; top: -18px; width: 32px; height: 32px; border-radius: 50%; background: rgba(255, 255, 255, 0.22); }
.toy-bear::before { left: 12px; }
.toy-bear::after { right: 12px; }

.auth-panel {
  position: relative;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.75);
  border-radius: 30px;
  box-shadow: 0 28px 70px rgba(35, 34, 67, 0.16);
  padding: 30px 28px 26px;
}

.panel-decoration { position: absolute; top: 0; left: 0; right: 0; height: 9px; background: linear-gradient(90deg, #ff5f95 0%, #ffa442 48%, #38d9ff 100%); }
.panel-chip { display: inline-flex; margin-top: 12px; padding: 7px 12px; border-radius: 999px; font-size: 11px; font-weight: 800; letter-spacing: 1.6px; }
.alt-chip { background: #eefcff; color: #14a8c5; }
.panel-title { margin-top: 18px; font-size: 32px; line-height: 1.2; font-weight: 900; color: #1d2133; }
.panel-subtitle, .register-title { margin: 10px 0 22px; color: #6e7687; font-size: 14px; line-height: 1.8; }
.field-label { margin-bottom: 8px; font-size: 13px; font-weight: 800; color: #4a5263; }
.auth-form :deep(.el-form-item) { margin-bottom: 16px; }
.toy-input :deep(.el-input__inner) { height: 50px; border: 1px solid #ebedf4; border-radius: 16px; background: rgba(255, 255, 255, 0.9); color: #2c3140; padding: 0 16px; transition: 0.2s ease; }
.toy-input :deep(.el-input__inner:focus) { border-color: #ff6f8f; box-shadow: 0 0 0 4px rgba(255, 111, 143, 0.11); }
.primary-btn { width: 100%; height: 52px; border: none; border-radius: 16px; background: linear-gradient(90deg, #ff5f95 0%, #ff8d48 56%, #ffbf44 100%); color: #fff; font-size: 16px; font-weight: 900; letter-spacing: 1px; box-shadow: 0 18px 30px rgba(255, 117, 105, 0.24); }
.primary-btn:hover, .primary-btn:focus { color: #fff; background: linear-gradient(90deg, #ff699c 0%, #ff9850 56%, #ffc84b 100%); }
.switch-box { margin-top: 24px; padding: 18px; border-radius: 20px; background: linear-gradient(135deg, #fff7f1 0%, #fffbfd 60%, #f3fdff 100%); border: 1px solid #f0ebef; display: flex; justify-content: space-between; gap: 16px; align-items: center; }
.switch-box-title { font-size: 15px; font-weight: 900; color: #2a2f3d; }
.switch-box-desc { margin-top: 6px; color: #7a8294; font-size: 13px; }
.switch-btn { border: none; height: 40px; padding: 0 18px; border-radius: 999px; background: #1e2133; color: #fff; font-weight: 800; cursor: pointer; }

@media (max-width: 1120px) {
  .auth-shell { grid-template-columns: 1fr; }
  .hero-title { font-size: 58px; }
  .stage-cards { max-width: none; }
}

@media (max-width: 720px) {
  .auth-wrap { padding: 18px; }
  .hero-title { font-size: 42px; }
  .mark-text .cn { font-size: 26px; }
  .stage-cards { grid-template-columns: 1fr; }
  .auth-panel { border-radius: 24px; }
  .switch-box { flex-direction: column; align-items: flex-start; }
}
</style>
