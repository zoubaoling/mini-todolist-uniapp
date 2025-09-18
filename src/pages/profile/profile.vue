<template>
<view class="profile-page">
  <!-- 用户信息头部 -->
  <view class="profile-header">
    <view class="user-info">
      <view class="avatar-container" @click="handleAvatarTap">
        <image 
          class="user-avatar" 
          :src="userInfo.avatarUrl || defaultAvatarUrl"
          mode="aspectFill"
          @error="handleAvatarError"
          :show-menu-by-longpress="false"
          :lazy-load="true"
        />
        <view class="avatar-edit-icon">📷</view>
      </view>
      <view class="user-details">
        <view class="nickname-container" @click="handleNicknameTap">
          <text class="user-name">{{userInfo.nickName || '未登录'}}</text>
          <view class="edit-icon">✏️</view>
        </view>
      </view>
    </view>
  </view>

  <!-- 数据统计卡片 -->
  <view class="stats-section">
    <view class="stats-grid">
      <view class="stat-card">
        <text class="stat-number">{{userStats.total || 0}}</text>
        <text class="stat-label">总任务数</text>
      </view>
      <view class="stat-card">
        <text class="stat-number">{{userStats.completed || 0}}</text>
        <text class="stat-label">已完成</text>
      </view>
      <view class="stat-card">
        <text class="stat-number">{{userStats.continuousDays || 0}}</text>
        <text class="stat-label">连续天数</text>
      </view>
      <view class="stat-card">
        <text class="stat-number">{{userStats.completionRateStr || '0%'}}</text>
        <text class="stat-label">完成率</text>
      </view>
    </view>
  </view>

  <!-- 功能菜单 -->
  <view class="menu-section">
    <view v-for="item in menuConfig" :key="item.title" class="menu-group">
      <view class="menu-group-title">{{item.title}}</view>
      <view v-for="menuItem in item.items" :key="menuItem.text" class="menu-item" @click="menuItem.action">
        <view class="menu-icon">{{menuItem.icon}}</view>
        <text class="menu-text">{{menuItem.text}}</text>
        <view class="menu-arrow">></view>
      </view>
    </view>
  </view>


  <!-- 退出登录按钮 -->
  <view class="logout-section">
    <button class="logout-btn" @click="handleLogout">
      退出登录
    </button>
  </view>

  <!-- 登录提示弹窗 -->
  <view v-if="showLoginModal" class="login-modal-overlay" @click="closeLoginModal">
    <view class="login-modal" @click.stop="stopPropagation">
      <view class="login-modal-title">需要登录</view>
      <view class="login-modal-content">请先登录以查看您的个人数据</view>
      <view class="login-modal-actions">
        <button class="login-modal-btn primary" @click="goToLogin">去登录</button>
        <button class="login-modal-btn secondary" @click="closeLoginModal">取消</button>
      </view>
    </view>
  </view>

  <!-- 昵称编辑弹窗 -->
  <view v-if="showNicknameDialog" class="nickname-modal-overlay">
    <view class="nickname-modal">
      <view class="nickname-modal-title">修改昵称</view>
      <view class="nickname-input-container">
        <input
          class="nickname-input"
          v-model="editingNickname"
          placeholder="请输入昵称"
          maxlength="20"
          @input="handleNicknameInputChange"
          @blur="handleNicknameInputChange"
          :focus="showNicknameDialog"
          confirm-type="done"
        />
      </view>
      <view class="nickname-modal-actions">
        <button class="nickname-modal-btn secondary" @click="handleNicknameCancel">取消</button>
        <button class="nickname-modal-btn primary" @click="handleNicknameConfirm">保存</button>
      </view>
    </view>
  </view>
</view>
</template>

<script setup lang="ts">
import { reactive, ref, toRaw } from 'vue';
import { onLoad, onShow, onHide } from '@dcloudio/uni-app'
import defaultAvatarUrl from '/static/images/default-avatar.png';
import { showModal, showToast, getDefaultUserStats, getDefaultUserInfo, isUserLoggedIn, extractUserInfoFromStorage, formatToPercentage } from '../../utils/util'
import { getUserInfo, getTaskOverview, backupUserData, syncUserData, getBackupHistory, logout, updateUserInfo } from '../../server/index'
import { UserInfo, TaskOverview } from '../../types/index'
import { PROFILE_MENU_CONFIG } from '../../constants/index'

