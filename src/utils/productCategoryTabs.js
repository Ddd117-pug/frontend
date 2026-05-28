const TAB_ALL = "all";
const TAB_HOT_PRODUCT = "hot-product";
const TAB_NEW_MONTH = "new-month";
const TAB_PLUSH = "plush";
const TAB_ACCESSORY = "accessory";
const TAB_FIGURE = "figure";
const TAB_BLOCKS = "blocks";
const TAB_DISPLAY = "display";

export const PRODUCT_CATEGORY_TABS = [
  { key: TAB_ALL, label: "全部商品" },
  { key: TAB_HOT_PRODUCT, label: "热门商品" },
  { key: TAB_NEW_MONTH, label: "当月新品" },
  { key: TAB_PLUSH, label: "治愈毛绒" },
  { key: TAB_ACCESSORY, label: "时髦挂饰" },
  { key: TAB_FIGURE, label: "潮玩手办" },
  { key: TAB_BLOCKS, label: "拼搭积木" },
  { key: TAB_DISPLAY, label: "收纳展示" }
];

const normalizeName = value => String(value || "").trim();

export function normalizeProductCategoryTab(tab) {
  return PRODUCT_CATEGORY_TABS.some(item => item.key === tab) ? tab : TAB_ALL;
}

export function getProductCategoryLabel(tab) {
  const current = PRODUCT_CATEGORY_TABS.find(item => item.key === normalizeProductCategoryTab(tab));
  return current ? current.label : "全部商品";
}

export function buildProductCategoryIdMap(categories = []) {
  const nameToId = new Map(
    categories
      .filter(item => Number(item.status) !== 0)
      .map(item => [normalizeName(item.name), Number(item.id)])
  );

  return PRODUCT_CATEGORY_TABS.reduce((result, item) => {
    if (item.key === TAB_ALL) {
      result[item.key] = [];
      return result;
    }
    const categoryId = nameToId.get(normalizeName(item.label));
    result[item.key] = categoryId ? [categoryId] : [];
    return result;
  }, {});
}

export function matchProductCategoryTab(product, tab, categoryIdMap = {}) {
  const currentTab = normalizeProductCategoryTab(tab);
  if (currentTab === TAB_ALL) return true;

  const categoryIds = categoryIdMap[currentTab] || [];
  return categoryIds.includes(Number(product.categoryId));
}

export function getHomeCategoryRoute(categoryId, categoryIdMap = {}) {
  const currentCategoryId = Number(categoryId);
  const matched = PRODUCT_CATEGORY_TABS.find(item => {
    if (item.key === TAB_ALL) return false;
    return (categoryIdMap[item.key] || []).includes(currentCategoryId);
  });
  return matched ? matched.key : TAB_ALL;
}
