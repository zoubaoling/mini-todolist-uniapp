import { createSSRApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import NavigatorBar from "@/components/navigator-bar/navigatorBar.vue";
import ProgressBar from "@/components/progress-bar/progressBar.vue";

export function createApp() {
  const app = createSSRApp(App);
  app.component("navigator-bar", NavigatorBar);
  app.component("progress-bar", ProgressBar);
  app.use(createPinia());
  return {
    app,
  };
}