const userInfo: UserInfo = reactive(getDefaultUserInfo())
const userStats: TaskOverview = reactive(getDefaultUserStats())
const showLoginModal = ref(false)
const isLoggedIn = ref(false)
const menuConfig = ref(PROFILE_MENU_CONFIG)
const showNicknameDialog = ref(false)
const editingNickname = ref('')

  // 处理头像URL
const processAvatarUrl = (userData: any) => {
  if (!userData.avatarUrl) {
    return userData
  }
  const avatarUrl = userData.avatarUrl
  
  // 检查是否是微信头像URL
  if (avatarUrl.includes('thirdwx.qlogo.cn')) {
    // 微信头像URL可能需要特殊处理
    // 方案1: 尝试添加尺寸参数
    const processedUrl = avatarUrl + '?x-oss-process=image/resize,w_200,h_200'
    return {
      ...userData,
      avatarUrl: processedUrl,
      originalAvatarUrl: avatarUrl // 保存原始URL作为备用
    }
  }
  return userData
}
  // 设置用户数据 - 统一的数据设置方法
const setUserData = (userData: any) => {
  if (isUserLoggedIn(userData)) {
    // 处理微信头像URL
    const processedUserData = processAvatarUrl(userData)
    Object.assign(userInfo, processedUserData)
    isLoggedIn.value = true
    showLoginModal.value = false
  } else {
    Object.assign(userInfo, getDefaultUserInfo())
    isLoggedIn.value = false
    showLoginModal.value = true
  }
}
// 刷新用户数据 - 从云端获取最新数据
const loadUserData = async () => {
  try {
    const res = await getUserInfo({ loading: false })
    if (res.success && res.data) {
      // 保存到本地存储，保持与登录时一致的数据结构
      uni.setStorageSync('userInfo', res.data)
      uni.setStorageSync('isNewUser', false)
      setUserData(res.data)
    } else {
      setUserData(null)
    }
  } catch (error) {
  }
}
// 初始化用户数据 - 统一的用户数据获取方法
const initUserData = async () => {
  try {
    // 1. 先尝试从本地存储获取
    const localData = uni.getStorageSync('userInfo')
    // 处理本地存储的数据结构
    const localUserInfo = extractUserInfoFromStorage(localData)
    
    if (isUserLoggedIn(localUserInfo)) {
      // 本地有数据，直接使用
      setUserData(localUserInfo)
    }
    // 2. 本地无数据，从云端获取
    loadUserData()
  } catch (error) {
    setUserData(null)
  }
}
// 加载用户统计
const loadUserStats = async () => {
  try {
    const res = await getTaskOverview()
    if (res.success && res.data) {
      const statsData = res.data
      Object.assign(userStats, {
        ...statsData,
        completionRateStr: formatToPercentage(statsData.completionRate)
      })
    } else {
      // 设置默认统计数据
      Object.assign(userStats, getDefaultUserStats())
    }
  } catch (error) {
    // 设置默认统计数据
    Object.assign(userStats, getDefaultUserStats())
  }
}
// 处理昵称输入变化

const handleNicknameInputChange = (e) => {
  editingNickname.value = e.detail.value
}

