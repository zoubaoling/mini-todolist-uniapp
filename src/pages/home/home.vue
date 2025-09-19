<template>
<view class="home-page">
  <!-- header -->
  <navigator-bar title="智能待办清单" subTitle="让生活更有序"></navigator-bar>
  <view class="home-content">
    <!-- 任务概览 -->
    <view class="task-overview">
      <view v-for="item in overviewData" :key="item.label"
        class="overview-item">
        <text class="overview-item-value">{{item.value}}</text>
        <text class="overview-item-label">{{item.label}}</text>
      </view>
    </view>
    <!-- 任务列表 -->
    <view class="task-content">
      <!-- 过滤器 -->
      <view class="filter-content">
        <!-- 搜索框 -->
        <view class="search-input-container">
          <input
            class="search-input"
            placeholder="搜索任务..."
            placeholder-class="search-input__placeholder"
            v-model.trim="searchTaskValue"
            @confirm="handleSearchTask"
            @input="debounceSearchTask"
            confirm-type="search"
          />
          <!-- 清除按钮 -->
          <view 
            v-if="searchTaskValue"
            class="search-clear-btn"
            @click="clearSearch"
          >
            <text class="search-clear-icon">×</text>
          </view>
        </view>
        
        <view class="search-tabs">
          <view
            v-for="item in searchTaskTabs"
            :key="item.type"
            @click="handleSearchTabTap(item)"
            class="search-tab"
            :class="{ 'search-tab-active': selectedSearchTaskTab === item.type }"
            >
            <text>{{item.label}}</text>
          </view>
        </view>
      </view>
        <scroll-view 
        class="task-list"
        scroll-y
        enhanced
        :show-scrollbar="true"
        :refresher-enabled="true"
        @scroll="handleScroll"
        >
        <!-- 任务列表 -->
        <template v-for="item in taskList" :key="item._id" v-if="taskList.length > 0">
          <t-swipe-cell
            catch:touchmove="noop"
            >
            <view
              class="task-item"
              :class="item.itemClass"
              @click="navigateToTaskDetail(item)"
              >
              <view class="task-header">
                <!-- todo: 任务完成后，划线灰质禁止操作 -->
                <view class="radio-group">
                  <label class="radio-item">
                    <radio 
                      class="radio-item-radio" 
                      color="#667eea"
                      :value="item.id"
                      :checked="item.status === 'COMPLETED'"
                      @click="handleTaskStatusChange(item)"
                    />
                    <text class="radio-item-text" :class="[item.textClass]">{{item.text}}</text>
                  </label>
                </view>
                <view class="task-priority" :class="[item.priorityClass, item.textClass]">{{item.priorityLabel}}</view>
              </view>
              <view class="task-meta">
                <!-- 已完成、未完成的时间 -->
                <view class="task-date">
                  <image src="/src/static/images/date.png" class="task-date-icon" />
                  <text class="task-date-text" :class="item.dateClass">{{ item.status === 'COMPLETED' ? '已完成' : item.date}}</text>
                </view>
                <view class="task-category" :class="item.categoryClass">{{item.categoryLabel}}</view>
              </view>
            </view>
            <view slot="right" class="right-slot">
              <view v-if="item.isEditable" class="btn edit-btn column" @click="onSwipeCellEditClick(item._id)">
                编辑
              </view>
              <view class="btn delete-btn column" @click="onSwipeCellDeleteClick(item._id)">
                删除
              </view>
            </view>
          </t-swipe-cell>
        </template>
        <!-- 空状态 -->
        <view v-if="taskList.length === 0" class="empty-state">
          <view class="empty-state-icon">
            <text class="empty-icon">📝</text>
          </view>
          <view class="empty-state-title">暂无任务</view>
          <view class="empty-state-desc">
            <text v-if="selectedSearchTaskTab === 'ALL'">还没有创建任何任务，快去添加第一个任务吧！</text>
            <text v-else>当前分类下暂无任务，试试其他分类或创建新任务</text>
          </view>
          <button class="empty-state-btn" @click="navigateToAddTask">
            <text>+ 添加任务</text>
          </button>
        </view>
      </scroll-view>
    </view>
  </view>
  
  <!-- 悬浮按钮：只在有任务时显示 -->
  <button 
    v-if="taskList.length > 0" 
    class="floating-add-btn" 
    @click="navigateToAddTask"
  >
    <text>+</text>
  </button>
