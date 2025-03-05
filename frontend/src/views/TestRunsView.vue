<template>
  <div>
    <v-row>
      <v-col cols="12" class="d-flex align-center">
        <h1 class="text-h4">Test Runs</h1>
        <v-spacer></v-spacer>
        <v-btn 
          color="primary" 
          prepend-icon="mdi-plus"
          @click="dialog.show = true"
          class="mr-2"
        >
          New Test Run
        </v-btn>
        <v-btn 
          color="success" 
          prepend-icon="mdi-upload"
          @click="uploadDialog.show = true"
        >
          Upload Results
        </v-btn>
      </v-col>
    </v-row>

    <!-- Filters -->
    <v-card class="mb-4 px-4 py-2">
      <v-row>
        <v-col cols="12" sm="4">
          <v-select
            v-model="filters.status"
            :items="['All', 'Passed', 'Failed', 'Running', 'Scheduled', 'Cancelled']"
            label="Status"
            clearable
            @update:model-value="loadTestRuns"
          >
            <template v-slot:prepend-item>
              <v-list-item
                title="All Statuses"
                value="all"
                @click="filters.status = null; loadTestRuns()"
              ></v-list-item>
              <v-divider class="mt-2"></v-divider>
            </template>
          </v-select>
        </v-col>
        <v-col cols="12" sm="4">
          <v-text-field
            v-model="filters.search"
            label="Search"
            prepend-icon="mdi-magnify"
            clearable
            @keyup.enter="loadTestRuns"
          ></v-text-field>
        </v-col>
        <v-col cols="12" sm="4" class="d-flex align-center">
          <v-btn color="primary" @click="loadTestRuns">Apply Filters</v-btn>
        </v-col>
      </v-row>
    </v-card>

    <!-- Test Runs Data Table -->
    <v-card>
      <v-data-table
        :headers="headers"
        :items="testRunsFormatted"
        :loading="loading"
        :items-per-page="10"
        :footer-props="{
          'items-per-page-options': [5, 10, 15, 20, -1],
        }"
        class="elevation-1"
      >
        <template v-slot:item.run_date="{ item }">
          {{ formatDate(item.raw.run_date) }}
        </template>
        <template v-slot:item.device_name="{ item }">
          {{ item.raw?.device?.name || 'N/A' }}
        </template>
        <template v-slot:item.status="{ item }">
          <v-chip
            :color="getStatusColor(item.raw.status)"
            size="small"
          >
            {{ item.raw.status }}
          </v-chip>
        </template>
        <template v-slot:item.pass_rate="{ item }">
          <v-progress-linear
            :model-value="getPassRate(item.raw)"
            :color="getPassRateColor(getPassRate(item.raw))"
            height="15"
            class="rounded-lg"
          >
            <span class="text-caption white--text">
              {{ getPassRate(item.raw) }}%
            </span>
          </v-progress-linear>
        </template>
        <template v-slot:item.actions="{ item }">
          <v-icon
            size="small"
            class="me-2"
            @click="viewTestRun(item.raw)"
          >
            mdi-eye
          </v-icon>
          <v-icon
            size="small"
            class="me-2"
            @click="editItem(item.raw)"
          >
            mdi-pencil
          </v-icon>
          <v-icon
            size="small"
            @click="confirmDelete(item.raw)"
          >
            mdi-delete
          </v-icon>
        </template>
        <template v-slot:no-data>
          <p class="text-center">No test runs found. Create one or upload results.</p>
        </template>
      </v-data-table>
    </v-card>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="dialog.show" max-width="700px">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ dialog.isEdit ? 'Edit' : 'New' }} Test Run</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.name"
                  label="Test Run Name*"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="editedItem.status"
                  :items="['Scheduled', 'Running', 'Completed', 'Failed', 'Cancelled']"
                  label="Status*"
                  required
                ></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="editedItem.dut_id"
                  :items="devices"
                  item-title="product_name"
                  item-value="id"
                  label="Device"
                  clearable
                ></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="editedItem.operator_id"
                  :items="operators"
                  item-title="name"
                  item-value="id"
                  label="Operator*"
                  required
                ></v-select>
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="editedItem.description"
                  label="Description"
                  rows="3"
                ></v-textarea>
              </v-col>
            </v-row>
          </v-container>
          <small>*indicates required field</small>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="closeDialog">
            Cancel
          </v-btn>
          <v-btn color="blue-darken-1" variant="text" @click="saveTestRun">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Upload Dialog -->
    <v-dialog v-model="uploadDialog.show" max-width="700px">
      <v-card>
        <v-card-title>
          <span class="text-h5">Upload Test Results</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-file-input
                  v-model="uploadFile"
                  label="Upload Results File"
                  accept=".json,.csv,.xlsx"
                  prepend-icon="mdi-file-upload"
                  show-size
                  truncate-length="15"
                ></v-file-input>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="uploadData.test_run_name"
                  label="Test Run Name"
                  hint="Leave blank to use filename"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="uploadData.dut_id"
                  :items="devices"
                  item-title="product_name"
                  item-value="id"
                  label="Device"
                  clearable
                ></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="uploadData.operator_id"
                  :items="operators"
                  item-title="name"
                  item-value="id"
                  label="Operator"
                  required
                ></v-select>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="closeUploadDialog">
            Cancel
          </v-btn>
          <v-btn color="success" variant="text" :loading="uploading" @click="uploadResults">
            Upload
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="dialogDelete.show" max-width="500px">
      <v-card>
        <v-card-title class="text-h5">Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete the test run "{{ dialogDelete.item?.name }}"?
          This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="closeDeleteDialog">Cancel</v-btn>
          <v-btn color="red-darken-1" variant="text" @click="deleteTestRun">Delete</v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSnackbarStore } from '@/stores/snackbar'
