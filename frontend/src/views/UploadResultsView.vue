<template>
  <div>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Upload Test Results</h1>
        <p class="text-subtitle-1">Upload test results from JSON or Excel files</p>
      </v-col>
    </v-row>
    
    <v-row>
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title>
            Upload Files
          </v-card-title>
          
          <v-card-text>
            <div 
              class="drop-zone"
              :class="{ active: isDragging }"
              @dragenter.prevent="isDragging = true"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="onFileDrop"
              @click="triggerFileInput"
            >
              <div v-if="!selectedFile">
                <v-icon icon="mdi-cloud-upload" size="x-large" color="primary" class="mb-2"></v-icon>
                <h3>Drag and drop files here</h3>
                <p>Or click to browse</p>
                <p class="text-caption">Supported formats: JSON, Excel (.xlsx, .xls)</p>
              </div>
              <div v-else>
                <v-icon icon="mdi-file" size="large" color="primary" class="mb-2"></v-icon>
                <h3>{{ selectedFile.name }}</h3>
                <p>{{ formatFileSize(selectedFile.size) }}</p>
                <v-btn color="error" variant="text" @click.stop="clearSelectedFile">
                  Remove
                </v-btn>
              </div>
              
              <!-- Hidden file input -->
              <input 
                type="file" 
                ref="fileInput" 
                style="display: none"
                accept=".json,.xlsx,.xls"
                @change="onFileChange"
              >
            </div>
            
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
                  @click="uploadFile" 
                  :loading="uploading"
                  :disabled="!selectedFile || uploading"
                  block
                >
                  Upload Test Results
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>
            Upload Instructions
          </v-card-title>
          
          <v-card-text>
            <h3 class="text-subtitle-1">Supported Formats</h3>
            <v-list density="compact">
              <v-list-item prepend-icon="mdi-json">
                <v-list-item-title>JSON Format</v-list-item-title>
              </v-list-item>
              <v-list-item prepend-icon="mdi-microsoft-excel">
                <v-list-item-title>Excel Format (.xlsx, .xls)</v-list-item-title>
              </v-list-item>
            </v-list>
            
            <h3 class="text-subtitle-1 mt-4">File Structure</h3>
            <p>
              Your JSON file can use multiple formats:
            </p>
            
            <h4 class="text-body-2 font-weight-bold mt-2">Standard Format:</h4>
            <ul>
              <li><strong>test_run:</strong> Information about the test run
                <ul>
                  <li><strong>name:</strong> Test run name</li>
                  <li><strong>date:</strong> (Optional) Date of the test run</li>
                  <li><strong>device:</strong> (Optional) Device used for testing</li>
                </ul>
              </li>
              <li><strong>results:</strong> Array of test case results, each with:
                <ul>
                  <li><strong>test_case_id:</strong> Test case identifier</li>
                  <li><strong>result:</strong> Pass or Fail</li>
                  <li><strong>logs:</strong> (Optional) Test logs</li>
                </ul>
              </li>
            </ul>
            
            <h4 class="text-body-2 font-weight-bold mt-2">Alternative Format:</h4>
            <ul>
              <li><strong>test_cases:</strong> Array of test case definitions</li>
              <li><strong>test_case_results:</strong> Array of test results with test_case_id references</li>
            </ul>
            
            <h4 class="text-body-2 font-weight-bold mt-2">HbbTV Test Format:</h4>
            <ul>
              <li>Array of test report objects, each with:
                <ul>
                  <li><strong>test_case_id:</strong> Identifier</li>
                  <li><strong>state:</strong> Successful/Failed</li>
                  <li><strong>test_run_id:</strong> Reference ID</li>
                </ul>
              </li>
            </ul>
            
            <p>Note: If a test case doesn't exist in the database yet, it will be automatically created with the provided information.</p>
            
            <p class="text-caption mt-4">
              If test cases do not exist in the database, they will be automatically created.
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Upload Results Dialog -->
    <v-dialog v-model="showResultDialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span v-if="uploadSuccess">Upload Successful</span>
          <span v-else>Upload Failed</span>
        </v-card-title>
        
        <v-card-text>
          <div v-if="uploadSuccess">
            <v-alert type="success" text>
              {{ uploadMessage }}
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
              {{ uploadMessage }}
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
import { ref } from 'vue'
import { useSnackbarStore } from '@/stores/snackbar'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

