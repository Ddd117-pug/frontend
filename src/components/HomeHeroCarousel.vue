<template>
  <section class="home-hero">
    <div class="hero-copy">
      <div class="hero-chip">ART TOY · LIMITED DROP · COLLECT NOW</div>
      <h1 class="hero-title">
        把热爱
        <span>摆进你的收藏柜</span>
      </h1>
      <p class="hero-desc">
      </p>
      <div class="hero-actions">
        <button class="hero-primary" @click="$emit('browse')">立即逛新品</button>
      </div>
    </div>

    <div class="carousel-wrap" @mouseenter="pauseAutoplay" @mouseleave="resumeAutoplay">
      <el-carousel ref="carousel" class="hero-carousel" height="430px" arrow="always" indicator-position="outside" :interval="4000" :autoplay="autoplay">
        <el-carousel-item v-for="item in slides" :key="item.id">
          <div class="slide-card" :style="{ background: item.background }">
            <div class="slide-overlay"></div>
            <img :src="item.image" :alt="item.title" class="slide-image" :class="item.imageClass" />
            <div class="slide-content">
              <div class="slide-tag">{{ item.tag }}</div>
              <div class="slide-title">{{ item.title }}</div>
              <div class="slide-desc">{{ item.desc }}</div>
              <button class="slide-cta" @click.stop="handleAction(item)">
                <span class="slide-cta__shine"></span>
                <span class="slide-cta__label">{{ item.buttonText || '立即抢购' }}</span>
              </button>
            </div>
          </div>
        </el-carousel-item>
      </el-carousel>
    </div>
  </section>
</template>

<script>
export default {
  name: "HomeHeroCarousel",
  props: {
    slides: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      autoplay: true
    };
  },
  methods: {
    pauseAutoplay() {
      this.autoplay = false;
    },
    resumeAutoplay() {
      this.autoplay = true;
    },
    handleAction(item) {
      this.$emit("action", item);
    }
  }
};
</script>

<style scoped>
.home-hero {
  display: grid;
  grid-template-columns: 0.92fr 1.08fr;
  gap: 22px;
  padding: 28px;
  border-radius: 30px;
  background: linear-gradient(135deg, #fff7ef 0%, #fff4f8 36%, #edfafe 100%);
  box-shadow: 0 24px 60px rgba(35, 34, 67, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.88);
}

.hero-chip {
  display: inline-flex;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  color: #ff5f92;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.8px;
}

.hero-title {
  margin: 18px 0 0;
  font-size: 64px;
  line-height: 0.94;
  font-weight: 900;
  letter-spacing: -2px;
  color: #1d2133;
}

.hero-title span {
  display: block;
  margin-top: 10px;
  background: linear-gradient(90deg, #ff5f93 0%, #ff9d42 55%, #17cfff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-desc {
  margin-top: 22px;
  color: #5b6274;
  font-size: 16px;
  line-height: 1.9;
}

.hero-actions {
  display: flex;
  gap: 12px;
  margin-top: 28px;
}

.hero-primary,
.slide-cta {
  height: 48px;
  padding: 0 20px;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 900;
}

.hero-primary,
.slide-cta {
  color: #fff;
  background: linear-gradient(90deg, #ff5f95 0%, #ff8d48 56%, #ffbf44 100%);
  box-shadow: 0 16px 28px rgba(255, 117, 105, 0.22);
}

.carousel-wrap {
  border-radius: 28px;
}

.hero-carousel {
  border-radius: 28px;
  overflow: hidden;
}

.slide-card {
  position: relative;
  height: 430px;
  border-radius: 28px;
  overflow: hidden;
}

.slide-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, rgba(21, 28, 47, 0.32) 0%, rgba(21, 28, 47, 0.08) 48%, rgba(21, 28, 47, 0.2) 100%);
  z-index: 1;
}

.slide-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
  transform: scale(1.03);
}

.slide-image.focus-top {
  object-position: center top;
}

.slide-image.focus-center {
  object-position: center center;
}

.slide-image.focus-bottom {
  object-position: center bottom;
}

.slide-content {
  position: absolute;
  left: 28px;
  right: 28px;
  bottom: 28px;
  color: #fff;
  z-index: 2;
}

.slide-tag {
  display: inline-flex;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.5px;
}

.slide-title {
  margin-top: 14px;
  font-size: 34px;
  font-weight: 900;
}

.slide-desc {
  margin-top: 8px;
  max-width: 420px;
  font-size: 14px;
  line-height: 1.8;
}

.slide-cta {
  position: relative;
  margin-top: 18px;
  min-width: 142px;
  padding: 0 24px;
  overflow: hidden;
  color: #ffffff;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.26) 0%, rgba(255, 255, 255, 0.12) 100%);
  border: 1px solid rgba(255, 255, 255, 0.32);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  box-shadow: 0 16px 32px rgba(17, 24, 39, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.28);
  transition: transform 0.24s ease, box-shadow 0.24s ease, border-color 0.24s ease, background 0.24s ease;
}

.slide-cta::before {
  content: "";
  position: absolute;
  inset: 1px;
  border-radius: 15px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.04) 100%);
}

.slide-cta:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 245, 214, 0.86);
  background: linear-gradient(135deg, rgba(255, 243, 207, 0.28) 0%, rgba(255, 173, 204, 0.22) 100%);
  box-shadow: 0 0 18px rgba(255, 221, 121, 0.42), 0 0 36px rgba(255, 134, 173, 0.28), 0 18px 34px rgba(17, 24, 39, 0.26), inset 0 1px 0 rgba(255, 255, 255, 0.38);
}

.slide-cta__shine {
  position: absolute;
  top: -40%;
  left: -24%;
  width: 56px;
  height: 180%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.65) 50%, rgba(255, 255, 255, 0) 100%);
  transform: rotate(24deg);
  opacity: 0.42;
  transition: transform 0.35s ease, opacity 0.35s ease;
}

.slide-cta:hover .slide-cta__shine {
  transform: translateX(120px) rotate(24deg);
  opacity: 0.85;
}

.slide-cta__label {
  position: relative;
  z-index: 1;
  letter-spacing: 0.6px;
  text-shadow: 0 1px 10px rgba(255, 255, 255, 0.18);
}

@media (max-width: 1100px) {
  .home-hero {
    grid-template-columns: 1fr;
  }

  .hero-title {
    font-size: 52px;
  }
}

@media (max-width: 720px) {
  .home-hero {
    padding: 20px;
    border-radius: 24px;
  }

  .hero-title {
    font-size: 40px;
  }

  .hero-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .slide-card {
    height: 360px;
  }

  .slide-title {
    font-size: 28px;
  }
}
</style>
