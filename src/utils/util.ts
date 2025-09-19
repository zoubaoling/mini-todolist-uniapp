import { ApiResponse, ShowModalOptions, UserInfo } from "../types"

export const formatTime = (date: Date) => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return (
    [year, month, day].map(formatNumber).join('/') +
    ' ' +
    [hour, minute, second].map(formatNumber).join(':')
  )
}

const formatNumber = (n: number) => {
  const s = n.toString()
  return s[1] ? s : '0' + s
}
export const nextTick = (): Promise<void> => {
  return new Promise((resolve) => {
    // @ts-ignore - uni-app 类型定义问题
    uni.nextTick(resolve)
  })
}

export const setDataAndWait = (page: any, data: any): Promise<void> => {
  return new Promise((resolve) => {
    page.setData(data, () => {
      // @ts-ignore - uni-app 类型定义问题
      uni.nextTick(resolve)
    })
  })
}
// 使用联合类型和字面量类型
export type ToastIcon = 'success' | 'error' | 'loading' | 'none'
export type ToastPosition = 'top' | 'center' | 'bottom'

export interface ToastOptions {
  title: string
  icon?: ToastIcon
  duration?: number
  position?: ToastPosition
  mask?: boolean
}

// 使用函数重载
export function showToast(options: ToastOptions): void
export function showToast(title: string, icon?: ToastIcon): void
export function showToast(
  optionsOrTitle: ToastOptions | string,
  icon: ToastIcon = 'none'
): void {
  const options = typeof optionsOrTitle === 'string' 
    ? { title: optionsOrTitle, icon }
    : optionsOrTitle
    
  uni.showToast(options)
}

export const showToastWithPromise = (options: any) => {
  return new Promise((resolve) => {
    let timer: any = null
    uni.showToast({
      ...options,
      success: () => {
        if (timer) clearTimeout(timer)
        timer = setTimeout(resolve, options.duration)
      }
    })
  })
}
export const getAccountInfo = () => {
  return uni.getAccountInfoSync()
}
// 小数转百分比
export const formatToPercentage = (num: number, precision: number = 0) => {
  return `${(num * 100).toFixed(precision)}%`
}
// API调用包装器，统一处理错误
export const apiWrapper = async <T>(
  apiCall: () => Promise<T>,
  options: {
    errorMessage?: string,
    loading?: boolean;
    loadingText?: string;
  } = {}
): Promise<ApiResponse<T>> => {
  const { loading = true, loadingText = '加载中', errorMessage = '接口调用失败' } = options;
  
  try {
    // 根据配置决定是否显示 loading
    if (loading) {
      uni.showLoading({
        title: loadingText,
        mask: true
      });
    }
    
    const data = await apiCall();
    
    // 隐藏 loading
    if (loading) {
      uni.hideLoading();
    }
    
    return {
      success: true,
      data
    };
  } catch (error) {
    // 隐藏 loading
    if (loading) {
      uni.hideLoading();
    }
    
    uni.showToast({
      title: errorMessage,
      icon: 'none',
      duration: 2000
    });
    
    return {
      success: false,
      message: error instanceof Error ? error.message : errorMessage
    };
  }
};
// 使用泛型和函数重载
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: number | null = null
  
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

// 使用更严格的类型
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastTime = 0
  let timeoutId: number | null = null
  
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastTime >= delay) {
      func(...args)
      lastTime = now
    } else {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        func(...args)
        lastTime = Date.now()
      }, delay)
    }
  }
}
export const showModal = ({
  title = '确认',
  content = '确定要删除该任务吗？',
  confirmText = '删除',
  confirmColor = '#FF4D4F',
  cancelText = '取消'
}: ShowModalOptions = {}): Promise<boolean> => {
  return new Promise((resolve) => {
    // @ts-ignore - 微信小程序 API
    wx.showModal({
      title,
      content,
      confirmText,
      confirmColor,
      cancelText,
      success: (res: any) => {
        resolve(res.confirm)
      }
    })
  })
}

// 个人中心相关工具函数
export const getDefaultUserStats = () => ({
  total: 0,
  completed: 0,
  doing: 0,
  continuousDays: 0,
  completionRate: 0
})

export const getDefaultUserInfo = () => ({})

// 使用类型守卫
export const isUserLoggedIn = (userInfo: unknown): userInfo is UserInfo => {
  return (
    typeof userInfo === 'object' &&
    userInfo !== null &&
    'openid' in userInfo &&
    typeof (userInfo as any).openid === 'string'
  )
}

// 使用映射类型和工具类型
export const extractUserInfoFromStorage = (storageData: unknown): UserInfo | null => {
  if (!storageData || typeof storageData !== 'object') return null
  
  const data = storageData as Record<string, any>
  
  if (data.userInfo && typeof data.userInfo === 'object') {
    return data.userInfo as UserInfo
  }
  
  if (typeof data.openid === 'string') {
    return data as UserInfo
  }
  
  return null
}
export const px2rpx = (px: number) => {
  const systemInfo = uni.getSystemInfoSync()
  return px * (750 / systemInfo.windowWidth)
}