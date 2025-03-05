import { defineStore } from 'pinia'
import api from '@/services/api'

export const useAuthStore = defineStore('auth', {
  state: () => {
    const token = localStorage.getItem('token')
    console.log('AuthStore: Initializing with token from localStorage:', token ? 'Token exists' : 'No token')
    return {
      user: null,
      token: token || null
    }
  },
  
  getters: {
    isLoggedIn: (state) => {
      const loggedIn = !!state.token
      console.log('AuthStore: isLoggedIn check:', loggedIn)
      return loggedIn
    }
  },
  
  actions: {
    async login(username, password) {
      console.log('AuthStore: Login attempt for user:', username)
      try {
        const response = await api.login(username, password)
        const token = response.data.access_token
        
        // Save token to state and localStorage
        this.token = token
        localStorage.setItem('token', token)
        console.log('AuthStore: Token saved to localStorage')
        
        // Get user profile
        try {
          await this.getUserProfile()
        } catch (profileError) {
          console.warn('AuthStore: Could not get user profile, but login succeeded')
        }
        
        return true
      } catch (error) {
        console.error('AuthStore: Login error:', error)
        throw error
      }
    },
    
    async getUserProfile() {
      console.log('AuthStore: Getting user profile')
      try {
        // Use the api service to ensure proper interceptors are used
        const response = await api.getCurrentUser()
        
        this.user = response.data
        console.log('AuthStore: User profile loaded:', this.user)
        return this.user
      } catch (error) {
        console.error('AuthStore: Get user profile error:', error)
        if (error.response && error.response.status === 401) {
          console.warn('AuthStore: Auth error getting profile, logging out')
          this.logout()
        }
        throw error
      }
    },
    
    logout() {
      console.log('AuthStore: Logging out, cleaning up token')
      this.user = null
      this.token = null
      localStorage.removeItem('token')
    },
    
    checkAuth() {
      console.log('AuthStore: Checking auth status')
      if (this.token) {
        console.log('AuthStore: Token exists, validating...')
        this.getUserProfile().catch(error => {
          console.error('AuthStore: Token validation failed:', error)
          this.logout()
        })
      } else {
        console.log('AuthStore: No token found')
      }
    }
  }
})