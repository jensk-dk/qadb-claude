<template>
  <div>
    <v-row>
      <v-col cols="12" class="d-flex align-center">
        <h1 class="text-h4">Test Suites</h1>
        <v-spacer></v-spacer>
        <v-btn 
          color="primary" 
          prepend-icon="mdi-plus"
          @click="dialog.show = true"
        >
          Add Test Suite
        </v-btn>
      </v-col>
    </v-row>

    <!-- Test Suites Data Table -->
    <v-card>
      <v-data-table
        :headers="headers"
        :items="testSuites"
        :loading="loading"
        :items-per-page="10"
        :footer-props="{
          'items-per-page-options': [5, 10, 15, 20, -1],
        }"
        class="elevation-1"
      >
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
          <p class="text-center">No test suites found. Create one to get started.</p>
        </template>
      </v-data-table>
    </v-card>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="dialog.show" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ dialog.isEdit ? 'Edit' : 'New' }} Test Suite</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="editedItem.name"
                  label="Test Suite Name*"
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
                <v-text-field
                  v-model="editedItem.version"
                  label="Version"
                ></v-text-field>
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
          <v-btn color="blue-darken-1" variant="text" @click="saveTestSuite">
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
          Are you sure you want to delete the test suite "{{ dialogDelete.item?.name }}"?
          This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="closeDeleteDialog">Cancel</v-btn>
          <v-btn color="red-darken-1" variant="text" @click="deleteTestSuite">Delete</v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useSnackbarStore } from '@/stores/snackbar'
import api from '@/services/api'

export default {
  name: 'TestSuitesView',
  setup() {
    const snackbarStore = useSnackbarStore()
    const testSuites = ref([])
    const loading = ref(false)
    
    // Table headers
    const headers = [
      { title: 'ID', key: 'id', sortable: true },
      { title: 'Name', key: 'name', sortable: true },
      { title: 'Description', key: 'description', sortable: false },
      { title: 'Version', key: 'version', sortable: true },
      { title: 'Created On', key: 'created_at', sortable: true },
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
      name: '',
      description: '',
      version: '1.0'
    }
    
    const editedItem = reactive({...defaultItem})
    
    // Load test suites from API
    const loadTestSuites = async () => {
      loading.value = true
      try {
        const response = await api.getTestSuites()
        testSuites.value = response.data
      } catch (error) {
        console.error('Error loading test suites:', error)
        snackbarStore.showSnackbar({
          text: 'Error loading test suites',
          color: 'error'
        })
      } finally {
        loading.value = false
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
    
    // Save test suite (create or update)
    const saveTestSuite = async () => {
      if (!editedItem.name) {
        snackbarStore.showSnackbar({
          text: 'Test suite name is required',
          color: 'error'
        })
        return
      }
      
      loading.value = true
      try {
        if (dialog.isEdit) {
          // Update existing test suite
          await api.updateTestSuite(editedItem.id, editedItem)
          snackbarStore.showSnackbar({
            text: 'Test suite updated successfully',
            color: 'success'
          })
        } else {
          // Create new test suite
          await api.createTestSuite(editedItem)
          snackbarStore.showSnackbar({
            text: 'Test suite created successfully',
            color: 'success'
          })
        }
        
        // Reload the list and close dialog
        await loadTestSuites()
        closeDialog()
      } catch (error) {
        console.error('Error saving test suite:', error)
        snackbarStore.showSnackbar({
          text: `Error ${dialog.isEdit ? 'updating' : 'creating'} test suite`,
          color: 'error'
        })
      } finally {
        loading.value = false
      }
    }
    
    // Delete test suite
    const deleteTestSuite = async () => {
      if (!dialogDelete.item) return
      
      loading.value = true
      try {
        await api.deleteTestSuite(dialogDelete.item.id)
        snackbarStore.showSnackbar({
          text: 'Test suite deleted successfully',
          color: 'success'
        })
        
        // Reload the list and close dialog
        await loadTestSuites()
        closeDeleteDialog()
      } catch (error) {
        console.error('Error deleting test suite:', error)
        snackbarStore.showSnackbar({
          text: 'Error deleting test suite',
          color: 'error'
        })
      } finally {
        loading.value = false
      }
    }
    
    // Load data when component is mounted
    onMounted(() => {
      loadTestSuites()
    })
    
    return {
      testSuites,
      loading,
      headers,
      dialog,
      dialogDelete,
      editedItem,
      
      editItem,
      confirmDelete,
      closeDialog,
      closeDeleteDialog,
      saveTestSuite,
      deleteTestSuite
    }
  }
}
</script>

<style scoped>
/* Add any component-specific styles here */
</style>