<template>
  <v-container fluid fill-height class="login-container">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="elevation-12">
          <v-card-title class="text-center">
            <h2 class="mb-2">QA Database</h2>
          </v-card-title>
          
          <v-card-text>
            <v-form @submit.prevent="login" ref="form">
              <v-text-field
                v-model="username"
                label="Username"
                prepend-icon="mdi-account"
                :rules="[v => !!v || 'Username is required']"
                required
              ></v-text-field>
              
              <v-text-field
                v-model="password"
                label="Password"
                prepend-icon="mdi-lock"
                :type="showPassword ? 'text' : 'password'"
                :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append="showPassword = !showPassword"
                :rules="[v => !!v || 'Password is required']"
                required
              ></v-text-field>
              
              <v-alert
                v-if="error"
                type="error"
                class="mt-3"
                closable
              >
                {{ error }}
              </v-alert>
            </v-form>
          </v-card-text>
          
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              @click="login"
              :loading="loading"
              :disabled="loading"
            >
              Login
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSnackbarStore } from '@/stores/snackbar'

export default {
  name: 'LoginView',
  setup() {
    // State
    const username = ref('')
    const password = ref('')
    const showPassword = ref(false)
    const loading = ref(false)
    const error = ref('')
    const form = ref(null)
    
    // Composables
    const router = useRouter()
    const route = useRoute()
    const authStore = useAuthStore()
    const snackbarStore = useSnackbarStore()
    
    // Methods
    const login = async () => {
      // Validate form
      const isValid = await form.value?.validate()
      if (!isValid?.valid) {
        return
      }
      
      loading.value = true
      error.value = ''
      
      try {
        await authStore.login(username.value, password.value)
        
        // Show success message
        snackbarStore.showSnackbar({
          text: 'Login successful',
          color: 'success'
        })
        
        // Redirect to requested page or home
        const redirectPath = route.query.redirect || '/'
        router.push(redirectPath)
      } catch (err) {
        if (err.response && err.response.status === 401) {
          error.value = 'Invalid username or password'
        } else {
          error.value = 'An error occurred. Please try again later.'
        }
        console.error(err)
      } finally {
        loading.value = false
      }
    }
    
    return {
      username,
      password,
      showPassword,
      loading,
      error,
      form,
      login
    }
  }
}
</script>

<style scoped>
.login-container {
  background-color: #f5f5f5;
  min-height: 100vh;
}
</style>