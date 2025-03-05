<template>
  <div>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Dashboard</h1>
      </v-col>
    </v-row>
    
    <v-row>
      <!-- Stats Cards -->
      <v-col cols="12" md="3">
        <v-card class="mx-auto" color="primary" dark>
          <v-card-text>
            <div class="text-h4 text-center">{{ stats.testSuites }}</div>
            <div class="text-subtitle-1 text-center">Test Suites</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="3">
        <v-card class="mx-auto" color="secondary" dark>
          <v-card-text>
            <div class="text-h4 text-center">{{ stats.testCases }}</div>
            <div class="text-subtitle-1 text-center">Test Cases</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="3">
        <v-card class="mx-auto" color="info" dark>
          <v-card-text>
            <div class="text-h4 text-center">{{ stats.testRuns }}</div>
            <div class="text-subtitle-1 text-center">Test Runs</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="3">
        <v-card class="mx-auto" color="success" dark>
          <v-card-text>
            <div class="text-h4 text-center">{{ stats.passRate }}%</div>
            <div class="text-subtitle-1 text-center">Recent Pass Rate</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <v-row class="mt-4">
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>
            Recent Test Runs
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              variant="text"
              @click="navigateToTestRuns"
              prepend-icon="mdi-arrow-right"
            >
              View All
            </v-btn>
          </v-card-title>
          
          <v-divider></v-divider>
          
          <v-card-text>
            <v-list>
              <v-list-item
                v-for="run in recentTestRuns"
                :key="run.id"
                :to="{ name: 'test-run-detail', params: { id: run.id } }"
              >
                <v-list-item-title>{{ run.name || `Test Run #${run.id}` }}</v-list-item-title>
                <v-list-item-subtitle>{{ run.status }} - {{ run.date }}</v-list-item-subtitle>
                
                <template v-slot:append>
                  <v-chip
                    :color="getPassRateColor(run.passRate)"
                    size="small"
                  >
                    {{ run.passRate }}% Pass
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
            
            <div v-if="recentTestRuns.length === 0" class="text-center pa-4">
              <p class="text-subtitle-1">No recent test runs</p>
              <v-btn
                color="primary"
                class="mt-2"
                :to="{ name: 'upload' }"
              >
                Upload Results
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>
            Pass Rate Trend
          </v-card-title>
          
          <v-divider></v-divider>
          
          <v-card-text>
            <div v-if="chartData.labels.length > 0" class="chart-container" ref="chartContainer">
              <!-- Use dynamic component creation with a key to force recreation -->
              <component 
                :is="chartData.labels.length > 0 ? 'LineChart' : 'div'" 
                ref="chartRef" 
                :chart-data="chartData" 
                :options="chartOptions"
                :key="Date.now()" 
              />
            </div>
            <div v-else class="text-center pa-4">
              <p class="text-subtitle-1">Not enough data to display chart</p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-card-title>
            Quick Actions
          </v-card-title>
          
          <v-divider></v-divider>
          
          <v-card-text>
            <v-row>
              <v-col cols="12" sm="4">
                <v-btn
                  block
                  color="primary"
                  prepend-icon="mdi-upload"
                  class="mb-3"
                  :to="{ name: 'upload' }"
                >
                  Upload Test Results
                </v-btn>
              </v-col>
              
              <v-col cols="12" sm="4">
                <v-btn
                  block
                  color="secondary"
                  prepend-icon="mdi-file-tree"
                  class="mb-3"
                  :to="{ name: 'templates' }"
                >
                  Test Run Templates
                </v-btn>
              </v-col>
              
              <v-col cols="12" sm="4">
                <v-btn
                  block
                  color="info"
                  prepend-icon="mdi-compare"
                  class="mb-3"
                  @click="showCompareDialog = true"
                >
                  Compare Test Runs
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Compare Test Runs Dialog -->
    <v-dialog v-model="showCompareDialog" max-width="500px">
      <v-card>
        <v-card-title>Compare Test Runs</v-card-title>
        <v-card-text>
          <v-select
            v-model="compareRun1"
            :items="allTestRuns"
            item-title="displayName"
            item-value="id"
            label="First Test Run"
            return-object
          ></v-select>
          
          <v-select
            v-model="compareRun2"
            :items="allTestRuns"
            item-title="displayName"
            item-value="id"
            label="Second Test Run"
            return-object
          ></v-select>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" text @click="showCompareDialog = false">Cancel</v-btn>
          <v-btn 
            color="primary" 
            @click="compareRuns"
            :disabled="!compareRun1 || !compareRun2"
          >
            Compare
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSnackbarStore } from '@/stores/snackbar'
import api from '@/services/api'
import { Line as LineChart } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

