<template>
<view class="stats-page">
  <navigator-bar title="统计中心" subTitle="了解你的效率趋势"></navigator-bar>
  <scroll-view class="stats-content" scroll-y>
    <view class="stats-filters card-box">
      <view
        :class="['stats-filters-item', filterDimension === item.value && 'active']"
        v-for="item in statsDimension"
        :key="item.value"
        @tap="handleClickFilter(item.value)"
        >
        <view class="stats-filters-item-label">{{item.label}}</view>
      </view>
    </view>
    <!-- 统计概览 -->
    <view class="stats-overview">
      <view class="stats-overview-item card-box">
        <view class="stats-overview-item-label">{{taskStats.total}}</view>
        <view class="stats-overview-item-value">总任务数</view>
      </view>
      <view class="stats-overview-item card-box">
        <view class="stats-overview-item-label">{{taskStats.completed}}</view>
        <view class="stats-overview-item-value">已完成</view>
      </view>
      <view class="stats-overview-item card-box">
        <view class="stats-overview-item-label">{{taskStats.completionRate}}</view>
        <view class="stats-overview-item-value">完成率</view>
      </view>
      <view class="stats-overview-item card-box">
        <view class="stats-overview-item-label">{{taskStats.continuousDays}}</view>
        <view class="stats-overview-item-value">连续天数</view>
      </view>
    </view>
    <!-- 分类完成情况 -->
    <view class="stats-category card-box">
      <view class="stats-category-header">
        <image class="stats-category-icon" :src="statsIconUrl" />
        <text class="stats-category-title">分类完成情况</text>
      </view>
      <view class="stats-category-content">
        <view class="stats-category-progress"
          v-for="item in taskCategoryList"
          :key="item.type"
        >
          <progress-bar
            :label="item.label"
            :percentage="item.percentage"
            :gradient="item.gradient"
            :animated="item.animated"
          />
        </view>
      </view>
    </view>
  </scroll-view>
</view>
</template>

<script setup lang="ts">
import { STATS_DIMENSION, TASK_CATEGORY } from '../../constants/index'
import { setDataAndWait, formatToPercentage } from '../../utils/util'
import * as serverApi from '../../server/index'
import { ref, computed, reactive, onMounted } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import statsIconUrl from '/static/images/stats.png'
const taskStats = reactive({
  total: 0,
  completed: 0,
  completionRate: 0.5,
  continuousDays: 0
})
const statsDimension = STATS_DIMENSION
const filterDimension = ref(STATS_DIMENSION[0].value)
const taskCategoryList = reactive(Object.values(TASK_CATEGORY))

const getTaskOverview = async () => {
  const res = await serverApi.getTaskOverview(filterDimension.value)
  if (res.success && res.data) {
    const { completionRate, ...properties } = res.data
    Object.assign(taskStats, {
      ...properties,
      completionRate: formatToPercentage(completionRate)
    })
  }
}

const triggerProgressAnimation = () => {
    // 为每个进度条设置动画延迟，创造依次出现的效果
  taskCategoryList.map((_, index) => {
    setTimeout(() => {
      taskCategoryList[index].animated = true
    }, index * 200) // 每个进度条延迟200ms
  })
  }

const getTaskCategoryList = async () => {
  // 模拟不同分类的完成情况数据，与原型保持一致
  const res = await serverApi.getTaskCategoryCompletion(filterDimension.value)
  if (res.success && res.data) {
    const list = Object.values(TASK_CATEGORY).map(({type, ...items}) => {
      const data = res.data.find(item => item.category === type)
      return {
        ...items,
        type,
        percentage: (data.completionRate * 100).toFixed(0),
        // 重置动画状态
        animated: false
      }
    })
    taskCategoryList.splice(0, taskCategoryList.length, ...list)
    // 2. 延迟重新触发动画 wx.nextTick中DOM渲染完再触发动画
    triggerProgressAnimation()
  }
}
const getStatsData = () => {
  getTaskOverview()
  getTaskCategoryList()
}

onLoad(() => {
  getStatsData()
})
onShow(() => {
  getStatsData()
})
onMounted(() => {
  triggerProgressAnimation()
}) 
const handleClickFilter = (value: string) => {
  filterDimension.value = value
  getStatsData()
}
</script>

<style scoped lang="less">
@import './stats.less';
</style>