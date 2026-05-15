<template>
  <section class="module-shell">
    <div class="section-head">
      <div>
        <div class="section-chip">{{ chip }}</div>
        <h2 class="section-title">{{ title }}</h2>
      </div>
      <button class="section-link" @click="$emit('more')">查看更多</button>
    </div>

    <div v-if="loading" class="module-grid">
      <div class="skeleton-card" v-for="idx in 4" :key="idx"></div>
    </div>

    <el-empty v-else-if="!items.length" description="暂无商品数据" />

    <div v-else class="module-grid">
      <HomeProductCard
        v-for="item in items"
        :key="item.id"
        :product="item"
        :badge="badge"
        @detail="$emit('detail', $event)"
        @favorite="$emit('favorite', $event)"
        @add-cart="$emit('add-cart', $event)"
      />
    </div>
  </section>
</template>

<script>
import HomeProductCard from "./HomeProductCard.vue";

export default {
  name: "HomeModuleSection",
  components: {
    HomeProductCard
  },
  props: {
    chip: {
      type: String,
      default: "SHOWCASE"
    },
    title: {
      type: String,
      default: "模块标题"
    },
    badge: {
      type: String,
      default: "HOT"
    },
    items: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    }
  }
};
</script>

<style scoped>
.module-shell {
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
  gap: 16px;
  margin-bottom: 20px;
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

.section-link {
  border: none;
  height: 40px;
  padding: 0 18px;
  border-radius: 999px;
  background: linear-gradient(90deg, #1e2133 0%, #343a58 100%);
  color: #fff;
  cursor: pointer;
  font-weight: 800;
  transition: transform 0.22s ease, box-shadow 0.22s ease, filter 0.22s ease;
}

.section-link:hover {
  transform: translateY(-1px) scale(1.02);
  box-shadow: 0 14px 28px rgba(31, 34, 51, 0.18);
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
}

.skeleton-card {
  height: 386px;
  border-radius: 22px;
  background: linear-gradient(90deg, #fff0f4 0%, #fff8fb 50%, #fff0f4 100%);
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (max-width: 1100px) {
  .module-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 720px) {
  .module-shell {
    padding: 20px;
    border-radius: 24px;
  }

  .section-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .module-grid {
    grid-template-columns: 1fr;
  }
}
</style>
