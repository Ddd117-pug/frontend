<template>
  <section class="category-section card-shell">
    <div class="section-head">
      <div>
        <div class="section-chip">CATEGORY</div>
        <h2 class="section-title">商品分类</h2>
      </div>
    </div>

    <div class="category-grid">
      <button class="category-item" v-for="item in categories" :key="item.name" @click="$emit('select', item)">
        <div class="category-icon">{{ item.icon }}</div>
        <div class="category-name">{{ item.name }}</div>
      </button>
    </div>
  </section>
</template>

<script>
export default {
  name: "HomeCategoryGrid",
  props: {
    categories: {
      type: Array,
      default: () => []
    }
  }
};
</script>

<style scoped>
.card-shell {
  padding: 26px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 18px 50px rgba(35, 34, 67, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.92);
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.section-chip {
  display: inline-flex;
  padding: 8px 14px;
  border-radius: 999px;
  background: #fff3f7;
  color: #ff5f92;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.6px;
}

.section-title {
  margin: 14px 0 0;
  font-size: 30px;
  font-weight: 900;
  color: #1f2033;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
}

.category-item {
  padding: 18px 12px;
  border: none;
  border-radius: 22px;
  background: linear-gradient(135deg, #fff7f1 0%, #fffbfd 60%, #f3fdff 100%);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: inset 0 0 0 1px #f0ebef;
}

.category-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 26px rgba(255, 126, 110, 0.12);
}

.category-icon {
  width: 58px;
  height: 58px;
  margin: 0 auto;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  background: linear-gradient(135deg, #ff5d90 0%, #ff8c42 52%, #ffd24d 100%);
  color: #fff;
  box-shadow: 0 14px 28px rgba(255, 116, 123, 0.2);
}

.category-name {
  margin-top: 12px;
  color: #2c3140;
  font-size: 14px;
  font-weight: 800;
  text-align: center;
}

@media (max-width: 1100px) {
  .category-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 720px) {
  .card-shell {
    padding: 20px;
    border-radius: 24px;
  }

  .category-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