export default {
  name: 'HomeView',
  components: {
    LineChart
  },
  setup() {
    // State
    const stats = ref({
      testSuites: 0,
      testCases: 0,
      testRuns: 0,
      passRate: 0
    })
    const chartContainer = ref(null)
    const chartRef = ref(null)
    const isChartMounted = ref(true)
    
    const recentTestRuns = ref([])
    const allTestRuns = ref([])
    const loading = ref(false)
    const showCompareDialog = ref(false)
    const compareRun1 = ref(null)
    const compareRun2 = ref(null)
    
    // Chart data
    const chartData = ref({
      labels: [],
      datasets: [
        {
          label: 'Pass Rate (%)',
          data: [],
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.2)',
          tension: 0.2
        }
      ]
    })
    
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 100
        }
      }
    }
    
    // Computed
    const testRunsForChart = computed(() => {
      return recentTestRuns.value.slice().reverse()
    })
    
    // Composables
    const router = useRouter()
    const snackbarStore = useSnackbarStore()
    
    // Methods
    const loadDashboardData = async () => {
      loading.value = true
      
      try {
        // Load summary statistics
        await Promise.all([
          loadStats(),
          loadRecentTestRuns(),
          loadAllTestRuns()
        ])
        
        // Update chart data
        updateChartData()
      } catch (error) {
        console.error('Error loading dashboard data:', error)
        snackbarStore.showSnackbar({
          text: 'Error loading dashboard data',
          color: 'error'
        })
      } finally {
        loading.value = false
      }
    }
    
    const loadStats = async () => {
      try {
        // In a real application, this might be a single API call to get summary stats
        const [suitesRes, casesRes, runsRes] = await Promise.all([
          api.getTestSuites(),
          api.getTestCases(),
          api.getTestRuns()
        ])
        
        stats.value.testSuites = suitesRes.data.length
        stats.value.testCases = casesRes.data.length
        stats.value.testRuns = runsRes.data.length
        
        // Calculate overall pass rate from recent runs
        if (runsRes.data.length > 0) {
          const recentRuns = runsRes.data.slice(0, 5)
          let totalResults = 0
          let totalPassed = 0
          
          for (const run of recentRuns) {
            const runDetail = await api.getTestRun(run.id)
            const results = runDetail.data.test_case_results || []
            
            totalResults += results.length
            totalPassed += results.filter(r => r.result.toLowerCase() === 'pass').length
          }
          
          stats.value.passRate = totalResults > 0 
            ? Math.round((totalPassed / totalResults) * 100) 
            : 0
        }
      } catch (error) {
        console.error('Error loading stats:', error)
      }
    }
    
    const loadRecentTestRuns = async () => {
      try {
        const response = await api.getTestRuns({ limit: 5 })
        
        // Process each test run to add pass rate
        const processedRuns = []
        
        for (const run of response.data) {
          const runDetail = await api.getTestRun(run.id)
          const results = runDetail.data.test_case_results || []
          const passCount = results.filter(r => r.result.toLowerCase() === 'pass').length
          const passRate = results.length > 0 ? Math.round((passCount / results.length) * 100) : 0
          
          processedRuns.push({
            id: run.id,
            name: run.name,
            status: run.status,
            date: new Date(run.run_date || Date.now()).toLocaleDateString(),
            passRate: passRate
          })
        }
        
        recentTestRuns.value = processedRuns
      } catch (error) {
        console.error('Error loading recent test runs:', error)
      }
    }
    
    const loadAllTestRuns = async () => {
      try {
        const response = await api.getTestRuns({ limit: 20 })
        
        allTestRuns.value = response.data.map(run => ({
          id: run.id,
          name: run.name,
          date: new Date(run.run_date || Date.now()).toLocaleDateString(),
          displayName: `${run.name || `Test Run #${run.id}`} (${new Date(run.run_date || Date.now()).toLocaleDateString()})`
        }))
      } catch (error) {
        console.error('Error loading all test runs:', error)
      }
    }
    
    const updateChartData = () => {
      if (testRunsForChart.value.length > 0) {
        chartData.value.labels = testRunsForChart.value.map(run => run.date)
        chartData.value.datasets[0].data = testRunsForChart.value.map(run => run.passRate)
      }
    }
    
    const getPassRateColor = (rate) => {
      if (rate >= 90) return 'success'
      if (rate >= 75) return 'warning'
      return 'error'
    }
    
    // Force navigation to test runs page using window.location to avoid Dashboard chart issues
    const navigateToTestRuns = () => {
      console.log('Navigating to test-runs page with hard reload');
      window.location.href = '/test-runs';
    }
    
    const compareRuns = () => {
      if (compareRun1.value && compareRun2.value) {
        router.push({
          name: 'test-run-compare',
          params: { 
            id1: compareRun1.value.id, 
            id2: compareRun2.value.id
          }
        })
        showCompareDialog.value = false
      }
    }
    
    // Lifecycle hooks with debug logging
    onMounted(() => {
      console.log('HomeView MOUNTED')
      loadDashboardData()
    })
    
    onBeforeUnmount(() => {
      console.log('HomeView UNMOUNTED - Cleaning up Chart.js')
      
      // First unmount the chart component itself to trigger its own cleanup
      isChartMounted.value = false;
      
      // Try to access the chart instance through our ref and destroy it
      if (chartRef.value && chartRef.value.chart) {
        chartRef.value.chart.destroy();
      }
      
      // Also clean up any global Chart.js instances as a fallback
      if (ChartJS.instances) {
        Object.values(ChartJS.instances).forEach(chart => {
          if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
          }
        });
      }
      
      // Finally, clear any canvas elements
      if (chartContainer.value) {
        const canvases = chartContainer.value.querySelectorAll('canvas');
        canvases.forEach(canvas => {
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        });
      }
    });

    return {
      stats,
      recentTestRuns,
      allTestRuns,
      chartData,
      chartOptions,
      loading,
      showCompareDialog,
      compareRun1,
      compareRun2,
      getPassRateColor,
      navigateToTestRuns,
      compareRuns,
      chartContainer,
      chartRef,
      isChartMounted
    }
  }
}
</script>

<style scoped>
.chart-container {
  height: 300px;
}
</style>