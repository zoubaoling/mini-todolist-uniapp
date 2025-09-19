export enum TaskStatus {
  DOING = '进行中',
  COMPLETED = '已完成',
  TOTAL = '总任务'
}

export enum TaskCategory {
  WORK = '工作',
  LIFE = '生活',
  LEARN = '学习',
  HEALTH = '健康',
  ENTERTAINMENT = '娱乐',
  SHOPPING = '购物'
}

export enum TaskPriority {
  HIGH = '高',
  MEDIUM = '中',
  LOW = '低'
}

// 使用联合类型提高类型安全
export type TaskStatusType = keyof typeof TaskStatus
export type TaskCategoryType = keyof typeof TaskCategory
export type TaskPriorityType = keyof typeof TaskPriority

// 更严格的接口定义
export interface TaskItem {
  readonly _id: string
  text: string
  desc?: string
  category: TaskCategoryType
  isReminder: boolean
  deadline?: Date
  readonly createTime: Date
  completedTime?: Date
  priority: TaskPriorityType
  status: TaskStatusType
  author: {
    readonly openid: string
  }
}
export interface TaskListParams {
  userId: string
  category?: TaskCategoryType
  search?: string
  pageSize?: number
  pageNum?: number
  sortOrder?: 'asc' | 'desc'
}

export type DateType = 'DAY' | 'WEEK' | 'MONTH' | 'ALL'

export interface TaskOverview {
  total: number
  completed: number
  doing: number
  completionRate: number
  continuousDays?: number
}

export interface TaskCategoryCompletion {
  category: TaskCategoryType
  completionRate: number
  total?: number
  completed?: number
}

// 使用泛型约束
export interface ApiResponse<T = unknown> {
  readonly success: boolean
  readonly data?: T
  readonly message?: string
}

// 使用映射类型
export type TaskFormData = Omit<TaskItem, '_id' | 'createTime' | 'author'> & {
  deadlineDate: string
  deadlineTime: string
}

// 使用条件类型
export type TaskListResponse = ApiResponse<{
  list: TaskItem[]
  total: number
  pageNum: number
  pageSize: number
}>

// 使用工具类型
export type PartialTaskItem = Partial<Pick<TaskItem, 'text' | 'desc' | 'category' | 'priority'>>
export interface ShowModalOptions {
  title?: string
  content?: string
  confirmText?: string
  confirmColor?: string
  cancelText?: string
}
export interface ServerApiConfigOptions {
  loading?: boolean
  loadingText?: string,
  errorMessage?: string
}

// 用户信息相关接口
export interface UserInfo {
  readonly _id?: string
  readonly openid?: string
  nickName?: string
  avatarUrl?: string
  readonly createTime?: string
  readonly updateTime?: string
  isActive?: boolean
}

// 使用类型守卫
export const isUserLoggedIn = (userInfo: unknown): userInfo is UserInfo => {
  return (
    typeof userInfo === 'object' &&
    userInfo !== null &&
    'openid' in userInfo &&
    typeof (userInfo as any).openid === 'string'
  )
}
