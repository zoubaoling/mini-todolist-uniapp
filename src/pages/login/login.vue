<template>
  <view class="login-page">
    <navigator-bar title="智能待办清单" subTitle="让生活更有序，让工作更高效"></navigator-bar>
    <view class="login-content">
      <view class="login-welcome flex-column-center">
        <view class="login-welcome-title">
          欢迎使用
        </view>
        <view class="login-welcome-desc">
          使用微信账号登陆，您的数据将保存在云端，多设备同步。
        </view>
      </view>
        <t-button class="login-button flex-row-center" @tap="onLogin">
          <text>微信账号登陆</text>
        </t-button>
    </view>
    <view class="login-welcome-privacy flex-column-center">
      <text class="privacy-title">隐私说明</text>
      <text class="privacy-desc">
        我们仅获取您的微信昵称和头像，您的任务数据仅用于提供服务，不会用于其他用途
      </text>
    </view>
</view>
<t-toast id="t-toast" ref="toastRef" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import NavigatorBar from '@/components/navigator-bar/navigatorBar.vue';
import { userLogin } from '../../server/index';

const toastRef = ref('')
const showToast = (message: string, theme: string) => {
  if (toastRef.value) {
    toastRef.value.show({
      message: message,
      theme: theme || 'success'
    })
  } else {
    uni.showToast({
      title: message,
      icon: theme === 'error' ? 'none' : 'success'
    })
  }
}
const getUserProfile = () => {
  return new Promise((resolve, reject) => {
    uni.getUserProfile({
      desc: '获取用户信息',
      success: resolve,
      fail: reject
    })
  })
}
const getLoginCode = () => {
  return new Promise((resolve, reject) => {
    uni.login({
      desc: '获取用户信息',
      success: resolve,
      fail: reject
    })
  })
}
const saveUserData = (userInfo: any, isNewUser: boolean) => {
  uni.setStorageSync('userInfo', userInfo)
  uni.setStorageSync('isNewUser', isNewUser)
}
const onLogin = async () => {
  try {
    showToast('登陆中...', 'loading')
    // 1. 获取用户信息授权
    const { userInfo } = await getUserProfile() as { userInfo: object }
    // 2. 获取微信登录凭证
    const { code: loginCode } = await getLoginCode() as { code: string }
    // 3. 调用云函数处理了登陆
    const loginRes = await userLogin({ userInfo, loginCode })
    // 4. 处理用户数据
    saveUserData(loginRes.data, loginRes.data.isNewUser)
    showToast('登陆成功', 'success')

    uni.switchTab({
      url: '/pages/home/home'
    })
  } catch (error) {
    console.log('error', error)
  }
}
</script>

<style scoped lang="less">
@import './login.less';
</style>