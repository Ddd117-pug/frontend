<template>
  <article class="product-card" @click="$emit('detail', product)">
    <div class="product-cover-wrap">
      <img :src="resolveAssetUrl(product.coverUrl) || fallback" :alt="product.name" class="product-cover" />
      <span class="product-badge">{{ badge }}</span>
      <button class="favorite-toggle" :class="{ active: product.isFavorite }" @click.stop="$emit('favorite', product)">
        {{ product.isFavorite ? '♥' : '♡' }}
      </button>
    </div>

    <div class="product-name">{{ product.name }}</div>
    <div class="product-subtitle">{{ product.subTitle || '限量潮玩收藏单品，适合入柜展示。' }}</div>

    <div class="product-meta">
      <span>销量 {{ product.saleCount || 0 }}</span>
      <span>库存 {{ product.stock || 0 }}</span>
    </div>

    <div class="product-foot">
      <span class="product-price">￥{{ product.price }}</span>
      <div class="product-actions">
        <button class="ghost-btn" @click.stop="$emit('favorite', product)">
          {{ product.isFavorite ? '已收藏' : '收藏' }}
        </button>
        <button class="primary-btn" @click.stop="$emit('add-cart', product)">加入购物车</button>
      </div>
    </div>
  </article>
</template>

<script>
import { resolveAssetUrl } from "../utils/asset";

export default {
  name: "HomeProductCard",
  props: {
    product: {
      type: Object,
      required: true
    },
    badge: {
      type: String,
      default: "HOT"
    }
  },
  data() {
    return {
      fallback: "https://dummyimage.com/600x600/f6f0f2/a3a3a3&text=Toy"
    };
  },
  methods: {
    resolveAssetUrl
  }
};
</script>

<style scoped>
.product-card {
  padding: 14px;
  border-radius: 22px;
  background: linear-gradient(135deg, #fff7f1 0%, #fffbfd 60%, #f3fdff 100%);
  box-shadow: inset 0 0 0 1px #f0ebef;
  transition: transform 0.24s ease, box-shadow 0.24s ease;
  cursor: pointer;
}

.product-card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 22px 40px rgba(255, 130, 102, 0.16);
}

.product-cover-wrap {
  position: relative;
}

.product-cover {
  width: 100%;
  height: 220px;
  object-fit: cover;
  border-radius: 18px;
  display: block;
}

.product-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(30, 33, 51, 0.88);
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
}

.favorite-toggle {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  color: #ff6f93;
  font-size: 18px;
  cursor: pointer;
  box-shadow: 0 10px 20px rgba(31, 34, 51, 0.12);
  transition: transform 0.22s ease, box-shadow 0.22s ease, filter 0.22s ease;
}

.favorite-toggle:hover,
.ghost-btn:hover,
.primary-btn:hover {
  transform: translateY(-1px) scale(1.02);
  box-shadow: 0 14px 28px rgba(255, 117, 105, 0.18);
}

.favorite-toggle.active {
  background: linear-gradient(90deg, #ff5f95 0%, #ff8d48 100%);
  color: #fff;
}

.product-name {
  margin-top: 14px;
  font-size: 17px;
  color: #272c3b;
  font-weight: 900;
}

.product-subtitle {
  margin-top: 8px;
  min-height: 44px;
  font-size: 13px;
  line-height: 1.7;
  color: #737b8c;
}

.product-meta {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: #8a93a5;
  font-size: 12px;
}

.product-foot {
  margin-top: 14px;
}

.product-price {
  color: #ff6b56;
  font-size: 22px;
  font-weight: 900;
}

.product-actions {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.ghost-btn,
.primary-btn {
  flex: 1;
  height: 38px;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 800;
  transition: transform 0.22s ease, box-shadow 0.22s ease, filter 0.22s ease;
}

.ghost-btn {
  background: rgba(255, 255, 255, 0.8);
  color: #2c3140;
  border: 1px solid #ececf4;
}

.primary-btn {
  color: #fff;
  background: linear-gradient(90deg, #ff5f95 0%, #ff8d48 56%, #ffbf44 100%);
  box-shadow: 0 12px 22px rgba(255, 117, 105, 0.18);
}

@media (max-width: 720px) {
  .product-cover {
    height: 200px;
  }

  .product-actions {
    flex-direction: column;
  }
}
</style>
