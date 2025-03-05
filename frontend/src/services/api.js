import axios from 'axios'

// Create axios instance with base URL and default headers
const api = axios.create({
  baseURL: '/api'
})

// Add request interceptor for authentication
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// Add response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      // Clear token if it's invalid/expired
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API methods
export default {
  // Authentication
  login(username, password) {
    const formData = new FormData()
    formData.append('username', username)
    formData.append('password', password)
    return axios.post('/api/auth/token', formData)
  },
  
  getCurrentUser() {
    return api.get('/auth/users/me')
  },
  
  // Test Suites
  getTestSuites() {
    return api.get('/test-suites/')
  },
  
  getTestSuite(id) {
    return api.get(`/test-suites/${id}`)
  },
  
  createTestSuite(data) {
    return api.post('/test-suites/', data)
  },
  
  updateTestSuite(id, data) {
    return api.patch(`/test-suites/${id}`, data)
  },
  
  deleteTestSuite(id) {
    return api.delete(`/test-suites/${id}`)
  },
  
  // Test Cases
  getTestCases(params = {}) {
    return api.get('/test-cases/', { params })
  },
  
  getTestCase(id) {
    return api.get(`/test-cases/${id}`)
  },
  
  createTestCase(data) {
    return api.post('/test-cases/', data)
  },
  
  updateTestCase(id, data) {
    return api.patch(`/test-cases/${id}`, data)
  },
  
  deleteTestCase(id) {
    return api.delete(`/test-cases/${id}`)
  },
  
  // Test Run Templates
  getTestRunTemplates() {
    return api.get('/test-run-templates/')
  },
  
  getTestRunTemplate(id) {
    return api.get(`/test-run-templates/${id}`)
  },
  
  createTestRunTemplate(data) {
    return api.post('/test-run-templates/', data)
  },
  
  updateTestRunTemplate(id, data) {
    return api.patch(`/test-run-templates/${id}`, data)
  },
  
  deleteTestRunTemplate(id) {
    return api.delete(`/test-run-templates/${id}`)
  },
  
  addTestCaseToTemplate(templateId, testCaseId) {
    return api.post(`/test-run-templates/${templateId}/test_cases/${testCaseId}`)
  },
  
  removeTestCaseFromTemplate(templateId, testCaseId) {
    return api.delete(`/test-run-templates/${templateId}/test_cases/${testCaseId}`)
  },
  
  // Test Runs
  getTestRuns(params = {}) {
    return api.get('/test-runs/', { params })
  },
  
  getTestRun(id) {
    return api.get(`/test-runs/${id}`)
  },
  
  createTestRun(data) {
    return api.post('/test-runs/', data)
  },
  
  updateTestRun(id, data) {
    return api.patch(`/test-runs/${id}`, data)
  },
  
  deleteTestRun(id) {
    return api.delete(`/test-runs/${id}`)
  },
  
  compareTestRuns(id1, id2) {
    return api.get(`/test-runs/compare/${id1}/${id2}`)
  },
  
  // Test Case Results
  getTestCaseResult(id) {
    return api.get(`/test-runs/results/${id}`)
  },
  
  createTestCaseResult(data) {
    return api.post('/test-runs/results', data)
  },
  
  updateTestCaseResult(id, data) {
    return api.patch(`/test-runs/results/${id}`, data)
  },
  
  // DUTs and Capabilities
  getDUTs() {
    return api.get('/duts/')
  },
  
  getDUT(id) {
    return api.get(`/duts/${id}`)
  },
  
  createDUT(data) {
    return api.post('/duts/', data)
  },
  
  updateDUT(id, data) {
    return api.patch(`/duts/${id}`, data)
  },
  
  deleteDUT(id) {
    return api.delete(`/duts/${id}`)
  },
  
  getCapabilities(params = {}) {
    return api.get('/duts/capabilities', { params })
  },
  
  getCapability(id) {
    return api.get(`/duts/capabilities/${id}`)
  },
  
  createCapability(data) {
    return api.post('/duts/capabilities', data)
  },
  
  updateCapability(id, data) {
    return api.patch(`/duts/capabilities/${id}`, data)
  },
  
  // File uploads
  uploadTestResults(formData) {
    return api.post('/uploads/test-results', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  
  importLocalFile(data) {
    // Send file_path as a query parameter
    return api.post(`/uploads/import-local-file?file_path=${encodeURIComponent(data.file_path)}`, {
      test_run_name: data.test_run_name,
      operator_id: data.operator_id
    })
  },
  
  // Users (admin only)
  getUsers() {
    return api.get('/auth/users')
  },
  
  createUser(data) {
    return api.post('/auth/register', data)
  },
  
  updateUser(id, data) {
    return api.patch(`/auth/users/${id}`, data)
  },
  
  deleteUser(id) {
    return api.delete(`/auth/users/${id}`)
  },
  
  // Database admin
  backupDatabase() {
    return api.get('/admin/backup', { responseType: 'blob' })
  },
  
  restoreDatabase(filePath) {
    return api.post('/admin/restore', { file_path: filePath })
  }
}