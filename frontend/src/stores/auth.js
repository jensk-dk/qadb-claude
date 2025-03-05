import { defineStore } from 'pinia'
import axios from 'axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null
  }),
  
  getters: {
    isLoggedIn: (state) => !!state.token
  },
  
  actions: {
    async login(username, password) {
      try {
        const formData = new FormData()
        formData.append('username', username)
        formData.append('password', password)
        
        const response = await axios.post('/api/auth/token', formData)
        const token = response.data.access_token
        
        // Save token to state and localStorage
        this.token = token
        localStorage.setItem('token', token)
        
        // Get user profile
        await this.getUserProfile()
        
        return true
      } catch (error) {
        console.error('Login error:', error)
        throw error
      }
    },
    
    async getUserProfile() {
      try {
        const response = await axios.get('/api/auth/users/me', {
          headers: { Authorization: `Bearer ${this.token}` }
        })
        
        this.user = response.data
        return this.user
      } catch (error) {
        console.error('Get user profile error:', error)
        this.logout()
        throw error
      }
    },
    
    logout() {
      this.user = null
      this.token = null
      localStorage.removeItem('token')
    }
  }
})