</view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app'
import { TASK_CATEGORY, TASK_MAPS,  } from '../../constants/index'
import { TaskStatus, TaskPriority, TaskItem } from '../../types/index'
import { debounce, formatToPercentage, showModal } from '../../utils/util'
import TimeUtils from '../../utils/timer'
import * as serverApi from '../../server/index'

const overviewData = reactive([])
const searchTaskValue = ref('')
const selectedSearchTaskTab = ref('ALL')
const taskList = reactive([])


const getOverviewData = async () => {
  const res = await serverApi.getTaskOverview()
    if (res.success && res.data) {
      const { total, completed, doing, completionRate } = res.data as any
      Object.assign(overviewData, [
        { label: TaskStatus.TOTAL, value: total },
        { label: TaskStatus.COMPLETED, value: completed },
        { label: TaskStatus.DOING, value: doing },
        { label: '完成率', value: formatToPercentage(completionRate) }
      ])
    }
}

const getTaskList = async (params?: any = { category: 'ALL' }) => {
  try {
    const res = await serverApi.getTaskList(params)
    if (res.success && res.data) {
      const list: Array<TaskItem> = (res.data as any)?.list?.map((item: any) => {
        const isCompleted = item.status === 'COMPLETED'
        const isExpired = TimeUtils.isExpired(item.deadline)
        const isEditable = !isCompleted && !isExpired
        return {
          ...item,
          categoryLabel: TASK_MAPS.category[item.category as keyof typeof TASK_MAPS.category],
          priorityLabel: `${TASK_MAPS.priority[item.priority as keyof typeof TASK_MAPS.priority]}优先级`,
          priorityClass: `priority-${item.priority.toLowerCase()} ${isCompleted && 'line-through'}`,
          textClass: !isEditable && 'line-through',
          categoryClass: !isEditable && 'line-through',
          dateClass: !isEditable && 'line-through',
          itemClass: !isEditable && 'task-item-completed',
          date: TimeUtils.formatDate(item.deadline),
          // 是否过期
          isExpired,
          isEditable
        }
      }) || []
      taskList.splice(0, taskList.length, ...list)
    } else {
      // API 调用失败时显示空列表
      taskList.splice(0, taskList.length)
    }
  } catch (error) {
    // 出错时显示空列表
    taskList.splice(0, taskList.length)
  }
}

const clearSearch = () => {
  searchTaskValue.value = ''
  getTaskList()
}

const searchTaskTabs = computed(() => {
  return [
    { type: 'ALL', label: '全部' },
    ...Object.values(TASK_CATEGORY).map(({type, label}) => ({type, label}))
  ]
})
const handleSearchTabTap = (item) => {
  const { type } = item
  selectedSearchTaskTab.value = type
  getTaskList({ category: type })
}

const handleSearchTask = () => {
  getTaskList({ search: searchTaskValue.value })
}

const handleTaskStatusChange = async (item: TaskItem) => {
  const { status, id, isEditable } = item
  if (!isEditable) return
  if (status === 'COMPLETED') return
  const newStatus: keyof typeof TaskStatus = status === 'DOING' ? 'COMPLETED' : 'DOING'
  // 调用服务器API更新状态
  await serverApi.updateTaskStatus(id, newStatus)
  getTaskList({ category: selectedSearchTaskTab.value })
}
const navigateToAddTask = () => {
  uni.navigateTo({
    url: '/pages/add-task/add-task'
  })
}
const navigateToTaskDetail = (item: TaskItem) => {
  const { _id, isEditable } = item
  if (!isEditable) return
  uni.navigateTo({
    url: `/pages/task-detail/task-detail?id=${_id}`
  })
}
const handleScroll = (e: any) => {
}
const onSwipeCellEditClick = (id: string) => {
  uni.navigateTo({
    url: `/pages/add-task/add-task?id=${id}`
  })
}
const onSwipeCellDeleteClick = async (id: string) => {
  const confirm = await showModal()
  if (confirm) {
    await serverApi.deleteTask(id, { loading: true, loadingText: '删除中...' })
    getTaskList()
  }
}
const getPageData = () => {
  getOverviewData()
  getTaskList()

}
onMounted(() => {
  getPageData()
})
onShow(() => {
  getPageData()
})
const debounceSearchTask = debounce(handleSearchTask, 500)
</script>

<style lang="less" scoped>
@import './home.less';
</style>