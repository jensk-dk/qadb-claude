<template>
  <div>
    <v-row>
      <v-col cols="12" class="d-flex align-center">
        <h1 class="text-h4">Test Run Templates</h1>
        <v-spacer></v-spacer>
        <v-btn 
          color="primary" 
          prepend-icon="mdi-plus"
          @click="dialog.show = true"
        >
          Add Template
        </v-btn>
      </v-col>
    </v-row>

    <!-- Templates Data Table -->
    <v-card>
      <v-data-table
        :headers="headers"
        :items="templates"
        :loading="loading"
        :items-per-page="10"
        :footer-props="{
          'items-per-page-options': [5, 10, 15, 20, -1],
        }"
        class="elevation-1"
      >
        <template v-slot:item.test_count="{ item }">
          {{ item.raw.test_cases?.length || 0 }}
        </template>
        <template v-slot:item.actions="{ item }">
          <v-icon
            size="small"
            class="me-2"
            @click="viewDetails(item.raw)"
            title="View/Edit Test Cases"
          >
            mdi-file-tree
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
          <p class="text-center">No test run templates found. Create one to get started.</p>
        </template>
      </v-data-table>
    </v-card>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="dialog.show" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ dialog.isEdit ? 'Edit' : 'New' }} Test Run Template</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="editedItem.name"
                  label="Template Name*"
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
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.version"
                  label="Version"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-checkbox
                  v-model="editedItem.is_default"
                  label="Set as Default Template"
                ></v-checkbox>
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
          <v-btn color="blue-darken-1" variant="text" @click="saveTemplate">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Test Cases Management Dialog -->
    <v-dialog v-model="detailsDialog.show" max-width="900px" persistent>
      <v-card>
        <v-card-title>
          <span class="text-h5">Manage Test Cases for "{{ detailsDialog.template?.name }}"</span>
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-card class="mb-4">
                <v-card-title class="text-subtitle-1">
                  Available Test Cases
                  <v-spacer></v-spacer>
                  <v-text-field
                    v-model="testCaseSearch"
                    append-icon="mdi-magnify"
                    label="Search"
                    single-line
                    hide-details
                    dense
                    @keyup.enter="filterAvailableTestCases"
                  ></v-text-field>
                </v-card-title>
                <v-list height="400" class="overflow-y-auto">
                  <v-list-item
                    v-for="testCase in availableTestCases"
                    :key="testCase.id"
                    :title="testCase.name"
                    :subtitle="testCase.description || 'No description'"
                  >
                    <template v-slot:append>
                      <v-btn
                        icon="mdi-plus"
                        size="small"
                        color="success"
                        @click="addTestCaseToTemplate(testCase)"
                        title="Add to template"
                      ></v-btn>
                    </template>
                  </v-list-item>
                  <v-list-item v-if="availableTestCases.length === 0">
                    <v-list-item-title>No test cases available</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-card>
            </v-col>
            <v-col cols="12" md="6">
              <v-card>
                <v-card-title class="text-subtitle-1">
                  Template Test Cases
                </v-card-title>
                <v-list height="400" class="overflow-y-auto">
                  <v-list-item
                    v-for="testCase in templateTestCases"
                    :key="testCase.id"
                    :title="testCase.name"
                    :subtitle="testCase.description || 'No description'"
                  >
                    <template v-slot:append>
                      <v-btn
                        icon="mdi-minus"
                        size="small"
                        color="error"
                        @click="removeTestCaseFromTemplate(testCase)"
                        title="Remove from template"
                      ></v-btn>
                    </template>
                  </v-list-item>
                  <v-list-item v-if="templateTestCases.length === 0">
                    <v-list-item-title>No test cases in this template</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="closeDetailsDialog">Done</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="dialogDelete.show" max-width="500px">
      <v-card>
        <v-card-title class="text-h5">Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete the test run template "{{ dialogDelete.item?.name }}"?
          This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="closeDeleteDialog">Cancel</v-btn>
          <v-btn color="red-darken-1" variant="text" @click="deleteTemplate">Delete</v-btn>
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
  name: 'RunTemplatesView',
  setup() {
    const snackbarStore = useSnackbarStore()
    const templates = ref([])
    const allTestCases = ref([])
    const availableTestCases = ref([])
    const templateTestCases = ref([])
    const loading = ref(false)
    const testCaseSearch = ref('')
    
    // Table headers
    const headers = [
      { title: 'ID', key: 'id', sortable: true },
      { title: 'Name', key: 'name', sortable: true },
      { title: 'Description', key: 'description', sortable: false },
      { title: 'Version', key: 'version', sortable: true },
      { title: 'Test Cases', key: 'test_count', sortable: true },
      { title: 'Default', key: 'is_default', sortable: true, type: 'boolean' },
      { title: 'Actions', key: 'actions', sortable: false }
    ]
    
    // Dialog state for create/edit
    const dialog = reactive({
      show: false,
      isEdit: false
    })
    
    // Dialog state for test case details
    const detailsDialog = reactive({
      show: false,
      template: null
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
      version: '1.0',
      is_default: false
    }
    
    const editedItem = reactive({...defaultItem})
    
    // Load templates from API
    const loadTemplates = async () => {
      loading.value = true
      try {
        const response = await api.getTestRunTemplates()
        templates.value = response.data
      } catch (error) {
        console.error('Error loading test run templates:', error)
        snackbarStore.showSnackbar({
          text: 'Error loading test run templates',
          color: 'error'
        })
      } finally {
        loading.value = false
      }
    }
    
    // Load all test cases for dropdown
    const loadAllTestCases = async () => {
      try {
        const response = await api.getTestCases()
        allTestCases.value = response.data
      } catch (error) {
        console.error('Error loading test cases:', error)
        snackbarStore.showSnackbar({
          text: 'Error loading test cases',
          color: 'error'
        })
      }
    }
    
    // Filter available test cases based on search and already selected
    const filterAvailableTestCases = () => {
      // Get current template test case IDs
      const templateTestCaseIds = templateTestCases.value.map(tc => tc.id)
      
      // Filter all test cases that are not already in the template
      availableTestCases.value = allTestCases.value.filter(tc => {
        // Skip if already in template
        if (templateTestCaseIds.includes(tc.id)) return false
        
        // Apply search filter if provided
        if (testCaseSearch.value) {
          const searchTerm = testCaseSearch.value.toLowerCase()
          return tc.name.toLowerCase().includes(searchTerm) || 
                 (tc.description && tc.description.toLowerCase().includes(searchTerm))
        }
        
        return true
      })
    }
    
    // View template details and manage test cases
    const viewDetails = async (template) => {
      detailsDialog.template = template
      
      // Load template test cases
      try {
        await loadAllTestCases()
        
        // Set template test cases
        templateTestCases.value = template.test_cases || []
        
        // Filter available test cases
        filterAvailableTestCases()
        
        // Show dialog
        detailsDialog.show = true
      } catch (error) {
        console.error('Error loading template details:', error)
        snackbarStore.showSnackbar({
          text: 'Error loading template details',
          color: 'error'
        })
      }
    }
    
    // Add test case to template
    const addTestCaseToTemplate = async (testCase) => {
      try {
        await api.addTestCaseToTemplate(detailsDialog.template.id, testCase.id)
        
        // Update UI
        templateTestCases.value.push(testCase)
        filterAvailableTestCases()
        
        snackbarStore.showSnackbar({
          text: 'Test case added to template',
          color: 'success'
        })
      } catch (error) {
        console.error('Error adding test case to template:', error)
        snackbarStore.showSnackbar({
          text: 'Error adding test case to template',
          color: 'error'
        })
      }
    }
    
    // Remove test case from template
    const removeTestCaseFromTemplate = async (testCase) => {
      try {
        await api.removeTestCaseFromTemplate(detailsDialog.template.id, testCase.id)
        
        // Update UI
        const index = templateTestCases.value.findIndex(tc => tc.id === testCase.id)
        if (index >= 0) templateTestCases.value.splice(index, 1)
        filterAvailableTestCases()
        
        snackbarStore.showSnackbar({
          text: 'Test case removed from template',
          color: 'success'
        })
      } catch (error) {
        console.error('Error removing test case from template:', error)
        snackbarStore.showSnackbar({
          text: 'Error removing test case from template',
          color: 'error'
        })
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
    
    // Close the details dialog
    const closeDetailsDialog = () => {
      detailsDialog.show = false
      // Reload templates to get updated test case counts
      loadTemplates()
      // Wait for dialog to close before resetting
      setTimeout(() => {
        detailsDialog.template = null
        templateTestCases.value = []
        availableTestCases.value = []
        testCaseSearch.value = ''
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
    
    // Save template (create or update)
    const saveTemplate = async () => {
      if (!editedItem.name) {
        snackbarStore.showSnackbar({
          text: 'Template name is required',
          color: 'error'
        })
        return
      }
      
      loading.value = true
      try {
        if (dialog.isEdit) {
          // Update existing template
          await api.updateTestRunTemplate(editedItem.id, editedItem)
          snackbarStore.showSnackbar({
            text: 'Template updated successfully',
            color: 'success'
          })
        } else {
          // Create new template
          await api.createTestRunTemplate(editedItem)
          snackbarStore.showSnackbar({
            text: 'Template created successfully',
            color: 'success'
          })
        }
        
        // Reload the list and close dialog
        await loadTemplates()
        closeDialog()
      } catch (error) {
        console.error('Error saving template:', error)
        snackbarStore.showSnackbar({
          text: `Error ${dialog.isEdit ? 'updating' : 'creating'} template`,
          color: 'error'
        })
      } finally {
        loading.value = false
      }
    }
    
    // Delete template
    const deleteTemplate = async () => {
      if (!dialogDelete.item) return
      
      loading.value = true
      try {
        await api.deleteTestRunTemplate(dialogDelete.item.id)
        snackbarStore.showSnackbar({
          text: 'Template deleted successfully',
          color: 'success'
        })
        
        // Reload the list and close dialog
        await loadTemplates()
        closeDeleteDialog()
      } catch (error) {
        console.error('Error deleting template:', error)
        snackbarStore.showSnackbar({
          text: 'Error deleting template',
          color: 'error'
        })
      } finally {
        loading.value = false
      }
    }
    
    // Load data when component is mounted
    onMounted(() => {
      loadTemplates()
    })
    
    return {
      templates,
      availableTestCases,
      templateTestCases,
      loading,
      testCaseSearch,
      headers,
      dialog,
      detailsDialog,
      dialogDelete,
      editedItem,
      
      filterAvailableTestCases,
      viewDetails,
      addTestCaseToTemplate,
      removeTestCaseFromTemplate,
      editItem,
      confirmDelete,
      closeDialog,
      closeDetailsDialog,
      closeDeleteDialog,
      saveTemplate,
      deleteTemplate
    }
  }
}
</script>

<style scoped>
.overflow-y-auto {
  overflow-y: auto;
}
</style>