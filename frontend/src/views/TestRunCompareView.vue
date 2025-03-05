<template>
  <div>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Compare Test Runs</h1>
      </v-col>
    </v-row>
    
    <v-row v-if="loading">
      <v-col cols="12" class="text-center">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        <p class="mt-3">Loading comparison data...</p>
      </v-col>
    </v-row>
    
    <template v-else-if="comparisonData">
      <!-- Summary Cards -->
      <v-row>
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title>Run #{{ id1 }}</v-card-title>
            <v-card-subtitle>{{ runData1?.name || 'Unnamed Test Run' }}</v-card-subtitle>
            <v-card-text>
              <v-row>
                <v-col cols="4" class="text-center">
                  <div class="text-h5">{{ comparisonData.run1.pass_count }}</div>
                  <div class="text-caption">Passed</div>
                </v-col>
                <v-col cols="4" class="text-center">
                  <div class="text-h5">{{ comparisonData.run1.fail_count }}</div>
                  <div class="text-caption">Failed</div>
                </v-col>
                <v-col cols="4" class="text-center">
                  <div class="text-h5">{{ comparisonData.run1.total }}</div>
                  <div class="text-caption">Total</div>
                </v-col>
              </v-row>
              
              <v-progress-linear
                class="mt-3"
                :model-value="getPassRate(comparisonData.run1)"
                :color="getStatusColor(getPassRate(comparisonData.run1))"
                height="25"
              >
                <template v-slot:default="{ value }">
                  <strong>{{ Math.ceil(value) }}% Passed</strong>
                </template>
              </v-progress-linear>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title>Run #{{ id2 }}</v-card-title>
            <v-card-subtitle>{{ runData2?.name || 'Unnamed Test Run' }}</v-card-subtitle>
            <v-card-text>
              <v-row>
                <v-col cols="4" class="text-center">
                  <div class="text-h5">{{ comparisonData.run2.pass_count }}</div>
                  <div class="text-caption">Passed</div>
                </v-col>
                <v-col cols="4" class="text-center">
                  <div class="text-h5">{{ comparisonData.run2.fail_count }}</div>
                  <div class="text-caption">Failed</div>
                </v-col>
                <v-col cols="4" class="text-center">
                  <div class="text-h5">{{ comparisonData.run2.total }}</div>
                  <div class="text-caption">Total</div>
                </v-col>
              </v-row>
              
              <v-progress-linear
                class="mt-3"
                :model-value="getPassRate(comparisonData.run2)"
                :color="getStatusColor(getPassRate(comparisonData.run2))"
                height="25"
              >
                <template v-slot:default="{ value }">
                  <strong>{{ Math.ceil(value) }}% Passed</strong>
                </template>
              </v-progress-linear>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      
      <!-- Differences Summary -->
      <v-row class="mt-4">
        <v-col cols="12">
          <v-card>
            <v-card-title>Differences Summary</v-card-title>
            <v-card-text>
              <div v-if="comparisonData.differences.length === 0" class="text-center pa-4">
                <v-icon color="success" size="large">mdi-check-circle</v-icon>
                <p class="text-h6 mt-2">No differences found between these runs!</p>
              </div>
              <div v-else>
                <p class="text-body-1">
                  Found {{ comparisonData.differences.length }} 
                  {{ comparisonData.differences.length === 1 ? 'difference' : 'differences' }} 
                  between these runs.
                </p>
                
                <v-expansion-panels class="mt-3">
                  <v-expansion-panel>
                    <v-expansion-panel-title>
                      <div>
                        <v-badge
                          :content="comparisonData.differences.length.toString()"
                          color="error"
                          offset-x="15"
                          offset-y="15"
                        >
                          <v-icon color="error" class="mr-2">mdi-alert-circle</v-icon>
                        </v-badge>
                        Test Cases with Different Results
                      </div>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <v-list>
                        <v-list-item
                          v-for="diff in comparisonData.differences"
                          :key="diff.test_case_id"
                        >
                          <template v-slot:prepend>
                            <v-icon color="warning">mdi-compare</v-icon>
                          </template>
                          
                          <v-list-item-title>{{ diff.test_case_title }}</v-list-item-title>
                          <v-list-item-subtitle>
                            <span :class="getStatusClass(diff.run1_result)">{{ diff.run1_result }}</span>
                            <v-icon>mdi-arrow-right</v-icon>
                            <span :class="getStatusClass(diff.run2_result)">{{ diff.run2_result }}</span>
                          </v-list-item-subtitle>
                        </v-list-item>
                      </v-list>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      
      <!-- Detailed Comparison Table -->
      <v-row class="mt-4">
        <v-col cols="12">
          <v-card>
            <v-card-title>
              Detailed Comparison
              <v-spacer></v-spacer>
              <v-text-field
                v-model="search"
                append-icon="mdi-magnify"
                label="Search"
                single-line
                hide-details
                density="compact"
                variant="underlined"
                class="ml-4"
                style="max-width: 300px"
              ></v-text-field>
            </v-card-title>
            
            <v-data-table
              :headers="headers"
              :items="comparisonData.test_cases"
              :search="search"
              :items-per-page="10"
              :item-value="'test_case_id'"
              class="elevation-1"
            >
              <!-- Test Case Title Column -->
              <template v-slot:[`item.test_case_title`]="{ item }">
                {{ item.test_case_title }}
              </template>
              
              <!-- Run 1 Result Column -->
              <template v-slot:[`item.run1_result`]="{ item }">
                <span v-if="item.run1_result" :class="getStatusClass(item.run1_result)">
                  {{ item.run1_result }}
                </span>
                <span v-else class="text-grey">Not Run</span>
              </template>
              
              <!-- Run 2 Result Column -->
              <template v-slot:[`item.run2_result`]="{ item }">
                <span v-if="item.run2_result" :class="getStatusClass(item.run2_result)">
                  {{ item.run2_result }}
                </span>
                <span v-else class="text-grey">Not Run</span>
              </template>
              
              <!-- Status Column -->
              <template v-slot:[`item.status`]="{ item }">
                <v-icon v-if="!item.run1_result || !item.run2_result" color="grey">
                  mdi-minus
                </v-icon>
                <v-icon v-else-if="item.run1_result === item.run2_result" color="success">
                  mdi-check
                </v-icon>
                <v-icon v-else color="error">
                  mdi-alert
                </v-icon>
              </template>
            </v-data-table>
          </v-card>
        </v-col>
      </v-row>
    </template>
    
    <v-row v-else-if="error">
      <v-col cols="12">
        <v-alert type="error" title="Error Loading Data">
          {{ error }}
          <template v-slot:append>
            <v-btn color="error" @click="loadData">Retry</v-btn>
          </template>
        </v-alert>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'