// 确认修改昵称
const handleNicknameConfirm = async () => {
  const newNickname = editingNickname.value.trim()
  if (!newNickname) {
    showToast({
      title: '昵称不能为空',
      icon: 'error'
    })
    return
  }

  if (newNickname.length > 20) {
    showToast({
      title: '昵称不能超过20个字符',
      icon: 'error'
    })
    return
  }

  uni.showLoading({ title: '保存中...' })

  try {
    // 先调用云函数更新云端数据
    const res = await updateUserInfo({ nickName: newNickname })

    if (res.success) {
      // 云端更新成功，更新本地数据
      const updatedUserInfo = {
        ...toRaw(userInfo),
        nickName: newNickname
      }

      // 更新本地存储
      uni.setStorageSync('userInfo', updatedUserInfo)

      // 更新页面数据
      Object.assign(userInfo, updatedUserInfo)
      showNicknameDialog.value = false

      uni.hideLoading()
      showToast({
        title: '昵称修改成功',
        icon: 'success'
      })
    } else {
      uni.hideLoading()
      showToast({
        title: res.message || '昵称修改失败',
        icon: 'error'
      })
    }
  } catch (error) {
    uni.hideLoading()
    console.error('修改昵称失败:', error)
    showToast({
      title: '修改昵称失败',
      icon: 'error'
    })
  }
}

// 取消修改昵称
const handleNicknameCancel = () => {
  showNicknameDialog.value = false
  editingNickname.value = ''
}

// 处理头像加载错误
const handleAvatarError = () => {
  setDefaultAvatar()
}

// 设置默认头像
const setDefaultAvatar = () => {
  Object.assign(userInfo, { avatarUrl: defaultAvatarUrl })
}

// 跳转到统计页面
const navigateToStats = () => {
  if (!isLoggedIn.value) {
    showLoginModal.value = true
    return
  }
  uni.switchTab({
    url: '/pages/stats/stats'
  })
}
 // 跳转到登录页
const goToLogin = () => {
  uni.navigateTo({
    url: '/pages/login/login'
  })
}
// 关闭登录弹窗
const closeLoginModal = () => {
  showLoginModal.value = false
}
// 上传头像
const uploadAvatar = async (filePath: string) => {
  uni.showLoading({ title: '上传中...' })
  try {
    // 先上传到云存储
    const cloudPath = `avatars/todoList_${userInfo.openid}_${Date.now()}.jpg`
    const uploadResult = await uni.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath
    })
    if (uploadResult.fileID) {
      // 上传成功，更新云端用户信息
      const res = await updateUserInfo({ avatarUrl: uploadResult.fileID })
      
      if (res.success) {
        // 云端更新成功，更新本地数据
        // 更新本地存储
        uni.setStorageSync('userInfo', userInfo)
        // 更新页面数据
        Object.assign(userInfo, {
          avatarUrl: uploadResult.fileID
        })
        
        uni.hideLoading()
        showToast({
          title: '头像更新成功',
          icon: 'success'
        })
      } else {
        uni.hideLoading()
        showToast({
          title: res.message || '头像更新失败',
          icon: 'error'
        })
      }
    } else {
      uni.hideLoading()
      showToast({
        title: '头像上传失败',
        icon: 'error'
      })
    }
  } catch (error) {
    uni.hideLoading()
    console.error('上传头像失败:', error)
    showToast({
      title: '上传头像失败',
      icon: 'error'
    })
  }
}
// 选择图片的通用方法
const chooseImage = (sourceType: ('album' | 'camera')[], errorMessage: string) => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: sourceType,
    success: (res) => {
      uploadAvatar(res.tempFilePaths[0])
    },
    fail: (error) => {
      console.error(`${errorMessage}失败:`, error)
      showToast({
        title: errorMessage,
        icon: 'error'
      })
    }
  })
}
 // 显示原生action-sheet
const showNativeActionSheet = () => {
  uni.showActionSheet({
    itemList: ['拍照', '从相册选择'],
    success: (res) => {
      if (res.tapIndex === 0) {
        // 拍照
        chooseImage(['camera'], '拍照失败')
      } else if (res.tapIndex === 1) {
        // 从相册选择
        chooseImage(['album'], '选择图片失败')
      }
    },
    fail: () => {
      // 用户取消或操作失败，无需处理
    }
  })
}

// 处理昵称点击
const handleNicknameTap = () => {
  if (!isLoggedIn.value) {
    showLoginModal.value = true
    return
  }
  
  const currentNickname = userInfo.nickName || ''
  showNicknameDialog.value = true
  editingNickname.value = currentNickname
}


