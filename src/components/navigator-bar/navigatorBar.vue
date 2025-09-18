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
import { computed, withDefaults } from 'vue' 
import { px2rpx } from '@/utils/util'
const props = withDefaults(defineProps<{
  title?: string
  subTitle?: string
  isShowBackButton?: boolean
  barType?: string
  isShowRightButton?: boolean
}>(), {
  title: '',
  subTitle: '',
  isShowBackButton: false,
  barType: 'page', // page: 首页导航栏 back: 返回上一页
  isShowRightButton: false
})
const emit = defineEmits(['left-button-tap'])
import leftIconPath from '@/static/images/back.png'

const isIphoneX = () => {
  // 安全区域信息（只有刘海屏设备有）safeArea safeAreaInsets
  // 刘海屏高度 = 状态栏高度 - 安全区域顶部
  const info = uni.getSystemInfoSync()
  const safeArea = info.safeArea || {}
  const safeAreaBottom = info.safeAreaInsets?.bottom || 0
  const windowBottom = info.screenHeight - (safeArea.bottom || 0)
  // 判断是否有安全区底部留白（iPhone X 及以上机型有）
  return safeAreaBottom > 0 || windowBottom > 0
}
const getSafeAreaTopHeight = () => {
  const { statusBarHeight } = uni.getSystemInfoSync()
  // return isIphoneX() ? px2rpx(statusBarHeight) : 0
  return px2rpx(statusBarHeight)
}
const statusBarHeight = getSafeAreaTopHeight()
const height = computed(() => {
  const { barType = 'page' } = props
  const baseHeight = barType === 'page' ? 280 : 200
  return `${baseHeight + statusBarHeight}` + 'rpx'
})
const onLeftButtonTap = () => {
  emit('left-button-tap')
}
</script>

<style scoped lang="less">
@import './navigator-bar.less';
</style>