export default {
  name: 'TestRunCompareView',
  props: {
    id1: {
      type: [String, Number],
      required: true
    },
    id2: {
      type: [String, Number],
      required: true
    }
  },
  setup(props) {
    // State
    const route = useRoute()
    const loading = ref(true)
    const error = ref(null)
    const comparisonData = ref(null)
    const runData1 = ref(null)
    const runData2 = ref(null)
    const search = ref('')
    
    // Headers for data table
    const headers = [
      { title: 'Test Case', key: 'test_case_title' },
      { title: `Run #${props.id1} Result`, key: 'run1_result', sortable: true },
      { title: `Run #${props.id2} Result`, key: 'run2_result', sortable: true },
      { title: 'Status', key: 'status', sortable: false, align: 'center' }
    ]
    
    // Methods
    const loadData = async () => {
      loading.value = true
      error.value = null
      
      try {
        // Load comparison data
        const comparisonResponse = await api.compareTestRuns(props.id1, props.id2)
        comparisonData.value = comparisonResponse.data
        
        // Get additional info for each run
        const [run1Response, run2Response] = await Promise.all([
          api.getTestRun(props.id1),
          api.getTestRun(props.id2)
        ])
        
        runData1.value = run1Response.data
        runData2.value = run2Response.data
      } catch (err) {
        console.error('Error loading comparison data:', err)
        error.value = 'Failed to load comparison data. Please try again later.'
      } finally {
        loading.value = false
      }
    }
    
    const getPassRate = (runData) => {
      if (!runData || runData.total === 0) return 0
      return (runData.pass_count / runData.total) * 100
    }
    
    const getStatusColor = (passRate) => {
      if (passRate >= 90) return 'success'
      if (passRate >= 70) return 'warning'
      return 'error'
    }
    
    const getStatusClass = (result) => {
      if (!result) return 'text-grey'
      
      result = result.toLowerCase()
      if (result === 'pass') return 'text-success'
      if (result === 'fail') return 'text-error'
      return 'text-warning'
    }
    
    // Lifecycle hooks
    onMounted(() => {
      loadData()
    })
    
    return {
      loading,
      error,
      comparisonData,
      runData1,
      runData2,
      headers,
      search,
      loadData,
      getPassRate,
      getStatusColor,
      getStatusClass
    }
  }
}
</script>

<style scoped>
.text-success {
  color: #4caf50;
}

.text-warning {
  color: #ff9800;
}

.text-error {
  color: #f44336;
}

.text-grey {
  color: #9e9e9e;
}
</style>