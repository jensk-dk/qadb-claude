<template>
  <div>
    <v-row>
      <v-col cols="12" class="d-flex align-center">
        <h1 class="text-h4">Test Cases</h1>
        <v-spacer></v-spacer>
        <v-btn 
          color="primary" 
          prepend-icon="mdi-plus"
          @click="dialog.show = true"
        >
          Add Test Case
        </v-btn>
      </v-col>
    </v-row>

    <!-- Filter by Test Suite -->
    <v-card class="mb-4 px-4 py-2">
      <v-row>
        <v-col cols="12" sm="6" md="4">
          <v-select
            v-model="filterSuite"
            :items="testSuites"
            item-title="name"
            item-value="id"
            label="Filter by Test Suite"
            clearable
            @update:model-value="loadTestCases"
            return-object
          >
            <template v-slot:prepend-item>
              <v-list-item
                title="All Test Suites"
                value="all"
                @click="filterSuite = null; loadTestCases()"
              ></v-list-item>
              <v-divider class="mt-2"></v-divider>
            </template>
          </v-select>
        </v-col>
        <v-col cols="12" sm="6" md="4">
          <v-text-field
            v-model="search"
            label="Search"
            prepend-icon="mdi-magnify"
            clearable
            @keyup.enter="loadTestCases"
          ></v-text-field>
        </v-col>
      </v-row>
    </v-card>

    <!-- Test Cases Data Table -->
    <v-card>
      <v-data-table
        :headers="headers"
        :items="testCasesFormatted"
        :loading="loading"
        :items-per-page="10"
        :footer-props="{
          'items-per-page-options': [5, 10, 15, 20, -1],
        }"
        class="elevation-1"
      >
        <template v-slot:item.test_suite="{ item }">
          {{ item.raw?.test_suite?.name || 'Not assigned' }}
        </template>
        <template v-slot:item.status="{ item }">
          <v-chip
            :color="getStatusColor(item.raw.status || 'Active')"
            size="small"
          >
            {{ item.raw.status || 'Active' }}
          </v-chip>
        </template>
        <template v-slot:item.actions="{ item }">
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
          <p class="text-center">No test cases found. Create one to get started.</p>
        </template>
      </v-data-table>
    </v-card>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="dialog.show" max-width="700px">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ dialog.isEdit ? 'Edit' : 'New' }} Test Case</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.title"
                  label="Test Case Title*"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="editedItem.test_suite_id"
                  :items="testSuites"
                  item-title="name"
                  item-value="id"
                  label="Test Suite"
                  clearable
                ></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.case_id"
                  label="Case ID*"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.version_string"
                  label="Version*"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="editedItem.description"
                  label="Description"
                  rows="3"
                ></v-textarea>
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="editedItem.steps"
                  label="Test Steps"
                  rows="5"
                  hint="Step-by-step instructions for performing this test"
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
          <v-btn color="blue-darken-1" variant="text" @click="saveTestCase">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="dialogDelete.show" max-width="500px">
      <v-card>
        <v-card-title class="text-h5">Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete the test case "{{ dialogDelete.item?.title }}"?
          This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="closeDeleteDialog">Cancel</v-btn>
          <v-btn color="red-darken-1" variant="text" @click="deleteTestCase">Delete</v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { useSnackbarStore } from '@/stores/snackbar'
import api from '@/services/api'

