import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Lazy-loaded route components
const Home = () => import('../views/HomeView.vue')
const Login = () => import('../views/LoginView.vue')
const TestSuites = () => import('../views/TestSuitesView.vue')
const TestCases = () => import('../views/TestCasesView.vue')
const TestRuns = () => import('../views/TestRunsView.vue')
const TestRunDetail = () => import('../views/TestRunDetailView.vue')
const TestRunCompare = () => import('../views/TestRunCompareView.vue')
const RunTemplates = () => import('../views/RunTemplatesView.vue')
const DevicesView = () => import('../views/DevicesView.vue')
const UploadResults = () => import('../views/UploadResultsView.vue')
const ImportLocal = () => import('../views/ImportLocalView.vue')
const UsersView = () => import('../views/UsersView.vue')
const SettingsView = () => import('../views/SettingsView.vue')
const NotFound = () => import('../views/NotFoundView.vue')

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: { 
      title: 'Dashboard',
      requiresAuth: true 
    }
  },
  {
    path: '/login',
    name: 'login',
    component: Login,
    meta: { title: 'Login' }
  },
  {
    path: '/test-suites',
    name: 'test-suites',
    component: TestSuites,
    meta: { 
      title: 'Test Suites',
      requiresAuth: true 
    }
  },
  {
    path: '/test-cases',
    name: 'test-cases',
    component: TestCases,
    meta: { 
      title: 'Test Cases',
      requiresAuth: true 
    }
  },
  {
    path: '/test-runs',
    name: 'test-runs',
    component: TestRuns,
    meta: { 
      title: 'Test Runs',
      requiresAuth: true 
    }
  },
  {
    path: '/test-runs/:id',
    name: 'test-run-detail',
    component: TestRunDetail,
    meta: { 
      title: 'Test Run Details',
      requiresAuth: true 
    },
    props: true
  },
  {
    path: '/test-runs/compare/:id1/:id2',
    name: 'test-run-compare',
    component: TestRunCompare,
    meta: { 
      title: 'Compare Test Runs',
      requiresAuth: true 
    },
    props: true
  },
  {
    path: '/templates',
    name: 'templates',
    component: RunTemplates,
    meta: { 
      title: 'Run Templates',
      requiresAuth: true 
    }
  },
  {
    path: '/devices',
    name: 'devices',
    component: DevicesView,
    meta: { 
      title: 'Devices',
      requiresAuth: true 
    }
  },
  {
    path: '/upload',
    name: 'upload',
    component: UploadResults,
    meta: { 
      title: 'Upload Results',
      requiresAuth: true 
    }
  },
  {
    path: '/import-local',
    name: 'import-local',
    component: ImportLocal,
    meta: { 
      title: 'Import Local Files',
      requiresAuth: true 
    }
  },
  {
    path: '/users',
    name: 'users',
    component: UsersView,
    meta: { 
      title: 'Users',
      requiresAuth: true,
      requiresAdmin: true
    }
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsView,
    meta: { 
      title: 'Settings',
      requiresAuth: true,
      requiresAdmin: true
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFound,
    meta: { title: 'Page Not Found' }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

// Navigation guard for authentication
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin)
  
  // If route requires authentication and user is not logged in
  if (requiresAuth && !authStore.isLoggedIn) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } 
  // If route requires admin privileges and user is not admin
  else if (requiresAdmin && authStore.user?.access_rights !== 'admin') {
    next({ name: 'home' })
  }
  else {
    next()
  }
})

export default router