<template>
  <div class="card">
    <div class="favorite-head">
      <div>
        <h3 class="page-title" style="margin-bottom: 8px;">我的收藏</h3>
        <div class="favorite-subtitle">收藏心仪商品，随时回来继续浏览。</div>
      </div>
    </div>

    <el-empty v-if="!list.length" description="还没有收藏商品，快去逛逛吧" />

    <el-row v-else :gutter="18">
      <el-col :span="6" v-for="item in list" :key="item.id">
        <el-card class="favorite-card" shadow="hover">
          <img :src="resolveAssetUrl(item.coverUrl) || fallback" class="cover" />
          <div class="favorite-name">{{ item.name }}</div>
          <div class="favorite-sub">{{ item.subTitle || '限量潮玩收藏单品' }}</div>
          <div class="favorite-actions">
            <span class="price">￥{{ item.price }}</span>
            <div>
              <el-button size="mini" type="primary" @click="$router.push('/mall/product/' + item.id)">详情</el-button>
              <el-button size="mini" @click="remove(item)">取消收藏</el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { api } from "../../api";
import { resolveAssetUrl } from "../../utils/asset";

export default {
  data() {
    return {
      list: [],
      fallback: "https://dummyimage.com/240x240/f2f2f2/999&text=Toy"
    };
  },
  async created() {
    await this.load();
  },
  methods: {
    resolveAssetUrl,
    async load() {
      this.list = await api.favoriteList();
    },
    async remove(item) {
      await api.removeFavorite(item.id);
      this.$message.success("已取消收藏");
      await this.load();
    }
  }
};
</script>

<style scoped>
.favorite-head {
  margin-bottom: 18px;
}

.favorite-subtitle {
  color: #8a94a6;
  font-size: 13px;
}

.favorite-card {
  margin-bottom: 18px;
  border-radius: 14px;
}

.cover {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 10px;
  margin-bottom: 10px;
}

.favorite-name {
  font-size: 16px;
  font-weight: 700;
  color: #172033;
}

.favorite-sub {
  margin-top: 8px;
  min-height: 40px;
  color: #697586;
  line-height: 1.5;
}

.favorite-actions {
  margin-top: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.price {
  color: #ff5a36;
  font-weight: 700;
}
</style>
