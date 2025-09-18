<template>
<view class="progress-bar">
  <view 
    class="progress-bar__label"
    :style="{fontSize: labelFontSize, color: labelColor}"
  >{{label}}</view>
  <view 
    class="progress-bar__container"
    :style="{height: height, backgroundColor: backgroundColor}"
  >
    <view 
      :class="['progress-bar__fill', animated && 'animated']"
      :style="{background: gradient, width: animated ? `${percentage}%` : 0}"
    ></view>
  </view>
  <view 
    class="progress-bar__value"
    :style="{fontSize: valueFontSize, color: valueColor}"
  >{{percentageText}}</view>
</view>

</template>

<script setup lang="ts">
import { computed, ref, watch, withDefaults } from 'vue';

const props = withDefaults(defineProps<{
  label?: string
  percentage?: number
  gradient?: string
  animated?: boolean
  labelFontSize?: string
  valueFontSize?: string
  labelColor?: string
  valueColor?: string
  height?: string
  backgroundColor?: string
}>(), {
  label: '',
  percentage: 0,
  gradient: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
  animated: false,
  labelFontSize: '@font-sm',
  valueFontSize: '@font-sm',
  labelColor: '#666666',
  valueColor: '#333333',
  height: '18rpx',
  backgroundColor: '#f0f0f0'
})
const percentageText = computed(() => {
  return `${props.percentage}%`
})

// 触发动画
const triggerAnimation = () => {
  props.animated = true
}
    
// 重置动画
const resetAnimation = () => {
  props.animated = false
}

</script>

<style scoped lang="less">
@import './progress-bar.less';
</style>