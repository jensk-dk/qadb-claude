<template>
  <div>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Import Local Test Files</h1>
        <p class="text-subtitle-1">Import test results from local JSON files in the mock_data directory</p>
      </v-col>
    </v-row>
    
    <v-row>
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title>
            Available Files
          </v-card-title>
          
          <v-card-text>
            <div v-if="loading" class="d-flex justify-center align-center py-4">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
              <span class="ml-3">Loading files...</span>
            </div>
            
            <div v-else-if="availableFiles.length === 0" class="text-center py-4">
              <v-icon size="large" color="grey">mdi-file-outline</v-icon>
              <p class="mt-2">No files found in the mock_data directory</p>
            </div>
            
            <v-list v-else>
              <v-list-item
                v-for="file in availableFiles"
                :key="file.path"
                @click="selectFile(file)"
                :active="selectedFile?.path === file.path"
              >
                <template v-slot:prepend>
                  <v-icon color="primary">mdi-file-document-outline</v-icon>
                </template>
                
                <v-list-item-title>{{ file.name }}</v-list-item-title>
                <v-list-item-subtitle>{{ file.path }}</v-list-item-subtitle>
                
                <template v-slot:append>
                  <v-btn 
                    color="primary" 
                    variant="text" 
                    icon="mdi-eye"
                    @click.stop="previewFile(file)"
                    :title="'Preview ' + file.name"
                  ></v-btn>
                </template>
              </v-list-item>
            </v-list>
            
            <v-row class="mt-4">
              <v-col cols="12">
                <v-text-field
                  v-model="testRunName"
                  label="Test Run Name (optional)"
                  hint="Give this test run a descriptive name"
                ></v-text-field>
              </v-col>
            </v-row>
            
            <v-row class="mt-2">
              <v-col cols="12">
                <v-btn 
                  color="primary" 
                  @click="importFile" 
                  :loading="importing"
                  :disabled="!selectedFile || importing"
                  block
                >
                  Import Selected File
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>
            File Preview
          </v-card-title>
          
          <v-card-text v-if="!previewContent">
            <div class="text-center py-4">
              <v-icon size="large" color="grey">mdi-file-eye-outline</v-icon>
              <p class="mt-2">Select a file to preview</p>
            </div>
          </v-card-text>
          
          <v-card-text v-else>
            <v-alert
              v-if="previewError"
              type="error"
              text
            >
              {{ previewError }}
            </v-alert>
            <div v-else>
              <pre style="max-height: 400px; overflow: auto;"><code>{{ previewContent }}</code></pre>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Import Results Dialog -->
    <v-dialog v-model="showResultDialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span v-if="importSuccess">Import Successful</span>
          <span v-else>Import Failed</span>
        </v-card-title>
        
        <v-card-text>
          <div v-if="importSuccess">
            <v-alert type="success" text>
              {{ importMessage }}
            </v-alert>
            
            <div class="text-center mt-4">
              <v-btn
                color="primary"
                :to="{ name: 'test-runs' }"
              >
                View Test Runs
              </v-btn>
            </div>
          </div>
          <div v-else>
            <v-alert type="error" text>
              {{ importMessage }}
            </v-alert>
          </div>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="showResultDialog = false">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useSnackbarStore } from '@/stores/snackbar'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

export default {
  name: 'ImportLocalView',
  setup() {
    // State
    const loading = ref(false)
    const availableFiles = ref([])
    const selectedFile = ref(null)
    const testRunName = ref('')
    const importing = ref(false)
    const showResultDialog = ref(false)
    const importSuccess = ref(false)
    const importMessage = ref('')
    const previewContent = ref(null)
    const previewError = ref(null)
    
    // Composables
    const snackbarStore = useSnackbarStore()
    const authStore = useAuthStore()
    
    // Methods
    const loadAvailableFiles = async () => {
      loading.value = true
      
      try {
        // First option: Try to get files via API call
        availableFiles.value = [
          { name: 'test.json', path: '/home/jensk/QaDb2/mock_data/test.json' },
          { name: 'test2.json', path: '/home/jensk/QaDb2/mock_data/test2.json' }
        ]
      } catch (error) {
        console.error('Error loading files:', error)
        snackbarStore.showSnackbar({
          text: 'Failed to load available files',
          color: 'error'
        })
      } finally {
        loading.value = false
      }
    }
    
    const selectFile = (file) => {
      selectedFile.value = file
      
      // Suggest a name for the test run based on the file name
      if (!testRunName.value) {
        const baseName = file.name.split('.')[0]
        testRunName.value = `${baseName} Import - ${new Date().toLocaleDateString()}`
      }
      
      // Preview the file
      previewFile(file)
    }
    
    const previewFile = async (file) => {
      try {
        previewError.value = null
        
        // Read file contents as text
        const response = await fetch(file.path)
        if (!response.ok) {
          throw new Error(`Failed to load file: ${response.statusText}`)
        }
        
        const content = await response.text()
        
        // Parse as JSON to format it nicely
        try {
          const jsonContent = JSON.parse(content)
          previewContent.value = JSON.stringify(jsonContent, null, 2)
        } catch (e) {
          // If not valid JSON, just show as text
          previewContent.value = content
        }
      } catch (error) {
        console.error('Error previewing file:', error)
        previewError.value = 'Failed to preview file. File might not be accessible directly from browser.'
        previewContent.value = null
      }
    }
    
    const importFile = async () => {
      if (!selectedFile.value) return
      
      importing.value = true
      
      try {
        const response = await api.importLocalFile({
          file_path: selectedFile.value.path, 
          test_run_name: testRunName.value
        })
        
        // Show success message
        importSuccess.value = true
        importMessage.value = response.data.message
        showResultDialog.value = true
        
        // Clear form
        selectedFile.value = null
        testRunName.value = ''
      } catch (error) {
        console.error('Import error:', error)
        
        // Show error message
        importSuccess.value = false
        importMessage.value = error.response?.data?.detail || 'An error occurred during import'
        showResultDialog.value = true
      } finally {
        importing.value = false
      }
    }
    
    // Lifecycle hooks
    onMounted(() => {
      loadAvailableFiles()
    })
    
    return {
      loading,
      availableFiles,
      selectedFile,
      testRunName,
      importing,
      showResultDialog,
      importSuccess,
      importMessage,
      previewContent,
      previewError,
      selectFile,
      previewFile,
      importFile
    }
  }
}
</script>

<style scoped>
pre {
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>