// 处理头像点击
const handleAvatarTap = () => {
  if (!isLoggedIn.value) {
    showLoginModal.value = true
    return
  }
  
  // 使用原生action-sheet
  showNativeActionSheet()
}

// 退出登录
const handleLogout = async () => {
  if (!isLoggedIn.value) {
    showLoginModal.value = true
    return
  }

  const confirm = await showModal({
    title: '确认退出',
    confirmText: '确定',
    content: '确定要退出登录吗？退出后需要重新登录才能查看您的数据。'
  })

  if (confirm) {
    try {
      await logout()
      // 清除本地存储
      uni.removeStorageSync('userInfo')
      uni.removeStorageSync('isNewUser')
      
      Object.assign(userInfo, getDefaultUserInfo())
      Object.assign(userStats, getDefaultUserStats())
      isLoggedIn.value = false
      showLoginModal.value = false
      showToast({
        title: '已退出登录',
        icon: 'success'
      })
      uni.redirectTo({
        url: '/pages/login/login'
      })
    } catch (error) {
      showToast({
        title: '退出登录失败',
        icon: 'error'
      })
    }
  }
}
onLoad(async () => {
  await initUserData()
  loadUserStats()
})
onShow(async () => {
// 只在用户信息为空时才重新初始化
  if (!isLoggedIn.value) {
    await initUserData()
    loadUserStats()
  }
})
// ------------------未完成的功能------------------
 // 数据备份
// 数据备份
const handleDataBackup = async () => {
  if (!isLoggedIn.value) {
    showLoginModal.value = true
    return
  }

    // 显示备份选项
    const action = await showModal({
      title: '数据备份',
      content: '选择备份方式：\n1. 云端备份 - 将数据保存到云端\n2. 本地下载 - 下载备份文件到本地',
      confirmText: '云端备份',
      cancelText: '本地下载'
    }) as any

  try {
    if (action.confirm) {
      // 云端备份
      await performCloudBackup()
    } else {
      // 本地下载
      await performLocalBackup()
    }
  } catch (error) {
    console.error('备份失败:', error)
    showToast({
      title: '备份失败',
      icon: 'error'
    })
  }
}

// 云端备份
const performCloudBackup = async () => {
  uni.showLoading({ title: '备份中...' })

  try {
    const res = await backupUserData()

    if (res.success) {
      uni.hideLoading()
      showToast({
        title: '云端备份成功',
        icon: 'success'
      })

      // 更新用户最后备份时间
      updateLastBackupTime()
    } else {
      uni.hideLoading()
      showToast({
        title: res.message || '云端备份失败',
        icon: 'error'
      })
    }
  } catch (error) {
    uni.hideLoading()
    console.error('云端备份异常:', error)
    showToast({
      title: '云端备份失败',
      icon: 'error'
    })
  }
}