export default {
  name: 'TestCasesView',
  setup() {
    const snackbarStore = useSnackbarStore()
    const testCases = ref([])
    const testSuites = ref([])
    const loading = ref(false)
    const search = ref('')
    const filterSuite = ref(null)
    
    // Format test cases for display
    const testCasesFormatted = computed(() => {
      return testCases.value.map(tc => ({
        id: tc.id,
        name: tc.title, // Use title as name
        description: tc.description,
        test_suite: tc.test_suite_id ? 
          testSuites.value.find(ts => ts.id === tc.test_suite_id)?.name || 'Unknown' : 
          'Not assigned',
        status: 'Active', // Default status if not specified
        ...tc
      }))
    })
    
    // Table headers
    const headers = [
      { title: 'ID', key: 'id', sortable: true },
      { title: 'Title', key: 'title', sortable: true },
      { title: 'Case ID', key: 'case_id', sortable: true },
      { title: 'Test Suite', key: 'test_suite', sortable: false },
      { title: 'Description', key: 'description', sortable: false },
      { title: 'Actions', key: 'actions', sortable: false }
    ]
    
    // Dialog state for create/edit
    const dialog = reactive({
      show: false,
      isEdit: false
    })
    
    // Dialog state for delete confirmation
    const dialogDelete = reactive({
      show: false,
      item: null
    })
    
    // Item being edited
    const defaultItem = {
      title: '',
      case_id: '',
      version: 1,
      version_string: '1.0',
      description: '',
      test_suite_id: null,
      steps: '',
      precondition: '',
      area: '',
      automatability: 'Yes',
      author: '',
      material: '',
      is_challenged: false
    }
    
    const editedItem = reactive({...defaultItem})
    
    // Load test suites for dropdown
    const loadTestSuites = async () => {
      try {
        const response = await api.getTestSuites()
        testSuites.value = response.data
      } catch (error) {
        console.error('Error loading test suites:', error)
        snackbarStore.showSnackbar({
          text: 'Error loading test suites',
          color: 'error'
        })
      }
    }
    
    // Load test cases from API
    const loadTestCases = async () => {
      loading.value = true
      
      const params = {}
      
      // Add test_suite_id filter if selected
      if (filterSuite.value) {
        params.test_suite_id = filterSuite.value.id
      }
      
      // Add search term if provided
      if (search.value) {
        params.search = search.value
      }
      
      try {
        const response = await api.getTestCases(params)
        console.log('Loaded test cases:', response.data)
        testCases.value = response.data
      } catch (error) {
        console.error('Error loading test cases:', error)
        snackbarStore.showSnackbar({
          text: 'Error loading test cases',
          color: 'error'
        })
      } finally {
        loading.value = false
      }
    }
    
    // Get color for status chips
    const getStatusColor = (status) => {
      switch (status) {
        case 'Active':
          return 'success'
        case 'Inactive':
          return 'warning'
        case 'Deprecated':
          return 'error'
        default:
          return 'grey'
      }
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
    
    // Close the delete dialog
    const closeDeleteDialog = () => {
      dialogDelete.show = false
      // Wait for dialog to close before resetting
      setTimeout(() => {
        dialogDelete.item = null
      }, 300)
    }
    
    // Save test case (create or update)
    const saveTestCase = async () => {
      if (!editedItem.title || !editedItem.case_id || !editedItem.version_string) {
        snackbarStore.showSnackbar({
          text: 'Test case title, ID and version are required',
          color: 'error'
        })
        return
      }
      
      loading.value = true
      try {
        if (dialog.isEdit) {
          // Update existing test case
          await api.updateTestCase(editedItem.id, editedItem)
          snackbarStore.showSnackbar({
            text: 'Test case updated successfully',
            color: 'success'
          })
        } else {
          // Create new test case
          await api.createTestCase(editedItem)
          snackbarStore.showSnackbar({
            text: 'Test case created successfully',
            color: 'success'
          })
        }
        
        // Reload the list and close dialog
        await loadTestCases()
        closeDialog()
      } catch (error) {
        console.error('Error saving test case:', error)
        snackbarStore.showSnackbar({
          text: `Error ${dialog.isEdit ? 'updating' : 'creating'} test case`,
          color: 'error'
        })
      } finally {
        loading.value = false
      }
    }
    
    // Delete test case
    const deleteTestCase = async () => {
      if (!dialogDelete.item) return
      
      loading.value = true
      try {
        await api.deleteTestCase(dialogDelete.item.id)
        snackbarStore.showSnackbar({
          text: 'Test case deleted successfully',
          color: 'success'
        })
        
        // Reload the list and close dialog
        await loadTestCases()
        closeDeleteDialog()
      } catch (error) {
        console.error('Error deleting test case:', error)
        snackbarStore.showSnackbar({
          text: 'Error deleting test case',
          color: 'error'
        })
      } finally {
        loading.value = false
      }
    }
    
    // Load data when component is mounted
    onMounted(() => {
      loadTestSuites()
      loadTestCases()
    })
    
    return {
      testCases,
      testCasesFormatted,
      testSuites,
      loading,
      search,
      filterSuite,
      headers,
      dialog,
      dialogDelete,
      editedItem,
      
      loadTestCases,
      getStatusColor,
      editItem,
      confirmDelete,
      closeDialog,
      closeDeleteDialog,
      saveTestCase,
      deleteTestCase
    }
  }
}
</script>

<style scoped>
/* Add any component-specific styles here */
</style>