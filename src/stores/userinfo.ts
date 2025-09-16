import { defineStore } from "pinia";
import { ref, reactive } from 'vue'
export const useUserInfoStore = defineStore('userInfo', () => {
  const userInfo = reactive({})
  
  return {
    userInfo
  }
})