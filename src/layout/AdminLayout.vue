<template>
  <el-container class="admin-layout">
    <el-aside class="admin-sidebar" width="248px">
      <div class="sidebar-brand">
        <div class="sidebar-brand__logo">CS</div>
        <div class="sidebar-brand__meta">
          <strong>潮玩商城后台</strong>
          <span>Admin Console</span>
        </div>
      </div>

      <el-menu
        class="admin-menu"
        :router="true"
        :default-active="$route.path"
        :unique-opened="true"
        background-color="transparent"
        text-color="#cbd5e1"
        active-text-color="#ffffff"
      >
        <el-menu-item index="/admin"><i class="el-icon-data-analysis"></i><span>数据看板</span></el-menu-item>
        <el-menu-item index="/admin/products"><i class="el-icon-goods"></i><span>商品管理</span></el-menu-item>
        <el-menu-item index="/admin/orders"><i class="el-icon-document"></i><span>订单管理</span></el-menu-item>
        <el-menu-item index="/admin/users"><i class="el-icon-user"></i><span>用户管理</span></el-menu-item>
        <el-menu-item index="/admin/reviews"><i class="el-icon-chat-dot-round"></i><span>评价管理</span></el-menu-item>
        <el-menu-item index="/admin/brands"><i class="el-icon-s-opportunity"></i><span>品牌管理</span></el-menu-item>
        <el-menu-item index="/admin/home-config"><i class="el-icon-s-platform"></i><span>首页运营</span></el-menu-item>
        <el-menu-item index="/admin/operation-logs"><i class="el-icon-s-order"></i><span>操作日志</span></el-menu-item>
      </el-menu>

      <div class="sidebar-footer">
        <div class="sidebar-footer__chip">版本 1.0</div>
        <div class="sidebar-footer__hint">支持数据概览 · 商品 · 订单 · 用户 · 日志</div>
      </div>
    </el-aside>

    <el-container class="admin-main-shell">
      <el-header class="admin-topbar">
        <div class="topbar-left">
          <div class="topbar-title">潮玩商城管理控制台</div>
          <div class="topbar-subtitle">后台业务管理与经营数据统一入口</div>
        </div>
        <div class="topbar-right">
          <div class="topbar-user">
            <div class="topbar-user__avatar">A</div>
            <div class="topbar-user__meta">
              <strong>管理员</strong>
              <span>已登录</span>
            </div>
          </div>
          <el-button size="mini" plain @click="$router.push('/mall')">返回商城</el-button>
        </div>
      </el-header>

      <el-main class="admin-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
export default { name: "AdminLayout" };
</script>

<style scoped>
.admin-layout { min-height:100vh; background:#f4f7fb; }
.admin-sidebar { display:flex; flex-direction:column; padding:18px 14px; background:linear-gradient(180deg,#152235 0%,#1c2b42 100%); box-shadow:8px 0 30px rgba(15,23,42,.12); }
.sidebar-brand { display:flex; align-items:center; gap:12px; padding:10px 10px 18px; margin-bottom:10px; border-bottom:1px solid rgba(255,255,255,.08); }
.sidebar-brand__logo { width:46px; height:46px; border-radius:14px; display:grid; place-items:center; background:linear-gradient(135deg,#ff7a5c,#4f7cff); color:#fff; font-weight:900; letter-spacing:1px; box-shadow:0 12px 24px rgba(79,124,255,.22); }
.sidebar-brand__meta strong { display:block; color:#fff; font-size:16px; font-weight:900; }
.sidebar-brand__meta span { display:block; margin-top:3px; color:#94a3b8; font-size:12px; }
.admin-menu { border-right:none; padding:8px 0; }
.admin-menu :deep(.el-menu-item) { height:46px; line-height:46px; border-radius:12px; margin:6px 0; color:#cbd5e1; }
.admin-menu :deep(.el-menu-item i) { color:inherit; margin-right:10px; font-size:16px; }
.admin-menu :deep(.el-menu-item.is-active) { background:linear-gradient(135deg,rgba(255,255,255,.18),rgba(255,255,255,.08)); color:#fff; box-shadow:0 10px 20px rgba(0,0,0,.15); }
.sidebar-footer { margin-top:auto; padding:14px 10px 6px; }
.sidebar-footer__chip { display:inline-flex; padding:6px 10px; border-radius:999px; background:rgba(255,255,255,.08); color:#fff; font-size:12px; font-weight:700; }
.sidebar-footer__hint { margin-top:10px; color:#94a3b8; font-size:12px; line-height:1.6; }
.admin-main-shell { min-width:0; }
.admin-topbar { height:auto !important; display:flex; justify-content:space-between; align-items:center; gap:16px; padding:18px 24px; background:rgba(255,255,255,.82); backdrop-filter:blur(18px); border-bottom:1px solid #e8eef6; box-shadow:0 1px 0 rgba(255,255,255,.7) inset; }
.topbar-left { display:flex; flex-direction:column; gap:4px; }
.topbar-title { font-size:18px; font-weight:900; color:#202536; }
.topbar-subtitle { color:#7b8395; font-size:13px; }
.topbar-right { display:flex; align-items:center; gap:12px; }
.topbar-user { display:flex; align-items:center; gap:10px; padding:8px 12px; border-radius:14px; background:linear-gradient(135deg,#fff,#f7fbff); border:1px solid #e8eef6; }
.topbar-user__avatar { width:34px; height:34px; border-radius:12px; display:grid; place-items:center; background:linear-gradient(135deg,#ff7a5c,#ff9d40); color:#fff; font-weight:900; }
.topbar-user__meta strong { display:block; color:#202536; font-size:13px; }
.topbar-user__meta span { display:block; color:#7b8395; font-size:12px; }
.admin-content { padding:24px; background:linear-gradient(180deg,#f4f7fb 0%,#f7f9fc 100%); }
@media (max-width: 992px) {
  .admin-layout { flex-direction:column; }
  .admin-sidebar { width:100% !important; }
  .admin-menu { display:flex; flex-wrap:wrap; gap:8px; }
  .admin-menu :deep(.el-menu-item) { margin:0; flex:1 1 calc(50% - 8px); }
  .sidebar-footer { display:none; }
}
@media (max-width: 768px) {
  .admin-topbar { flex-direction:column; align-items:flex-start; padding:16px; }
  .topbar-right { width:100%; justify-content:space-between; }
  .admin-content { padding:16px; }
  .admin-menu :deep(.el-menu-item) { flex:1 1 100%; }
}
</style>