// 本地备份下载
const performLocalBackup = async () => {
  uni.showLoading({ title: '准备备份文件...' })

  try {
    // 获取本地任务数据
    const localTasks = uni.getStorageSync('taskList') || []

    // 构建备份数据
    const backupData = {
      userInfo: toRaw(userInfo),
      userStats: toRaw(userStats),
      tasks: localTasks,
      backupTime: new Date().toISOString(),
      version: '1.0',
      totalTasks: localTasks.length
    }

    // 生成备份文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `todo-backup-${timestamp}.json`

    // 将数据转换为 JSON 字符串
    const jsonData = JSON.stringify(backupData, null, 2)

    // #ifdef MP-WEIXIN
    // 创建临时文件
    const fs = uni.getFileSystemManager()
    const tempFilePath = `${uni.env.USER_DATA_PATH}/${fileName}`

    fs.writeFileSync(tempFilePath, jsonData, 'utf8')

    uni.hideLoading()

    // 尝试保存文件到本地
    uni.saveFile({
      tempFilePath,
      success: () => {
        showToast({
          title: '备份文件已保存',
          icon: 'success'
        })
      },
      fail: (error) => {
        console.error('文件保存失败:', error)
        showToast({
          title: '请手动保存文件',
          icon: 'none'
        })
      }
    })
    // #endif

    // #ifndef MP-WEIXIN
    // H5/APP端可直接下载
    const blob = new Blob([jsonData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    uni.hideLoading()
    showToast({
      title: '备份文件已下载',
      icon: 'success'
    })
    // #endif

  } catch (error) {
    uni.hideLoading()
    console.error('本地备份失败:', error)
    showToast({
      title: '本地备份失败',
      icon: 'error'
    })
  }
}

// 更新最后备份时间
const updateLastBackupTime = () => {
  Object.assign(userInfo, { lastBackupTime: new Date().toISOString() })

  // 保存到本地存储
  uni.setStorageSync('userInfo', userInfo)
}

// 查看备份历史
const handleViewBackupHistory = async () => {
  if (!isLoggedIn.value) {
    showLoginModal.value = true
    return
  }

  uni.showLoading({ title: '加载中...' })

  try {
    const res = await getBackupHistory()

    if (res.success && res.data) {
      const { backups } = res.data

      if (!backups || backups.length === 0) {
        uni.hideLoading()
        showToast({
          title: '暂无备份记录',
          icon: 'none'
        })
        return
      }

      // 显示备份历史
      showBackupHistory(backups)
    } else {
      uni.hideLoading()
      showToast({
        title: '获取备份历史失败',
        icon: 'error'
      })
    }
  } catch (error) {
    uni.hideLoading()
    console.error('获取备份历史失败:', error)
    showToast({
      title: '获取备份历史失败',
      icon: 'error'
    })
  }
}

// 显示备份历史
const showBackupHistory = (backups: any[]) => {
  const historyText = backups.map((backup, index) => {
    const time = new Date(backup.backupTime).toLocaleString()
    const status = backup.status === 'success' ? '✅' : '❌'
    return `${index + 1}. ${time} ${status} (${backup.totalTasks}个任务)`
  }).join('\n')

  showModal({
    title: '备份历史记录',
    content: historyText,
    confirmText: '确定'
  })
}

// 数据同步
const handleDataSync = async () => {
  if (!isLoggedIn.value) {
    showLoginModal.value = true
    return
  }

    // 显示同步选项
    const action = await showModal({
      title: '数据同步',
      content: '选择同步方式：\n1. 从云端同步 - 下载云端最新数据\n2. 上传到云端 - 上传本地数据到云端\n3. 双向同步 - 智能合并本地和云端数据',
      confirmText: '从云端同步',
      cancelText: '双向同步'
    }) as any

  try {
    if (action.confirm) {
      // 从云端同步
      await performCloudSync()
    } else {
      // 双向同步
      await performBidirectionalSync()
    }
  } catch (error) {
    console.error('同步失败:', error)
    showToast({
      title: '同步失败',
      icon: 'error'
    })
  }
}

// 从云端同步
const performCloudSync = async () => {
  uni.showLoading({ title: '同步中...' })

  try {
    const res = await syncUserData()

    if (res.success) {
      // 保存云端数据到本地
      const { userInfo: cloudUserInfo, tasks } = res.data

      // 更新本地用户信息
      if (cloudUserInfo) {
        Object.assign(userInfo, cloudUserInfo)
        uni.setStorageSync('userInfo', cloudUserInfo)
      }

      // 更新本地任务数据
      if (tasks && tasks.length > 0) {
        uni.setStorageSync('taskList', tasks)
      }

      uni.hideLoading()
      showToast({
        title: '云端同步成功',
        icon: 'success'
      })

      // 重新加载用户统计
      await loadUserStats()
    } else {
      uni.hideLoading()
      showToast({
        title: res.message || '云端同步失败',
        icon: 'error'
      })
    }
  } catch (error) {
    uni.hideLoading()
    console.error('云端同步异常:', error)
    showToast({
      title: '云端同步失败',
      icon: 'error'
    })
  }
}

// 双向同步
const performBidirectionalSync = async () => {
  uni.showLoading({ title: '智能同步中...' })

  try {
    // 获取本地数据
    const localTasks = uni.getStorageSync('taskList') || []

    // 获取云端数据
    const cloudRes = await syncUserData()

    if (!cloudRes.success) {
      uni.hideLoading()
      showToast({
        title: '获取云端数据失败',
        icon: 'error'
      })
      return
    }

    const { userInfo: cloudUserInfo, tasks: cloudTasks } = cloudRes.data

    // 智能合并用户信息
    const mergedUserInfo = mergeUserInfo(toRaw(userInfo), cloudUserInfo)

    // 智能合并任务数据
    const mergedTasks = mergeTasks(localTasks, cloudTasks || [])

    // 保存合并后的数据
    Object.assign(userInfo, mergedUserInfo)
    uni.setStorageSync('userInfo', mergedUserInfo)
    uni.setStorageSync('taskList', mergedTasks)

    uni.hideLoading()
    showToast({
      title: '双向同步成功',
      icon: 'success'
    })

    // 重新加载用户统计
    await loadUserStats()

  } catch (error) {
    uni.hideLoading()
    console.error('双向同步失败:', error)
    showToast({
      title: '双向同步失败',
      icon: 'error'
    })
  }
}

// 合并用户信息
const mergeUserInfo = (local: any, cloud: any) => {
  if (!cloud) return local
  if (!local) return cloud

  // 优先使用最新的数据
  const localTime = new Date(local.lastSyncTime || local.createTime || 0)
  const cloudTime = new Date(cloud.lastSyncTime || cloud.createTime || 0)

  if (cloudTime > localTime) {
    return {
      ...local,
      ...cloud,
      lastSyncTime: new Date().toISOString()
    }
  }

  return {
    ...cloud,
    ...local,
    lastSyncTime: new Date().toISOString()
  }
}

// 合并任务数据
const mergeTasks = (localTasks: any[], cloudTasks: any[]) => {
  const taskMap = new Map<string, any>()

  // 添加本地任务
  localTasks.forEach(task => {
    if (task._id) {
      taskMap.set(task._id, { ...task, source: 'local' })
    }
  })

  // 合并云端任务
  cloudTasks.forEach(task => {
    if (task._id) {
      const existingTask = taskMap.get(task._id)
      if (existingTask) {
        // 存在冲突，选择最新的
        const localTime = new Date(existingTask.updateTime || existingTask.createTime || 0)
        const cloudTime = new Date(task.updateTime || task.createTime || 0)

        if (cloudTime > localTime) {
          taskMap.set(task._id, { ...task, source: 'cloud' })
        } else {
          taskMap.set(task._id, { ...existingTask, source: 'local' })
        }
      } else {
        // 云端独有的任务
        taskMap.set(task._id, { ...task, source: 'cloud' })
      }
    }
  })

  return Array.from(taskMap.values()).map(task => {
    // 移除 source 字段
    const { source, ...cleanTask } = task
    return cleanTask
  })
}

// 提醒设置
const handleNotificationSettings = () => {
  if (!isLoggedIn.value) {
    showLoginModal.value = true
    return
  }

  showToast({
    title: '功能开发中',
    icon: 'none'
  })
}

// 主题设置
const handleThemeSettings = () => {
  if (!isLoggedIn.value) {
    showLoginModal.value = true
    return
  }
  showToast({
    title: '功能开发中',
    icon: 'none'
  })
}

// 隐私设置
const handlePrivacySettings = () => {
  if (!isLoggedIn.value) {
    showLoginModal.value = true
    return
  }
  showToast({
    title: '功能开发中',
    icon: 'none'
  })
}

// 使用帮助
const handleHelp = () => {
  showToast({
    title: '功能开发中',
    icon: 'none'
  })
}

// 意见反馈
const handleFeedback = () => {
  showToast({
    title: '功能开发中',
    icon: 'none'
  })
}

// 关于我们
const handleAbout = () => {
  showModal({
    title: '关于我们',
    content: '智能待办清单 v1.0\n\n一个简洁高效的任务管理小程序，帮助您更好地管理日常任务。'
  })
}
</script>

<style scoped lang="less">
@import './profile.less';
</style>