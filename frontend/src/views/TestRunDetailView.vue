<template>
  <div>
    <!-- Header Section with Test Run Info -->
    <div class="d-flex align-center mb-4">
      <div>
        <h1 class="text-h4 mb-1">{{ testRun.name || `Test Run #${id}` }}</h1>
        <div class="d-flex align-center">
          <v-chip
            :color="getStatusColor(testRun.status)"
            size="small"
            class="mr-2"
          >
            {{ testRun.status }}
          </v-chip>
          <span class="text-caption mr-2">
            {{ testRun.run_date ? new Date(testRun.run_date).toLocaleDateString() : 'No date' }}
          </span>
          <span v-if="testRun.operator" class="text-caption">
            Operator: {{ testRun.operator.name }}
          </span>
        </div>
      </div>
      <v-spacer></v-spacer>
      <v-btn
        color="primary"
        prepend-icon="mdi-pencil"
        @click="editDialog = true"
        class="mr-2"
      >
        Edit
      </v-btn>
      <v-btn
        color="error"
        prepend-icon="mdi-delete"
        @click="confirmDelete = true"
      >
        Delete
      </v-btn>
    </div>

    <!-- Loading State -->
    <v-skeleton-loader
      v-if="loading"
      type="card, list-item-three-line, list-item-three-line, list-item-three-line"
    ></v-skeleton-loader>

    <!-- Error State -->
    <v-alert
      v-else-if="error"
      type="error"
      title="Error Loading Test Run"
      text="There was an error loading the test run details. Please try again."
    >
      {{ error }}
    </v-alert>

    <!-- Content When Loaded -->
    <template v-else>
      <!-- Summary Card -->
      <v-card class="mb-4">
        <v-card-title>Summary</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <div v-if="testRun.description" class="mb-4">
                <strong>Description:</strong>
                <p>{{ testRun.description }}</p>
              </div>

              <div v-if="testRun.dut_id" class="mb-2">
                <strong>Device Under Test:</strong>
                <p>{{ dutName }}</p>
              </div>
            </v-col>
            <v-col cols="12" md="6">
              <v-list density="compact">
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon icon="mdi-check-circle" color="success"></v-icon>
                  </template>
                  <v-list-item-title>Pass Rate</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-progress-linear
                      :model-value="passRate"
                      :color="getPassRateColor(passRate)"
                      height="15"
                      class="rounded-lg mt-1"
                    >
                      <span class="text-caption white--text">
                        {{ passRate }}%
                      </span>
                    </v-progress-linear>
                  </v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon icon="mdi-counter" color="info"></v-icon>
                  </template>
                  <v-list-item-title>Total Test Cases</v-list-item-title>
                  <v-list-item-subtitle>{{ testCaseResults.length }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon icon="mdi-calendar" color="primary"></v-icon>
                  </template>
                  <v-list-item-title>Date</v-list-item-title>
                  <v-list-item-subtitle>{{ testRun.run_date ? new Date(testRun.run_date).toLocaleDateString() : 'Not specified' }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Test Case Results Section -->
      <h2 class="text-h5 mb-2">Test Case Results</h2>
      
      <!-- Filter Controls -->
      <v-card class="mb-4 px-4 py-2">
        <v-row>
          <v-col cols="12" sm="4">
            <v-select
              v-model="filters.result"
              :items="['All', 'Pass', 'Fail']"
              label="Filter by Result"
              density="comfortable"
              variant="outlined"
              hide-details
            ></v-select>
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="filters.search"
              label="Search"
              prepend-icon="mdi-magnify"
              density="comfortable"
              variant="outlined"
              hide-details
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="4" class="d-flex align-center">
            <v-spacer></v-spacer>
            <v-btn
              prepend-icon="mdi-export"
              color="secondary"
              variant="elevated"
              size="small"
              class="mr-2"
              @click="exportResults"
            >
              Export
            </v-btn>
            <v-btn
              prepend-icon="mdi-plus"
              color="primary"
              variant="elevated"
              size="small"
              @click="addResultDialog = true"
            >
              Add Result
            </v-btn>
          </v-col>
        </v-row>
      </v-card>

      <!-- Test Case Results Table -->
      <v-card class="mb-4">
        <v-data-table
          v-model:items-per-page="itemsPerPage"
          :headers="resultHeaders"
          :items="filteredResults"
          :loading="loading"
          item-value="id"
          class="elevation-1"
        >
          <!-- Result Status Column -->
          <template v-slot:item.result="{ item }">
            <v-chip
              :color="item.raw.result === 'Pass' || item.raw.result === 'Passed' ? 'success' : 'error'"
              size="small"
            >
              {{ item.raw.result }}
            </v-chip>
          </template>

          <!-- Actions Column -->
          <template v-slot:item.actions="{ item }">
            <v-icon
              size="small"
              class="me-2"
              @click="viewResult(item.raw)"
              title="View Details"
            >
              mdi-eye
            </v-icon>
            <v-icon
              size="small"
              class="me-2"
              @click="editResult(item.raw)"
              title="Edit Result"
            >
              mdi-pencil
            </v-icon>
            <v-icon
              size="small"
              @click="confirmDeleteResult(item.raw)"
              title="Delete Result"
            >
              mdi-delete
            </v-icon>
          </template>

          <!-- Empty State -->
          <template v-slot:no-data>
            <div class="text-center py-6">
              <v-icon icon="mdi-clipboard-text-outline" size="large" color="grey-lighten-1" class="mb-4"></v-icon>
              <p class="text-body-1 text-medium-emphasis">No test case results found for this test run.</p>
              <v-btn 
                color="primary" 
                @click="addResultDialog = true"
                class="mt-2"
              >
                Add Result
              </v-btn>
            </div>
          </template>
        </v-data-table>
      </v-card>
    </template>

    <!-- Result Details Dialog -->
    <v-dialog v-model="resultDialog.show" max-width="700px">
      <v-card>
        <v-card-title>
          <span v-if="resultDialog.result">{{ resultDialog.result.test_case?.title || `Result #${resultDialog.result.id}` }}</span>
        </v-card-title>
        <v-card-text v-if="resultDialog.result">
          <v-chip
            :color="resultDialog.result.result === 'Pass' || resultDialog.result.result === 'Passed' ? 'success' : 'error'"
            size="small"
            class="mb-4"
          >
            {{ resultDialog.result.result }}
          </v-chip>
          
          <div v-if="resultDialog.result.comment" class="mb-4">
            <h3 class="text-subtitle-1 mb-1">Comment</h3>
            <p>{{ resultDialog.result.comment }}</p>
          </div>
          
          <div v-if="resultDialog.result.logs" class="mb-4">
            <h3 class="text-subtitle-1 mb-1">Logs</h3>
            <v-card color="grey-lighten-4" variant="flat">
              <v-card-text class="text-pre-wrap">{{ resultDialog.result.logs }}</v-card-text>
            </v-card>
          </div>
          
          <div v-if="resultDialog.result.artifacts">
            <h3 class="text-subtitle-1 mb-1">Artifacts</h3>
            <p>{{ resultDialog.result.artifacts }}</p>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            variant="text"
            @click="resultDialog.show = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit Test Run Dialog -->
    <v-dialog v-model="editDialog" max-width="600px">
      <v-card>
        <v-card-title>Edit Test Run</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="editedRun.name"
                label="Test Run Name"
                required
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="editedRun.status"
                :items="['Scheduled', 'Running', 'Completed', 'Failed', 'Cancelled']"
                label="Status"
                required
              ></v-select>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="editedRun.run_date"
                label="Run Date"
                type="date"
              ></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="editedRun.description"
                label="Description"
                rows="3"
              ></v-textarea>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="editDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="text"
            @click="saveTestRun"
            :loading="saving"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="confirmDelete" max-width="500px">
      <v-card>
        <v-card-title>Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete this test run? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="confirmDelete = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="text"
            @click="deleteTestRun"
            :loading="deleting"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Result Confirmation Dialog -->
    <v-dialog v-model="confirmDeleteResultDialog.show" max-width="500px">
      <v-card>
        <v-card-title>Confirm Delete Result</v-card-title>
        <v-card-text>
          Are you sure you want to delete this test case result? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="confirmDeleteResultDialog.show = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="text"
            @click="deleteResult"
            :loading="deleting"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Add Result Dialog -->
    <v-dialog v-model="addResultDialog" max-width="700px">
      <v-card>
        <v-card-title>Add Test Case Result</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <v-select
                v-model="newResult.test_case_id"
                :items="availableTestCases"
                item-title="title"
                item-value="id"
                label="Test Case"
                required
              ></v-select>
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="newResult.result"
                :items="['Pass', 'Fail', 'Skip', 'Blocked']"
                label="Result"
                required
              ></v-select>
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="newResult.comment"
                label="Comment"
                rows="2"
              ></v-textarea>
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="newResult.logs"
                label="Logs"
                rows="4"
              ></v-textarea>
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="newResult.artifacts"
                label="Artifacts"
                hint="Separate multiple artifacts with commas"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="addResultDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="text"
            @click="addResult"
            :loading="saving"
          >
            Add
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useSnackbarStore } from '@/stores/snackbar';
import api from '@/services/api';

export default {
  name: 'TestRunDetailView',
  props: {
    id: {
      type: [String, Number],
      required: true
    }
  },
  setup(props) {
    const router = useRouter();
    const snackbarStore = useSnackbarStore();
    
    // State
    const testRun = ref({});
    const testCaseResults = ref([]);
    const loading = ref(true);
    const error = ref(null);
    const editDialog = ref(false);
    const confirmDelete = ref(false);
    const saving = ref(false);
    const deleting = ref(false);
    const dutName = ref('');
    const itemsPerPage = ref(10);
    const editedRun = ref({});
    const duts = ref([]);
    const availableTestCases = ref([]);
    
    // Result dialog
    const resultDialog = reactive({
      show: false,
      result: null
    });
    
    // Delete result dialog
    const confirmDeleteResultDialog = reactive({
      show: false,
      result: null
    });
    
    // Add result dialog
    const addResultDialog = ref(false);
    const newResult = ref({
      test_case_id: null,
      result: 'Pass',
      comment: '',
      logs: '',
      artifacts: ''
    });
    
    // Filter controls
    const filters = reactive({
      result: 'All',
      search: ''
    });
    
    // Table headers
    const resultHeaders = [
      { title: 'ID', key: 'test_case_id', sortable: true },
      { title: 'Test Case', key: 'test_case_title', sortable: true },
      { title: 'Result', key: 'result', sortable: true },
      { title: 'Comment', key: 'comment', sortable: true },
      { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
    ];
    
    // Load test run data
    const fetchTestRun = async () => {
      loading.value = true;
      error.value = null;
      
      try {
        const response = await api.getTestRun(props.id);
        testRun.value = response.data;
        
        // Prepare test case results
        testCaseResults.value = response.data.test_case_results || [];
        console.log('Test case results loaded:', testCaseResults.value);
        
        // Ensure each test case result has access to its test case
        if (testCaseResults.value.length > 0) {
          // Fetch any missing test cases if needed
          const missingTestCases = testCaseResults.value.filter(result => !result.test_case);
          if (missingTestCases.length > 0) {
            console.log(`Found ${missingTestCases.length} results without test case data, loading test cases...`);
          }
        }
        
        // Look up device name if there's a dut_id
        if (testRun.value.dut_id) {
          await fetchDUTName(testRun.value.dut_id);
        }
        
        // Prepare edited run data
        editedRun.value = {
          name: testRun.value.name,
          status: testRun.value.status,
          description: testRun.value.description,
          run_date: testRun.value.run_date
        };
        
        console.log('Test run details loaded:', testRun.value);
      } catch (err) {
        console.error('Error fetching test run details:', err);
        error.value = err.message || 'Failed to load test run details';
        
        snackbarStore.showSnackbar({
          text: 'Error loading test run details',
          color: 'error'
        });
      } finally {
        loading.value = false;
      }
    };
    
    // Get device name
    const fetchDUTName = async (dutId) => {
      try {
        const response = await api.getDUT(dutId);
        dutName.value = response.data.product_name || 'Unknown Device';
      } catch (err) {
        console.error('Error fetching DUT:', err);
        dutName.value = 'Unknown Device';
      }
    };
    
    // Load available test cases for adding results
    const fetchTestCases = async () => {
      try {
        const response = await api.getTestCases();
        availableTestCases.value = response.data || [];
      } catch (err) {
        console.error('Error fetching test cases:', err);
        
        snackbarStore.showSnackbar({
          text: 'Error loading test cases',
          color: 'error'
        });
      }
    };
    
    // Load devices for dropdown
    const fetchDUTs = async () => {
      try {
        const response = await api.getDUTs();
        duts.value = response.data || [];
      } catch (err) {
        console.error('Error fetching DUTs:', err);
      }
    };
    
    // Save test run changes
    const saveTestRun = async () => {
      saving.value = true;
      
      try {
        const response = await api.updateTestRun(props.id, editedRun.value);
        
        // Update the test run data
        testRun.value = {
          ...testRun.value,
          ...response.data
        };
        
        snackbarStore.showSnackbar({
          text: 'Test run updated successfully',
          color: 'success'
        });
        
        editDialog.value = false;
      } catch (err) {
        console.error('Error updating test run:', err);
        
        snackbarStore.showSnackbar({
          text: 'Error updating test run',
          color: 'error'
        });
      } finally {
        saving.value = false;
      }
    };
    
    // Delete test run
    const deleteTestRun = async () => {
      deleting.value = true;
      
      try {
        await api.deleteTestRun(props.id);
        
        snackbarStore.showSnackbar({
          text: 'Test run deleted successfully',
          color: 'success'
        });
        
        // Navigate back to test runs list
        router.push('/test-runs');
      } catch (err) {
        console.error('Error deleting test run:', err);
        
        snackbarStore.showSnackbar({
          text: 'Error deleting test run',
          color: 'error'
        });
      } finally {
        deleting.value = false;
        confirmDelete.value = false;
      }
    };
    
    // View test case result details
    const viewResult = (result) => {
      resultDialog.result = result;
      resultDialog.show = true;
    };
    
    // Edit test case result
    const editResult = (result) => {
      // Implementation will be added in a future update
      console.log('Edit result:', result);
      
      snackbarStore.showSnackbar({
        text: 'Edit result functionality coming soon',
        color: 'info'
      });
    };
    
    // Confirm delete test case result
    const confirmDeleteResult = (result) => {
      confirmDeleteResultDialog.result = result;
      confirmDeleteResultDialog.show = true;
    };
    
    // Delete test case result
    const deleteResult = async () => {
      if (!confirmDeleteResultDialog.result) return;
      
      deleting.value = true;
      
      try {
        await api.deleteTestCaseResult(confirmDeleteResultDialog.result.id);
        
        // Remove from list
        testCaseResults.value = testCaseResults.value.filter(
          (result) => result.id !== confirmDeleteResultDialog.result.id
        );
        
        snackbarStore.showSnackbar({
          text: 'Test case result deleted successfully',
          color: 'success'
        });
        
        confirmDeleteResultDialog.show = false;
      } catch (err) {
        console.error('Error deleting test case result:', err);
        
        snackbarStore.showSnackbar({
          text: 'Error deleting test case result',
          color: 'error'
        });
      } finally {
        deleting.value = false;
      }
    };
    
    // Add new test case result
    const addResult = async () => {
      if (!newResult.value.test_case_id || !newResult.value.result) {
        snackbarStore.showSnackbar({
          text: 'Test case and result are required',
          color: 'error'
        });
        return;
      }
      
      saving.value = true;
      
      try {
        // Add test run ID to the new result
        const resultData = {
          ...newResult.value,
          test_run_id: props.id
        };
        
        const response = await api.createTestCaseResult(resultData);
        
        // Add to list
        testCaseResults.value.push(response.data);
        
        snackbarStore.showSnackbar({
          text: 'Test case result added successfully',
          color: 'success'
        });
        
        // Reset form and close dialog
        newResult.value = {
          test_case_id: null,
          result: 'Pass',
          comment: '',
          logs: '',
          artifacts: ''
        };
        addResultDialog.value = false;
      } catch (err) {
        console.error('Error adding test case result:', err);
        
        snackbarStore.showSnackbar({
          text: 'Error adding test case result',
          color: 'error'
        });
      } finally {
        saving.value = false;
      }
    };
    
    // Export results
    const exportResults = () => {
      // Implementation will be added in a future update
      console.log('Export results');
      
      snackbarStore.showSnackbar({
        text: 'Export functionality coming soon',
        color: 'info'
      });
    };
    
    // Computed properties
    const passRate = computed(() => {
      if (!testCaseResults.value || testCaseResults.value.length === 0) {
        return 0;
      }
      
      const passCount = testCaseResults.value.filter(
        result => result.result === 'Pass' || result.result === 'Passed'
      ).length;
      
      return Math.round((passCount / testCaseResults.value.length) * 100);
    });
    
    const filteredResults = computed(() => {
      return testCaseResults.value
        .filter(result => {
          // Filter by result
          if (filters.result !== 'All' && result.result !== filters.result) {
            return false;
          }
          
          // Filter by search term
          if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            const comment = (result.comment || '').toLowerCase();
            const id = result.id?.toString() || '';
            const testCaseTitle = result.test_case?.title?.toLowerCase() || '';
            
            return (
              comment.includes(searchTerm) ||
              id.includes(searchTerm) ||
              testCaseTitle.includes(searchTerm)
            );
          }
          
          return true;
        })
        .map(result => {
          // Ensure we have a test case title even if the test_case property is missing
          let testCaseTitle = 'Unknown Test Case';
          
          // Try to get title from test_case relation if it exists
          if (result.test_case && result.test_case.title) {
            testCaseTitle = result.test_case.title;
          } 
          // Fallback to using test_case_id if available
          else if (result.test_case_id) {
            testCaseTitle = `Test Case ${result.test_case_id}`;
          }
          
          return {
            id: result.id,
            test_case_id: result.test_case_id,
            test_case_title: testCaseTitle,
            result: result.result,
            comment: result.comment,
            raw: result
          };
        });
    });
    
    // Helper methods
    const getStatusColor = (status) => {
      switch (status) {
        case 'Completed':
          return 'success';
        case 'Running':
          return 'info';
        case 'Scheduled':
          return 'warning';
        case 'Failed':
          return 'error';
        case 'Cancelled':
          return 'grey';
        default:
          return 'primary';
      }
    };
    
    const getPassRateColor = (rate) => {
      if (rate >= 90) return 'success';
      if (rate >= 70) return 'info';
      if (rate >= 50) return 'warning';
      return 'error';
    };
    
    // Load data on mount
    onMounted(() => {
      fetchTestRun();
      fetchTestCases();
      fetchDUTs();
    });
    
    return {
      testRun,
      testCaseResults,
      loading,
      error,
      editDialog,
      confirmDelete,
      saving,
      deleting,
      dutName,
      itemsPerPage,
      editedRun,
      resultDialog,
      confirmDeleteResultDialog,
      addResultDialog,
      newResult,
      filters,
      resultHeaders,
      availableTestCases,
      
      passRate,
      filteredResults,
      getStatusColor,
      getPassRateColor,
      
      saveTestRun,
      deleteTestRun,
      viewResult,
      editResult,
      confirmDeleteResult,
      deleteResult,
      addResult,
      exportResults
    };
  }
};
</script>

<style scoped>
.text-pre-wrap {
  white-space: pre-wrap;
}
</style>