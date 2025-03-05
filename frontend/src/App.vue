<template>
  <v-app>
    <v-layout>
      <!-- Navigation drawer -->
      <v-navigation-drawer v-model="drawer">
        <v-list>
          <v-list-item title="QA Database" class="text-h6 mt-3 mb-3">
            <template v-slot:prepend>
              <v-icon icon="mdi-database-check" />
            </template>
          </v-list-item>

          <v-divider />

          <v-list-item
            v-for="(item, i) in menuItems"
            :key="i"
            :title="item.title"
            :value="item.title"
            @click="navigateToPage(item.to)"
          >
            <template v-slot:prepend>
              <v-icon :icon="item.icon" />
            </template>
          </v-list-item>
        </v-list>

        <template v-slot:append>
          <div class="pa-2">
            <v-btn v-if="isLoggedIn" block @click="logout" color="error" prepend-icon="mdi-logout">
              Logout
            </v-btn>
          </div>
        </template>
      </v-navigation-drawer>

      <!-- App bar and main content -->
      <v-app-bar title="QA Database">
        <template v-slot:prepend>
          <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
        </template>
        <v-app-bar-title>{{ $route.meta.title || 'QA Database' }}</v-app-bar-title>
        <template v-slot:append>
          <div v-if="isLoggedIn">
            <v-chip class="ma-2">
              <v-avatar start>
                <v-icon>mdi-account</v-icon>
              </v-avatar>
              {{ user?.name || 'User' }}
            </v-chip>
          </div>
        </template>
      </v-app-bar>

      <!-- Main content -->
      <v-main>
        <v-container fluid>
          <!-- Router view with key based on full path to force component recreation -->
          <router-view v-slot="{ Component }">
            <keep-alive :exclude="['HomeView']">
              <component :is="Component" :key="$route.fullPath" />
            </keep-alive>
          </router-view>
        </v-container>
      </v-main>
    </v-layout>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="snackbar.timeout">
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSnackbarStore } from '@/stores/snackbar'

export default {
  name: 'App',
  setup() {
    const drawer = ref(true)
    const router = useRouter()
    const route = useRoute()
    const authStore = useAuthStore()
    const snackbarStore = useSnackbarStore()
    // No extra state needed for navigation
    
    // Computed
    const isLoggedIn = computed(() => authStore.isLoggedIn)
    const user = computed(() => authStore.user)
    const snackbar = computed(() => snackbarStore.snackbar)

    // Menu items based on authentication
    const menuItems = computed(() => {
      const items = [
        { title: 'Dashboard', icon: 'mdi-view-dashboard', to: '/' }
      ]

      if (isLoggedIn.value) {
        items.push(
          { title: 'Test Suites', icon: 'mdi-folder-multiple', to: '/test-suites' },
          { title: 'Test Cases', icon: 'mdi-file-document-multiple', to: '/test-cases' },
          { title: 'Test Runs', icon: 'mdi-play', to: '/test-runs' },
          { title: 'Test Run Templates', icon: 'mdi-file-tree', to: '/templates' },
          { title: 'Devices', icon: 'mdi-devices', to: '/devices' },
          { title: 'Upload Results', icon: 'mdi-upload', to: '/upload' },
          { title: 'Import Local Files', icon: 'mdi-database-import', to: '/import-local' }
        )

        // Admin only items
        if (user.value?.access_rights === 'admin') {
          items.push(
            { title: 'Users', icon: 'mdi-account-multiple', to: '/users' },
            { title: 'Settings', icon: 'mdi-cog', to: '/settings' }
          )
        }
      } else {
        items.push({ title: 'Login', icon: 'mdi-login', to: '/login' })
      }

      return items
    })

    // Methods
    const navigateToPage = (path) => {
      // Special handling when navigating away from Dashboard
      if (route.path === '/' && path !== '/') {
        console.log('Navigating away from Dashboard...');
        
        // Use setTimeout to ensure all component cleanup has a chance to run
        setTimeout(() => {
          // Force reload and navigation to destroy all chart instances
          window.location.href = path;
        }, 10);
        
        return;
      }
      
      // For routes other than Dashboard, use regular router
      router.push(path);
    }
    
    const logout = async () => {
      await authStore.logout()
      router.push('/login')
      snackbarStore.showSnackbar({
        text: 'Logged out successfully',
        color: 'success'
      })
    }

    // Lifecycle hooks
    onMounted(async () => {
      // Try to refresh user on page load if token exists
      if (localStorage.getItem('token')) {
        try {
          await authStore.getUserProfile()
        } catch (error) {
          // Token might be expired or invalid, redirect to login
          if (router.currentRoute.value.path !== '/login') {
            router.push('/login')
          }
        }
      } else if (router.currentRoute.value.meta.requiresAuth) {
        router.push('/login')
      }
    })

    return {
      drawer,
      menuItems,
      isLoggedIn,
      user,
      snackbar,
      navigateToPage,
      logout
    }
  }
}
</script>

<style>
/* Global styles */
.drop-zone {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  background-color: #f8f8f8;
  transition: background-color 0.3s;
  cursor: pointer;
}

.drop-zone:hover,
.drop-zone.active {
  background-color: #eaf7ff;
  border-color: #42b983;
}

.v-data-table-header th {
  white-space: nowrap;
}
</style>