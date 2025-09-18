<template>
<scroll-view class="task-detail-page">
  <navigator-bar
    title="任务详情"
    :isShowBackButton="true"
    barType="back"
    @left-button-tap="handleBack">
  </navigator-bar>
  <!-- 概览信息 -->
  <view class="task-detail-content">
    <view class="task-detail-overview card-box">
      <view class="task-detail-overview-title">{{taskDetail.text}}</view>
      <view class="task-detail-overview-status">
        <view class="task-priority task-tag {{taskDetail.className.priority}}">{{taskDetail.priorityLabel}}</view>
        <view class="task-category task-tag">{{taskDetail.categoryLabel}}</view>
        <view class="task-status task-tag {{taskDetail.className.status}}">{{taskDetail.statusLabel}}</view>
      </view>
      <view class="task-detail-overview-desc">{{taskDetail.desc}}</view>
    </view>
    <!-- 任务信息 -->
    <view class="task-detail-info card-box">
      <view class="task-detail-info-title">任务信息</view>
      <view class="task-detail-info-content">
        <view class="task-detail-info-content-item">
          <view class="task-detail-info-content-item-label">创建时间</view>
          <view class="task-detail-info-content-item-value">{{taskDetail.createTimeFormat}}</view>
        </view>
        <view class="task-detail-info-content-item">
          <view class="task-detail-info-content-item-label">截止时间</view>
          <view class="task-detail-info-content-item-value">{{taskDetail.deadlineFormat}}</view>
        </view>
        <view class="task-detail-info-content-item">
          <view class="task-detail-info-content-item-label">提醒设置</view>
          <view class="task-detail-info-content-item-value">{{taskDetail.isReminderLabel}}</view>
        </view>
      </view>
    </view>
    <view class="task-detail-actions">
      <button class="action-button action-button-complete" @tap="handleCompleteTask">标记完成</button>
      <button class="action-button action-button-edit" @tap="handleEditTask">编辑任务</button>
      <button class="action-button action-button-delete" @tap="handleDeleteTask">删除任务</button>
    </view>
  </view>
</scroll-view>
</template>

<script setup lang="ts">
import { TASK_MAPS} from '../../constants/index'
import * as serverApi from '../../server/index'
import TimeUtils from '../../utils/timer'
import { showModal, showToastWithPromise } from '../../utils/util'
import { reactive, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
const taskDetail = reactive({})
const initTaskDetail = async (id: string) => {
  try {
    const res = await serverApi.getTaskDetail(id)
    if (res.success && res.data) {
      const { createTime, deadline, priority, category, status, isReminder, ...properties }= res.data
      const newTaskDetail = {
        ...properties,
        priorityLabel: `${TASK_MAPS.priority[priority]}优先级`,
        categoryLabel: `${TASK_MAPS.category[category]}`,
        statusLabel: `${TASK_MAPS.status[status]}`,
        isReminderLabel: isReminder ? '开启' : '关闭',
        className: {
          priority: `priority-${priority.toLowerCase()}`,
          status: `status-${status.toLowerCase()}`
        },
        deadlineFormat: TimeUtils.format(deadline, 'YYYY-MM-DD HH:mm'),
        createTimeFormat: TimeUtils.format(createTime, 'YYYY-MM-DD HH:mm')
      }
      Object.assign(taskDetail, newTaskDetail)
    }
  } catch (error) {
    console.error(error)
  }
}
onLoad((options) => {
  initTaskDetail(options.id)
})
const handleBack = () => {
  uni.navigateBack()
}
const handleCompleteTask = async () => {
  await serverApi.updateTaskStatus(taskDetail._id, 'COMPLETED')
  uni.navigateBack()
}
  // 编辑任务
const handleEditTask = () => {
  uni.navigateTo({
    url: `/pages/add-task/add-task?id=${taskDetail._id}`
  })
}
  // 删除任务
const handleDeleteTask = async () => {
  const confirm = await showModal()
  if (confirm) {
    await serverApi.deleteTask(taskDetail._id, { loading: true, loadingText: '删除中...' })
    await showToastWithPromise({
      title: '删除任务成功',
      icon: 'success',
      duration: 1500
    })
    uni.navigateBack()
  }
}
</script>

<style scoped lang="less">
@import './task-detail.less';
</style>