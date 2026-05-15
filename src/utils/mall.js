export function formatPrice(value) {
  return value === undefined || value === null || value === "" ? "0.00" : Number(value).toFixed(2);
}

export function requireLogin(vm, message) {
  if (vm.$store.getters.isLogin) {
    return true;
  }
  vm.$message.warning(message || "请先登录");
  if (vm.$route.path !== "/login") {
    vm.$router.push("/login");
  }
  return false;
}

export function favoriteIdList(favorites) {
  return (favorites || []).map(item => item.id);
}
