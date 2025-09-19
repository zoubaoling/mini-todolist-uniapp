<template>
<view class="add-task-page">
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
  <scroll-view class="add-task-page__content" scroll-y>
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
      @click="handleSaveTask"
      >
      <text>{{isEdit ? '编辑任务' : '创建任务'}}</text>
    </button>
  </scroll-view>
</view>
</template>

<script setup lang="ts">
import { TASK_PRIORITY, TASK_CATEGORY } from "../../constants/index"
import { debounce, showToastWithPromise } from "../../utils/util"
import TimeUtils from "../../utils/timer"
import * as serverApi from '../../server/index'
import { onLoad } from '@dcloudio/uni-app'
import { ref, computed, reactive, type Ref, type ComputedRef } from 'vue'
import type { TaskFormData, TaskCategoryType, TaskPriorityType } from '../../types/index'

// 使用更严格的类型定义
interface PriorityItem {
  readonly type: TaskPriorityType
  readonly label: string
  readonly desc: string
  readonly class: string
  readonly selectedClass: string
}

interface CategoryItem {
  readonly type: TaskCategoryType
  readonly label: string
  readonly color: string
  readonly gradient: string
}

// 使用计算属性的类型注解
const priorityList: ComputedRef<PriorityItem[]> = computed(() => {
  return Object.values(TASK_PRIORITY).map(({ type, label, desc }): PriorityItem => ({
    type: type as TaskPriorityType,
    desc,
    label: `${label}优先级`,
    class: `priority-${type.toLowerCase()}`,
    selectedClass: `priority-${type.toLowerCase()}-selected`
  }))
})

const categoryList: readonly CategoryItem[] = Object.values(TASK_CATEGORY) as CategoryItem[]

// 使用类型断言和默认值
const taskFormData = reactive<TaskFormData>({
  text: '',
  desc: '',
  category: 'WORK' as TaskCategoryType,
  isReminder: false,
  deadlineDate: TimeUtils.format(new Date(), 'YYYY-MM-DD'),
  deadlineTime: TimeUtils.format(new Date(), 'hh:mm'),
  priority: 'HIGH' as TaskPriorityType,
  status: 'DOING' as const
})

const isEdit: Ref<boolean> = ref(false)
const editTaskId: Ref<string> = ref('')
// 使用 async/await 和错误处理
const initTaskDetail = async (): Promise<void> => {
  if (!isEdit.value || !editTaskId.value) return
  
  try {
    const res = await serverApi.getTaskDetail(editTaskId.value)
    if (res.success && res.data) {
      const { deadline, ...restData } = res.data
      Object.assign(taskFormData, restData, {
        deadlineDate: TimeUtils.format(deadline, 'YYYY-MM-DD'),
        deadlineTime: TimeUtils.format(deadline, 'hh:mm')
      })
    }
  } catch (error) {
    console.error('Failed to load task detail:', error)
  }
}

const handleBack = (): void => {
  uni.navigateBack()
}

// 使用函数重载和类型守卫
const updateFormFieldData = (
  e: Event, 
  field: keyof TaskFormData, 
  value?: string
): void => {
  const isFormField = ['text', 'desc', 'isReminder', 'deadlineDate', 'deadlineTime'].includes(field)
  const newValue = isFormField ? (e as any).detail.value : value
  
  if (newValue !== undefined) {
    (taskFormData as any)[field] = newValue
  }
}

// 使用 async/await 和错误处理
const handleSaveTask = async (): Promise<void> => {
  try {
    const { deadlineTime, deadlineDate, ...restFormData } = taskFormData
    const deadline = TimeUtils.combineDateTimeSafe(deadlineDate, deadlineTime)
    
    const saveFunc = isEdit.value ? serverApi.editTask : serverApi.addTask
    await saveFunc({ ...restFormData, deadline: new Date(deadline) } as any)
    
    await showToastWithPromise({
      title: '保存成功',
      icon: 'success',
      duration: 1500
    })
    
    if (isEdit.value) {
      uni.switchTab({ url: '/pages/home/home' })
    } else {
      uni.navigateBack()
    }
  } catch (error) {
    console.error('Failed to save task:', error)
  }
}

// 使用 debounce 的类型安全版本
const debounceUpdateFormFieldData = debounce(updateFormFieldData, 500)

onLoad((options?: Record<string, any>) => {
  const { id } = options || {}
  isEdit.value = Boolean(id)
  editTaskId.value = id || ''
  initTaskDetail()
})
</script>

<style scoped lang="less">
@import './add-task.less';
</style>