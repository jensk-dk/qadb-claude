import { defineStore } from 'pinia'

export const useSnackbarStore = defineStore('snackbar', {
  state: () => ({
    snackbar: {
      show: false,
      text: '',
      color: 'info',
      timeout: 3000
    }
  }),
  
  actions: {
    showSnackbar({ text, color = 'info', timeout = 3000 }) {
      this.snackbar = {
        show: true,
        text,
        color,
        timeout
      }
    },
    
    hideSnackbar() {
      this.snackbar.show = false
    }
  }
})