export default {
  name: 'UploadResultsView',
  setup() {
    // State
    const isDragging = ref(false)
    const selectedFile = ref(null)
    const testRunName = ref('')
    const fileInput = ref(null)
    const uploading = ref(false)
    const showResultDialog = ref(false)
    const uploadSuccess = ref(false)
    const uploadMessage = ref('')
    
    // Composables
    const snackbarStore = useSnackbarStore()
    const authStore = useAuthStore()
    
    // Methods
    const triggerFileInput = () => {
      fileInput.value.click()
    }
    
    const onFileChange = (event) => {
      const files = event.target.files
      if (files.length > 0) {
        handleFile(files[0])
      }
    }
    
    const onFileDrop = (event) => {
      isDragging.value = false
      const files = event.dataTransfer.files
      if (files.length > 0) {
        handleFile(files[0])
      }
    }
    
    const handleFile = (file) => {
      const fileType = file.name.split('.').pop().toLowerCase()
      
      // Check if file type is supported
      if (!['json', 'xlsx', 'xls'].includes(fileType)) {
        snackbarStore.showSnackbar({
          text: 'Unsupported file type. Please upload JSON or Excel files only.',
          color: 'error'
        })
        return
      }
      
      selectedFile.value = file
      
      // Suggest a name for the test run based on the file name
      if (!testRunName.value) {
        const baseName = file.name.split('.')[0]
        testRunName.value = `${baseName} - ${new Date().toLocaleDateString()}`
      }
    }
    
    const clearSelectedFile = () => {
      selectedFile.value = null
      if (fileInput.value) {
        fileInput.value.value = ''
      }
    }
    
    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes'
      
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }
    
    const uploadFile = async () => {
      if (!selectedFile.value) return
      
      uploading.value = true
      
      try {
        // Create a form data object for the file upload
        const formData = new FormData()
        formData.append('file', selectedFile.value)
        
        // Add operator_id (current user)
        if (authStore.user?.id) {
          formData.append('operator_id', authStore.user.id)
          console.log('Including operator_id:', authStore.user.id);
        }
        
        // Add test run name if provided, or use filename
        const runName = testRunName.value || selectedFile.value.name.replace(/\.\w+$/, '');
        formData.append('test_run_name', runName);
        console.log('Using test run name:', runName);
        
        // If it's a JSON file, verify it has the right structure
        if (selectedFile.value.name.toLowerCase().endsWith('.json')) {
          console.log('Uploading JSON file - checking structure');
          
          // Read the file content to validate structure
          try {
            const fileReader = new FileReader();
            
            // Create a promise to wait for the file to be read
            const fileReadPromise = new Promise((resolve, reject) => {
              fileReader.onload = () => resolve(fileReader.result);
              fileReader.onerror = (e) => reject(e);
            });
            
            // Start reading the file
            fileReader.readAsText(selectedFile.value);
            
            // Wait for the file to be read
            const fileContent = await fileReadPromise;
            
            // Try to parse the JSON
            try {
              const jsonData = JSON.parse(fileContent);
              console.log('JSON structure:', Object.keys(jsonData));
              
              // Validate if it has test run and results
              if (jsonData.test_run || jsonData.results || Array.isArray(jsonData)) {
                console.log('JSON structure looks valid');
              } else {
                console.warn('JSON might not have the expected structure');
              }
            } catch (parseError) {
              console.error('Error parsing JSON:', parseError);
              // Continue anyway, server will handle validation
            }
          } catch (fileReadError) {
            console.error('Error reading file:', fileReadError);
            // Continue anyway, server will receive the file directly
          }
        }
        
        // Upload the file
        const response = await api.uploadTestResults(formData);
        console.log('Upload response:', response);
        
        // Show success message
        uploadSuccess.value = true;
        uploadMessage.value = response.data && response.data.message 
          ? response.data.message 
          : 'Test results uploaded successfully';
        
        // Add details to the message if available
        if (response.data && response.data.details) {
          uploadMessage.value += `\n\nDetails: ${response.data.details}`;
        }
        
        // Show dialog with results
        showResultDialog.value = true;
        
        // Clear form
        clearSelectedFile();
        testRunName.value = '';
      } catch (error) {
        console.error('Upload error:', error);
        
        // Show error message with detailed information if available
        uploadSuccess.value = false;
        
        // Try to extract the most useful error message
        let errorMsg = 'An error occurred during upload';
        
        if (error.response) {
          if (error.response.data) {
            if (error.response.data.detail) {
              errorMsg = error.response.data.detail;
            } else if (typeof error.response.data === 'string') {
              errorMsg = error.response.data;
            } else if (error.response.data.message) {
              errorMsg = error.response.data.message;
            }
          }
          
          // Add status code for debugging
          errorMsg += ` (Status: ${error.response.status})`;
        } else if (error.message) {
          errorMsg = error.message;
        }
        
        uploadMessage.value = errorMsg;
        showResultDialog.value = true;
      } finally {
        uploading.value = false;
      }
    }
    
    return {
      isDragging,
      selectedFile,
      testRunName,
      fileInput,
      uploading,
      showResultDialog,
      uploadSuccess,
      uploadMessage,
      triggerFileInput,
      onFileChange,
      onFileDrop,
      clearSelectedFile,
      formatFileSize,
      uploadFile
    }
  }
}
</script>

<style scoped>
/* Drop zone styles are defined globally in App.vue */
</style>