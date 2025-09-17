<template>
<scroll-view class="add-task-page">
  <navigator-bar
    title="添加任务"
    :isShowBackButton="true"
    :isShowRightButton="true"
    barType="back" 
    @left-button-tap="handleBack">
    <button slot="right-icon" class="navigator-bar__button_right" :plain="true" @click="handleSaveTask">
      <text>保存</text>
    </button>
  </navigator-bar>
  <view class="add-task-page__content">
    <!-- 基本信息 -->
    <view class="add-task-page__content-basic-info">
      <view class="add-task-page__content-basic-info-title">
        <text>基本信息</text>
      </view>
      <view class="add-task-page__content-basic-info-content">
        <view class="add-task-page__content-basic-info-content-item">
          <text
            class="add-task-page__content-basic-info-content-item-label"
            >任务标题*</text>
          <input
            class="add-task-page__content-basic-info-content-item-input input-field"
            placeholder="请输入任务标题"
            v-model="taskFormData.text"
            @input="debounceUpdateFormFieldData($event,'text')"
          />
        </view>
      </view>
      <view class="add-task-page__content-basic-info-content">
        <view class="add-task-page__content-basic-info-content-item">
          <text class="add-task-page__content-basic-info-content-item-label">任务描述</text>
          <textarea
            class="add-task-page__content-basic-info-content-item-textarea input-field"
            placeholder="请输入任务描述(可选)"
            v-model="taskFormData.desc"
            @input="debounceUpdateFormFieldData($event,'desc')"
          />
        </view>
      </view>
    </view>
    <!-- 优先级 -->
    <view class="add-task-page__content-priority">
      <view class="add-task-page__content-priority-title">
        <text>优先级</text>
      </view>
      <view class="add-task-page__content-priority-content">
        <view
          class="add-task-page__content-priority-content-item"
          :class="[item.class, taskFormData.priority === item.type && item.selectedClass]"
          v-for="item in priorityList"
          :key="item.type"
          @click="updateFormFieldData($event,'priority', item.type)"
          >
            <text class="add-task-page__content-priority-content-item-label">{{item.label}}</text>
            <text class="add-task-page__content-priority-content-item-desc">{{item.desc}}</text>
          </view>
      </view>
    </view>
    <!-- 分类标签 -->
    <view class="add-task-page__content-category">
      <view class="add-task-page__content-category-title">
        <text>分类标签</text>
      </view>
      <view class="add-task-page__content-category-content">
          <view
            class="add-task-page__content-category-content-item"
            :class="[taskFormData.category === item.type && 'selected']"
            v-for="item in categoryList"
            :key="item.type"
            @click="updateFormFieldData($event,'category', item.type)"
            >
            <text class="add-task-page__content-category-content-item-label">{{item.label}}</text>
          </view>
      </view>
    </view>
    <!-- 时间安排 -->
    <view class="add-task-page__content-time card-box">
      <view class="add-task-page__content-time-title card-box-title">
        <text>时间安排</text>
      </view>
      <!-- 截止日期 -->
      <view class="add-task-page__content-time-content">
        <view class="add-task-page__content-time-content-date">
          <text class="add-task-page__content-time-content-date-title">截止日期</text>
        </view>
        <view class="add-task-page__content-time-content-datetime">
          <picker
            class="date-picker"
            mode="date"
            :value="taskFormData.deadlineDate"
            @change="updateFormFieldData($event,'deadlineDate')"
          >
            <view class="datetime-picker">
              <text class="datetime-placeholder">{{taskFormData.deadlineDate || '年 / 月 / 日'}}</text>
              <image class="datetime-icon" src="/src/static/images/date-dark.png" />
            </view>
          </picker>
          <picker
            class="time-picker"
            mode="time"
            :value="taskFormData.deadlineTime"
            @change="updateFormFieldData($event,'deadlineTime')"
          >
            <view class="datetime-picker">
              <text class="datetime-placeholder">{{taskFormData.deadlineTime || '--:--'}}</text>
              <image class="datetime-icon" src="/src/static/images/time.png" />
            </view>
          </picker>
        </view>
        <!-- 提醒设置 -->
        <view class="add-task-page__content-time-content-reminder">
          <view class="add-task-page__content-time-content-reminder-title">提醒设置</view>
          <view class="add-task-page__content-time-content-reminder-content">
            <text class="add-task-page__content-time-content-reminder-content-label">开启提醒</text>
            <switch 
              class="add-task-page__content-time-content-reminder-switch" 
              :checked="taskFormData.isReminder"
              @change="updateFormFieldData($event,'isReminder')"
            />
          </view>
        </view>
      </view>
    </view>
    <!-- 创建任务 -->
    <button
      class="add-task-page__content-create button"
      type="primary"
      @click="handleSaveTask"
      >
      <text>{{isEdit ? '编辑任务' : '创建任务'}}</text>
    </button>
  </view>
