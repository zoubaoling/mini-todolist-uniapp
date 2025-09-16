<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { cloudConfig } from './utils/config'
onLaunch(() => {
  console.log("App Launch");
  initCloud()
});
onShow(() => {
  console.log("App Show");
});
onHide(() => {
  console.log("App Hide");
});
const initCloud = () => {
  wx.cloud.init({
    env: cloudConfig.envId,
    traceUser: true
  })
}
</script>
<style></style>
