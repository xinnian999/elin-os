import { createApp } from "vue";
import { createPinia } from "pinia";
import PerfectHome from "./perfect-home/App.vue";
import "./perfect-home/styles/global.scss";

createApp(PerfectHome).use(createPinia()).mount("#root");
