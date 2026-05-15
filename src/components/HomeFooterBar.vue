<template>
  <footer class="home-footer">
    <div class="footer-brand">
      <div class="footer-logo">T</div>
      <div>
        <div class="footer-title">潮玩商城</div>
        <div class="footer-subtitle">TOY POP UNIVERSE</div>
      </div>
    </div>
    <div class="footer-text">聚焦手办、盲盒与玩家内容展示的潮玩商城首页基础框架。</div>
    <div class="footer-links">
      <span>关于我们</span>
      <span>新品发售</span>
      <span>玩家社区</span>
      <span>售后服务</span>
    </div>
  </footer>
</template>

<script>
export default {
  name: "HomeFooterBar"
};
</script>

<style scoped>
.home-footer {
  padding: 28px;
  border-radius: 28px;
  background: linear-gradient(135deg, #1f2233 0%, #2f3554 100%);
  color: rgba(255, 255, 255, 0.92);
  box-shadow: 0 20px 46px rgba(31, 34, 51, 0.22);
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.footer-logo {
  width: 52px;
  height: 52px;
  border-radius: 18px;
  background: linear-gradient(135deg, #ff5d90 0%, #ff8c42 52%, #ffd24d 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 900;
  color: #fff;
}

.footer-title {
  font-size: 24px;
  font-weight: 900;
}

.footer-subtitle {
  margin-top: 4px;
  font-size: 12px;
  letter-spacing: 1.8px;
  color: rgba(255, 255, 255, 0.62);
}

.footer-text {
  margin-top: 18px;
  color: rgba(255, 255, 255, 0.72);
  line-height: 1.9;
}

.footer-links {
  margin-top: 18px;
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  color: rgba(255, 255, 255, 0.86);
  font-weight: 700;
}
</style>
