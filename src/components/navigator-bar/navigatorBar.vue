<template>
  <view class="navigator-bar" :style="{ height }">
  <!-- 左侧按钮 -->
  <template v-if="isShowBackButton">
    <button
      class="natigator-bar__left navigator-bar__button"
      :plain="true"
      @click="onLeftButtonTap"
      >
      <image class="navigator-bar__button-icon" :src="leftIconPath" />
    </button>
  </template>
  <!-- 中间文案 -->
  <view class="navigator-bar__title">
    <view class="navigator-bar__title-text">{{title}}</view>
    <view class="navigator-bar__title-subtext" v-if="subTitle">{{subTitle}}</view>
  </view>
  <!-- 右侧按钮 -->
  <template v-if="isShowRightButton">
    <view>
      <slot name="right-icon"></slot>
    </view>
  </template>
</view>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
const props = defineProps({
  title: {
    type: String,
    value: ''
  },
  subTitle: {
    type: String,
    value: ''
  },
  isShowBackButton: {
    type: Boolean,
    value: false
  },
  barType: {
    type: String,
    value: 'page' // page: 首页导航栏 back: 返回上一页
  },
  isShowRightButton: {
    type: Boolean,
    value: false
  }
})
const height = ref('250rpx')
const leftIconPath = ref('/assets/images/back.png')
onMounted(() => {
  updateComputedProperties(props.barType)
})
const updateComputedProperties = (barType: string) => {
  switch (barType) {
    case 'page':
      height.value = '250rpx'
      break
    case 'back':
      height.value = '140rpx'
      break
  }
}
const onLeftButtonTap = () => {
  uni.$emit('left-button-tap')
}
const onRightButtonTap = () => {
  uni.$emit('right-button-tap')
}
watch(() => props.barType, (newVal) => {
  updateComputedProperties(newVal)
})
</script>

<style scoped lang="less">
@import './navigator-bar.less';
</style>