</scroll-view>
</template>

<script setup lang="ts">
import { TASK_PRIORITY, TASK_CATEGORY } from "../../constants/index"
import { debounce, showToastWithPromise } from "../../utils/util"
import TimeUtils from "../../utils/timer"
import * as serverApi from '../../server/index'
import { onLoad } from '@dcloudio/uni-app'
import { ref, computed, reactive } from 'vue'
const priorityList = computed(() => {
  return Object.values(TASK_PRIORITY).map(({type, label, desc}) => ({
    type,
    desc,
    label: `${label}优先级`,
    class: `priority-${type.toLowerCase()}`,
    selectedClass: `priority-${type.toLowerCase()}-selected`
  }))
})
const categoryList = Object.values(TASK_CATEGORY)
const taskFormData = reactive({
  text: '',
  desc: '',
  category: 'WORK',
  isReminder: false,
  // picker: mode=time时，格式为 "YYYY-MM-DD"
  deadlineDate: TimeUtils.format(new Date(), 'YYYY-MM-DD'),
  // picker: mode=time时，格式为 hh:mm
  deadlineTime: TimeUtils.format(new Date(), 'hh:mm'),
  priority: 'HIGH',
  status: 'DOING'
})
const isEdit = ref(false)
const editTaskId = ref('')
const initTaskDetail = async () => {
  if (isEdit.value) {
    const res = await serverApi.getTaskDetail(editTaskId.value)
    if (res.success && res.data) {
      const { deadline } = res.data
      Object.assign(taskFormData, {
        deadlineDate: TimeUtils.format(deadline, 'YYYY-MM-DD'),
        deadlineTime: TimeUtils.format(deadline, 'hh:mm')
      })
    }
  }
}
const handleBack = () => {
  uni.navigateBack()
}
const updateFormFieldData = (e: any, field, value) => {
  const isFormField = ['text', 'desc', 'isReminder', 'deadlineDate', 'deadlineTime'].includes(field)
  taskFormData[field] = isFormField ? e.detail.value : value
}
const handleSaveTask = async () => {
  const { deadlineTime, deadlineDate, ...restFormData } = taskFormData
  const deadline = TimeUtils.combineDateTimeSafe(deadlineDate, deadlineTime)
  const saveFunc = isEdit.value ? serverApi.editTask : serverApi.addTask
  await saveFunc({
    ...restFormData,
    deadline
  })
  await showToastWithPromise({
    title: '保存成功',
    icon: 'success',
    duration: 1500
  })
  if (isEdit.value) {
    uni.switchTab({
      url: '/pages/home/home'
    })
  } else {
    uni.navigateBack()
  }
}
const debounceUpdateFormFieldData = debounce(updateFormFieldData.bind(this), 500)

onLoad((options) => {
  const { id } = options
  isEdit.value = !!id
  editTaskId.value = id
  initTaskDetail()
})
</script>

<style scoped lang="less">
@import './add-task.less';
</style>