import api from '@/services/api'

export default {
  name: 'TestRunsView',
  setup() {
    const router = useRouter()
    const snackbarStore = useSnackbarStore()
    const testRuns = ref([])
    const devices = ref([])
    const operators = ref([])
    const loading = ref(false)
    const uploading = ref(false)
    const uploadFile = ref(null)
    
    // Format test runs for display
    const testRunsFormatted = computed(() => {
      return testRuns.value.map(tr => {
        // Default values for missing properties
        return {
          ...tr,
          device_name: tr.dut_id ? devices.value.find(d => d.id === tr.dut_id)?.product_name : 'N/A',
          operator_name: tr.operator_id ? operators.value.find(o => o.id === tr.operator_id)?.name : 'Unknown'
        }
      })
    })
    
    // Filters
    const filters = reactive({
      status: null,
      search: ''
    })
    
    // Table headers
    const headers = [
      { title: 'ID', key: 'id', sortable: true },
      { title: 'Name', key: 'name', sortable: true },
      { title: 'Status', key: 'status', sortable: true },
      { title: 'Device', key: 'device_name', sortable: false },
      { title: 'Date', key: 'run_date', sortable: true },
      { title: 'Pass Rate', key: 'pass_rate', sortable: false },
      { title: 'Actions', key: 'actions', sortable: false }
    ]
    
    // Dialog state for create/edit
    const dialog = reactive({
      show: false,
      isEdit: false
    })
    
    // Dialog for file upload
    const uploadDialog = reactive({
      show: false
    })
    
    // Upload data
    const uploadData = reactive({
      test_run_name: '',
      dut_id: null,
      operator_id: null
    })
    
    // Dialog state for delete confirmation
    const dialogDelete = reactive({
      show: false,
      item: null
    })
    
    // Item being edited
    const defaultItem = {
      name: '',
      status: 'Scheduled',
      dut_id: null,
      operator_id: null,
      description: '',
      run_date: new Date().toISOString().split('T')[0]
    }
    
    const editedItem = reactive({...defaultItem})
    
    // Format date
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A'
      try {
        const date = new Date(dateString)
        return date.toISOString().split('T')[0] // Returns YYYY-MM-DD
      } catch (e) {
        return dateString
      }
    }
    
    // Load devices for dropdown
    const loadDevices = async () => {
      try {
        const response = await api.getDUTs()
        devices.value = response.data
      } catch (error) {
        console.error('Error loading devices:', error)
        snackbarStore.showSnackbar({
          text: 'Error loading devices',
          color: 'error'
        })
      }
    }
    
    // Load operators for dropdown
    const loadOperators = async () => {
      try {
        const response = await api.getUsers()
        operators.value = response.data
      } catch (error) {
        console.error('Error loading operators:', error)
        snackbarStore.showSnackbar({
          text: 'Error loading operators',
          color: 'error'
        })
      }
    }
    
    // Load test runs from API
    const loadTestRuns = async () => {
      loading.value = true
      console.log('TestRunsView: Loading test runs from API...')
      
      const params = {}
      
      // Add status filter if selected
      if (filters.status && filters.status !== 'All') {
        params.status = filters.status
      }
      
      // Add search term if provided
      if (filters.search) {
        params.search = filters.search
      }
      
      console.log('TestRunsView: Query parameters:', params)
      
      try {
        const response = await api.getTestRuns(params)
        console.log('TestRunsView: API Response:', response)
        console.log('TestRunsView: Data from API:', response.data)
        console.log('TestRunsView: Data length:', response.data?.length || 0)
        
        // Debug response
        console.log('TestRunsView: Raw API Response:', JSON.stringify(response.data));
        
        // Map backend fields to frontend field names
        testRuns.value = (response.data || []).map(run => {
          console.log('TestRunsView: Processing test run:', run);
          return {
            id: run.id,
            raw: run, // Store the raw data for actions and details
            name: run.name || `Test Run #${run.id}`,
            status: run.status || 'Unknown',
            run_date: run.run_date || 'N/A',
            description: run.description || '',
            // Store these for potential use but we'll use raw data for components
            dut_id: run.dut_id,
            operator_id: run.operator_id
          };
        });
        
        console.log('TestRunsView: Test runs assigned to UI:', testRuns.value)
      } catch (error) {
        console.error('TestRunsView: Error loading test runs:', error)
        console.error('TestRunsView: Error details:', error.response?.data || error.message)
        
        snackbarStore.showSnackbar({
          text: 'Error loading test runs',
          color: 'error'
        })
      } finally {
        loading.value = false
      }
    }
    
    // Get color for status chips
    const getStatusColor = (status) => {
      switch (status) {
        case 'Completed':
          return 'success'
        case 'Running':
          return 'info'
        case 'Scheduled':
          return 'warning'
        case 'Failed':
          return 'error'
        case 'Cancelled':
          return 'grey'
        default:
          return 'primary'
      }
    }
    
    // Calculate pass rate
    const getPassRate = (testRun) => {
      if (!testRun.test_case_results || testRun.test_case_results.length === 0) {
        return 0
      }
      
      const passCount = testRun.test_case_results.filter(
        result => result.result === 'Pass' || result.result === 'Passed'
      ).length
      
      return Math.round((passCount / testRun.test_case_results.length) * 100)
    }
    
    // Get color for pass rate
    const getPassRateColor = (rate) => {
      if (rate >= 90) return 'success'
      if (rate >= 70) return 'info'
      if (rate >= 50) return 'warning'
      return 'error'
    }
    
    // Navigate to test run details
    const viewTestRun = (item) => {
      router.push(`/test-runs/${item.id}`)
    }
    
    // Edit an existing item
    const editItem = (item) => {
      dialog.isEdit = true
      Object.assign(editedItem, item)
      dialog.show = true
    }
    
    // Prepare for deletion
    const confirmDelete = (item) => {
      dialogDelete.item = item
      dialogDelete.show = true
    }
    
    // Close the create/edit dialog
    const closeDialog = () => {
      dialog.show = false
      // Wait for dialog to close before resetting form
      setTimeout(() => {
        dialog.isEdit = false
        Object.assign(editedItem, defaultItem)
      }, 300)
    }
    
    // Close the upload dialog
    const closeUploadDialog = () => {
      uploadDialog.show = false
      // Wait for dialog to close before resetting
      setTimeout(() => {
        uploadFile.value = null
        uploadData.test_run_name = ''
        uploadData.dut_id = null
        uploadData.operator_id = null
      }, 300)
    }
    
    // Close the delete dialog
    const closeDeleteDialog = () => {
      dialogDelete.show = false
      // Wait for dialog to close before resetting
      setTimeout(() => {
        dialogDelete.item = null
      }, 300)
    }
    
    // Save test run (create or update)
    const saveTestRun = async () => {
      if (!editedItem.name || !editedItem.status || !editedItem.operator_id) {
        snackbarStore.showSnackbar({
          text: 'Name, status, and operator are required',
          color: 'error'
        })
        return
      }
      
      loading.value = true
      try {
        if (dialog.isEdit) {
          // Update existing test run
          await api.updateTestRun(editedItem.id, editedItem)
          snackbarStore.showSnackbar({
            text: 'Test run updated successfully',
            color: 'success'
          })
        } else {
          // Create new test run
          await api.createTestRun(editedItem)
          snackbarStore.showSnackbar({
            text: 'Test run created successfully',
            color: 'success'
          })
        }
        
        // Reload the list and close dialog
        await loadTestRuns()
        closeDialog()
      } catch (error) {
        console.error('Error saving test run:', error)
        snackbarStore.showSnackbar({
          text: `Error ${dialog.isEdit ? 'updating' : 'creating'} test run`,
          color: 'error'
        })
      } finally {
        loading.value = false
      }
    }
    
    // Delete test run
    const deleteTestRun = async () => {
      if (!dialogDelete.item) return
      
      loading.value = true
      try {
        await api.deleteTestRun(dialogDelete.item.id)
        snackbarStore.showSnackbar({
          text: 'Test run deleted successfully',
          color: 'success'
        })
        
        // Reload the list and close dialog
        await loadTestRuns()
        closeDeleteDialog()
      } catch (error) {
        console.error('Error deleting test run:', error)
        snackbarStore.showSnackbar({
          text: 'Error deleting test run',
          color: 'error'
        })
      } finally {
        loading.value = false
      }
    }
    
    // Upload test results
    const uploadResults = async () => {
      if (!uploadFile.value) {
        snackbarStore.showSnackbar({
          text: 'Please select a file to upload',
          color: 'error'
        })
        return
      }
      
      if (!uploadData.operator_id) {
        snackbarStore.showSnackbar({
          text: 'Please select an operator',
          color: 'error'
        })
        return
      }
      
      uploading.value = true
      try {
        const formData = new FormData()
        formData.append('file', uploadFile.value)
        
        if (uploadData.test_run_name) {
          formData.append('test_run_name', uploadData.test_run_name)
        }
        
        if (uploadData.dut_id) {
          formData.append('dut_id', uploadData.dut_id)
        }
        
        formData.append('operator_id', uploadData.operator_id)
        
        await api.uploadTestResults(formData)
        
        snackbarStore.showSnackbar({
          text: 'Test results uploaded successfully',
          color: 'success'
        })
        
        // Reload the list and close dialog
        await loadTestRuns()
        closeUploadDialog()
      } catch (error) {
        console.error('Error uploading test results:', error)
        snackbarStore.showSnackbar({
          text: 'Error uploading test results',
          color: 'error'
        })
      } finally {
        uploading.value = false
      }
    }
    
    // Load data when component is mounted
    onMounted(() => {
      loadDevices()
      loadOperators()
      loadTestRuns()
    })
    
    return {
      testRuns,
      testRunsFormatted,
      devices,
      operators,
      loading,
      uploading,
      filters,
      headers,
      dialog,
      dialogDelete,
      uploadDialog,
      uploadFile,
      uploadData,
      editedItem,
      
      formatDate,
      loadTestRuns,
      getStatusColor,
      getPassRate,
      getPassRateColor,
      viewTestRun,
      editItem,
      confirmDelete,
      closeDialog,
      closeUploadDialog,
      closeDeleteDialog,
      saveTestRun,
      deleteTestRun,
      uploadResults
    }
  }
}
</script>

<style scoped>
/* Add any component-specific styles here */
</style>