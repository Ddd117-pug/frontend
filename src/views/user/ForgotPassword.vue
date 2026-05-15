<template>
  <div class="auth-wrap">
    <div class="bg-grid"></div>
    <div class="orb orb-pink"></div>
    <div class="orb orb-yellow"></div>
    <div class="orb orb-cyan"></div>

    <div class="auth-shell">
      <section class="brand-stage">
        <div class="stage-topline">RESET ACCESS · VERIFY EMAIL · GET BACK IN</div>

        <div class="brand-mark">
          <div class="mark-badge">T</div>
          <div class="mark-text">
            <div class="cn">潮玩商城</div>
            <div class="en">TOY POP UNIVERSE</div>
          </div>
        </div>

        <h1 class="hero-title">
          通过邮箱
          <span>安全找回密码</span>
        </h1>

        <p class="hero-desc">
          输入账号和注册邮箱后，系统会将验证码发送到你的邮箱。输入收到的验证码并设置新密码，即可完成密码重置，更适合作为本科毕设中的正式实现方案。
        </p>

        <div class="stage-cards">
          <article class="promo-card large-card pink-card">
            <div class="promo-label">STEP 01</div>
            <div class="promo-title">账号校验</div>
            <div class="promo-text">核对账号与注册邮箱，确保找回流程只对当前账号本人开放。</div>
            <div class="toy toy-bear"></div>
          </article>

          <div class="mini-card-stack">
            <article class="promo-card mini-card yellow-card">
              <div class="promo-label">STEP 02</div>
              <div class="promo-title">邮箱收码</div>
            </article>
            <article class="promo-card mini-card cyan-card">
              <div class="promo-label">STEP 03</div>
              <div class="promo-title">重置密码</div>
            </article>
          </div>
        </div>
      </section>

      <section class="auth-panel">
        <div class="panel-decoration"></div>
        <div class="panel-chip alt-chip">EMAIL RESET</div>
        <div class="panel-title">忘记密码</div>
        <div class="panel-subtitle">验证码将发送至注册邮箱，60 秒内不可重复获取</div>

        <el-form :model="form" class="auth-form" @submit.native.prevent>
          <div class="field-label">账号（用户名或手机号）</div>
          <el-form-item>
            <el-input v-model="form.account" placeholder="请输入用户名或手机号" class="toy-input" />
          </el-form-item>

          <div class="field-label">注册邮箱</div>
          <el-form-item>
            <el-input v-model="form.email" placeholder="请输入注册邮箱" class="toy-input" />
          </el-form-item>

          <div class="code-row">
            <div class="code-input-wrap">
              <div class="field-label">邮箱验证码</div>
              <el-form-item>
                <el-input v-model="form.code" placeholder="请输入 6 位验证码" class="toy-input" />
              </el-form-item>
            </div>
            <el-button class="code-btn" :disabled="countdown > 0" @click="onGetCode">
              {{ countdown > 0 ? `${countdown}s 后重试` : "获取验证码" }}
            </el-button>
          </div>

          <div class="mail-tip">验证码不会回传到前端页面，请前往你的邮箱查收。</div>

          <div class="field-label">新密码</div>
          <el-form-item>
            <el-input v-model="form.newPassword" type="password" placeholder="请输入 6-20 位新密码" show-password class="toy-input" />
          </el-form-item>

          <el-button class="primary-btn" @click="onReset">重置密码</el-button>
        </el-form>

        <div class="switch-box">
          <div>
            <div class="switch-box-title">想起密码了？</div>
            <div class="switch-box-desc">返回登录页，继续进入你的潮玩世界。</div>
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
      countdown: 0,
      countdownTimer: null,
      form: {
        account: "",
        email: "",
        code: "",
        newPassword: ""
      }
    };
  },
  beforeDestroy() {
    this.clearCountdown();
  },
  methods: {
    async onGetCode() {
      if (this.countdown > 0) return;
      const res = await api.forgotPassword({ account: this.form.account, email: this.form.email });
      this.startCountdown(res.cooldownSeconds || 60);
      if (res.demoCode) {
        this.form.code = res.demoCode;
        this.$message.success(`本地演示验证码：${res.demoCode}，${res.expireSeconds || 300} 秒内有效`);
        return;
      }
      this.$message.success(`验证码已发送至邮箱，${res.expireSeconds || 300} 秒内有效`);
    },
    async onReset() {
      await api.resetPassword(this.form);
      this.$message.success("密码已重置，请重新登录");
      if (this.$route.path !== "/login") {
        this.$router.push("/login");
      }
    },
    startCountdown(seconds) {
      this.clearCountdown();
      this.countdown = seconds;
      this.countdownTimer = setInterval(() => {
        if (this.countdown <= 1) {
          this.clearCountdown();
          return;
        }
        this.countdown -= 1;
      }, 1000);
    },
    clearCountdown() {
      if (this.countdownTimer) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
      }
      this.countdown = 0;
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
.panel-subtitle { margin: 10px 0 22px; color: #6e7687; font-size: 14px; line-height: 1.8; }
.field-label { margin-bottom: 8px; font-size: 13px; font-weight: 800; color: #4a5263; }
.auth-form :deep(.el-form-item) { margin-bottom: 16px; }
.toy-input :deep(.el-input__inner) { height: 50px; border: 1px solid #ebedf4; border-radius: 16px; background: rgba(255, 255, 255, 0.9); color: #2c3140; padding: 0 16px; transition: 0.2s ease; }
.toy-input :deep(.el-input__inner:focus) { border-color: #ff6f8f; box-shadow: 0 0 0 4px rgba(255, 111, 143, 0.11); }
.code-row { display: grid; grid-template-columns: 1fr 148px; gap: 12px; align-items: end; }
.code-input-wrap { min-width: 0; }
.code-btn { height: 50px; border-radius: 16px; border: none; background: #1f2233; color: #fff; font-weight: 800; }
.code-btn:hover, .code-btn:focus { color: #fff; background: #2d3148; }
.code-btn.is-disabled, .code-btn.is-disabled:hover { background: #b7becf; color: #fff; }
.mail-tip { margin: -4px 0 18px; padding: 12px 14px; border-radius: 14px; background: #eef9ff; color: #0f6d8e; font-size: 13px; font-weight: 700; line-height: 1.6; }
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
  .code-row { grid-template-columns: 1fr; }
}
</style>
