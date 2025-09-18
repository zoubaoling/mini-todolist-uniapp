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

const height = computed(() => {
  const { barType = 'page' } = props
  return barType === 'page' ? '280rpx' : '200rpx'
})

const onLeftButtonTap = () => {
  emit('left-button-tap')
}
</script>

<style scoped lang="less">
@import './navigator-bar.less';
</style>