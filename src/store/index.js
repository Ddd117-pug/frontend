import Vue from "vue";
import Vuex from "vuex";
import { clearAuth, getToken, getUser, setToken, setUser } from "../utils/auth";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    token: getToken(),
    user: getUser(),
    favoriteIds: []
  },
  getters: {
    isLogin: state => !!state.token,
    isAdmin: state => state.user && state.user.role === 1,
    favoriteIds: state => state.favoriteIds,
    favoriteCount: state => state.favoriteIds.length
  },
  mutations: {
    SET_AUTH(state, payload) {
      state.token = payload.token || "";
      state.user = payload.user || null;
      setToken(state.token);
      setUser(state.user);
    },
    SET_FAVORITES(state, ids) {
      state.favoriteIds = Array.isArray(ids) ? Array.from(new Set(ids)) : [];
    },
    ADD_FAVORITE(state, id) {
      if (!state.favoriteIds.includes(id)) {
        state.favoriteIds = [...state.favoriteIds, id];
      }
    },
    REMOVE_FAVORITE(state, id) {
      state.favoriteIds = state.favoriteIds.filter(item => item !== id);
    },
    CLEAR_AUTH(state) {
      state.token = "";
      state.user = null;
      state.favoriteIds = [];
      clearAuth();
    }
  }
});
