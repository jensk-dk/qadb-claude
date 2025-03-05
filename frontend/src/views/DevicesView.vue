<template>
  <div>
    <v-row>
      <v-col cols="12" class="d-flex align-center">
        <h1 class="text-h4">Devices Under Test (DUTs)</h1>
        <v-spacer></v-spacer>
        <v-btn 
          color="primary" 
          prepend-icon="mdi-plus"
          @click="dialog.show = true"
        >
          Add Device
        </v-btn>
      </v-col>
    </v-row>

    <!-- Device Data Table -->
    <v-card>
      <v-data-table
        :headers="headers"
        :items="devices"
        :loading="loading"
        :items-per-page="10"
        :footer-props="{
          'items-per-page-options': [5, 10, 15, 20, -1],
        }"
        class="elevation-1"
      >
        <template v-slot:item.capabilities="{ item }">
          <!-- Handle case where capabilities might not be included in response -->
          <v-chip
            v-for="(cap, i) in item.raw.capabilities || []"
            :key="i"
            size="small"
            class="mr-1 mb-1"
            color="info"
          >
            {{ cap.name }}
          </v-chip>
          <span v-if="!item.raw.capabilities || item.raw.capabilities.length === 0">
            No capabilities
          </span>
        </template>
        <template v-slot:item.status="{ item }">
          <v-chip
            :color="getStatusColor(item.raw.status)"
            size="small"
          >
            {{ item.raw.status }}
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
          <p class="text-center">No devices found. Create one to get started.</p>
        </template>
      </v-data-table>
    </v-card>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="dialog.show" max-width="700px">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ dialog.isEdit ? 'Edit' : 'New' }} Device</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.name"
                  label="Device Name*"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.identifier"
                  label="Device Identifier"
                  hint="e.g., Serial Number, MAC Address"
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
                  v-model="editedItem.model"
                  label="Model"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.firmware_version"
                  label="Firmware Version"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="editedItem.status"
                  :items="['Active', 'Maintenance', 'Retired', 'Reserved']"
                  label="Status"
                ></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.location"
                  label="Location"
                  hint="Physical location of the device"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-combobox
                  v-model="selectedCapabilities"
                  :items="availableCapabilities"
                  item-title="name"
                  label="Capabilities"
                  multiple
                  chips
                  hint="Select or create device capabilities"
                  persistent-hint
                >
                  <template v-slot:selection="{ item }">
                    <v-chip
                      :key="item.value"
                      closable
                      @click:close="removeCapability(item)"
                    >
                      {{ item.title || item.name }}
                    </v-chip>
                  </template>
                </v-combobox>
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
          <v-btn color="blue-darken-1" variant="text" @click="saveDevice">
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
          Are you sure you want to delete the device "{{ dialogDelete.item?.name }}"?
          This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="closeDeleteDialog">Cancel</v-btn>
          <v-btn color="red-darken-1" variant="text" @click="deleteDevice">Delete</v-btn>
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
  name: 'DevicesView',
  setup() {
    const snackbarStore = useSnackbarStore()
    const devices = ref([])
    const availableCapabilities = ref([])
    const selectedCapabilities = ref([])
    const loading = ref(false)
    
    // Table headers
    const headers = [
      { title: 'ID', key: 'id', sortable: true },
      { title: 'Name', key: 'name', sortable: true },
      { title: 'Identifier', key: 'identifier', sortable: true },
      { title: 'Model', key: 'model', sortable: true },
      { title: 'Firmware', key: 'firmware_version', sortable: true },
      { title: 'Status', key: 'status', sortable: true },
      { title: 'Capabilities', key: 'capabilities', sortable: false },
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
      identifier: '',
      model: '',
      firmware_version: '',
      status: 'Active',
      location: '',
      capabilities: []
    }
    
    const editedItem = reactive({...defaultItem})
    
    // Load devices from API
    const loadDevices = async () => {
      loading.value = true
      console.log('DevicesView: Loading devices from API...')
      try {
        const response = await api.getDUTs()
        console.log('DevicesView: API Response:', response)
        console.log('DevicesView: Data from API:', response.data)
        console.log('DevicesView: Data length:', response.data?.length || 0)
        
        // Debug response
        console.log('DevicesView: Raw API Response:', JSON.stringify(response.data));
        
        // Map backend fields to frontend field names
        devices.value = (response.data || []).map(dut => {
          console.log('DevicesView: Processing DUT:', dut)
          return {
            id: dut.id,
            raw: dut, // Store the raw data for actions
            name: dut.product_name, // Map product_name to name for UI
            status: 'Active', // Default status if not provided
            identifier: dut.id?.toString() || 'N/A', // Use ID as identifier
            model: dut.model || '',
            firmware_version: dut.make || '', // Use make as firmware version if needed
            location: dut.countries || '', // Use countries as location if needed
            capabilities: dut.capabilities || [] // Ensure capabilities exists
          }
        })
        
        console.log('DevicesView: Processed devices for UI:', devices.value)
      } catch (error) {
        console.error('DevicesView: Error loading devices:', error)
        console.error('DevicesView: Error details:', error.response?.data || error.message)
        
        snackbarStore.showSnackbar({
          text: 'Error loading devices',
          color: 'error'
        })
      } finally {
        loading.value = false
      }
    }
    
    // Load capabilities for dropdown
    const loadCapabilities = async () => {
      try {
        const response = await api.getCapabilities()
        availableCapabilities.value = response.data || []
      } catch (error) {
        console.error('Error loading capabilities:', error)
        // Set default empty array instead of showing error
        availableCapabilities.value = []
        
        // Log error but don't show snackbar to avoid confusing users
        console.warn('Could not load capabilities, using empty array instead')
      }
    }
    
    // Get color for status chips
    const getStatusColor = (status) => {
      switch (status) {
        case 'Active':
          return 'success'
        case 'Maintenance':
          return 'warning'
        case 'Reserved':
          return 'info'
        case 'Retired':
          return 'error'
        default:
          return 'grey'
      }
    }
    
    // Remove capability from selection
    const removeCapability = (item) => {
      const index = selectedCapabilities.value.indexOf(item)
      if (index >= 0) selectedCapabilities.value.splice(index, 1)
    }
    
    // Edit an existing item
    const editItem = (item) => {
      dialog.isEdit = true
      
      // Map backend fields to frontend fields
      Object.assign(editedItem, {
        ...item,
        // These fields are already mapped in loadDevices but ensure they're set correctly here too
        name: item.name || item.product_name,
        make: item.make || '',
        firmware_version: item.firmware_version || item.make || '',
        model: item.model || '',
        countries: item.countries || '',
        location: item.location || item.countries || '',
        status: item.status || 'Active'
      })
      
      // Set selected capabilities
      selectedCapabilities.value = item.capabilities ? [...item.capabilities] : []
      
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
        selectedCapabilities.value = []
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
    
    // Map selected capabilities to the correct format for API
    const prepareCapabilities = () => {
      return selectedCapabilities.value.map(cap => {
        // For existing capabilities
        if (typeof cap === 'object' && cap.id) {
          return { id: cap.id }
        }
        // For new capabilities (string or object without id)
        return { name: typeof cap === 'string' ? cap : cap.name || cap.title }
      })
    }
    
    // Save device (create or update)
    const saveDevice = async () => {
      if (!editedItem.name) {
        snackbarStore.showSnackbar({
          text: 'Device name is required',
          color: 'error'
        })
        return
      }
      
      loading.value = true
      try {
        // Map frontend fields to backend fields
        const deviceData = {
          product_name: editedItem.name,
          make: editedItem.make || editedItem.firmware_version,
          model: editedItem.model || '',
          countries: editedItem.countries || editedItem.location,
          parent: editedItem.parent || null
        }
        
        // Prepare capabilities - skipping for now since endpoint has issues
        // deviceData.capabilities = prepareCapabilities()
        
        if (dialog.isEdit) {
          // Update existing device
          await api.updateDUT(editedItem.id, deviceData)
          snackbarStore.showSnackbar({
            text: 'Device updated successfully',
            color: 'success'
          })
        } else {
          // Create new device
          await api.createDUT(deviceData)
          snackbarStore.showSnackbar({
            text: 'Device created successfully',
            color: 'success'
          })
        }
        
        // Reload the list and close dialog
        await loadDevices()
        // Skip capabilities reload since endpoint has issues
        // await loadCapabilities()
        closeDialog()
      } catch (error) {
        console.error('Error saving device:', error)
        snackbarStore.showSnackbar({
          text: `Error ${dialog.isEdit ? 'updating' : 'creating'} device`,
          color: 'error'
        })
      } finally {
        loading.value = false
      }
    }
    
    // Delete device
    const deleteDevice = async () => {
      if (!dialogDelete.item) return
      
      loading.value = true
      try {
        await api.deleteDUT(dialogDelete.item.id)
        snackbarStore.showSnackbar({
          text: 'Device deleted successfully',
          color: 'success'
        })
        
        // Reload the list and close dialog
        await loadDevices()
        closeDeleteDialog()
      } catch (error) {
        console.error('Error deleting device:', error)
        snackbarStore.showSnackbar({
          text: 'Error deleting device',
          color: 'error'
        })
      } finally {
        loading.value = false
      }
    }
    
    // Load data when component is mounted
    onMounted(() => {
      loadDevices()
      loadCapabilities()
    })
    
    return {
      devices,
      availableCapabilities,
      selectedCapabilities,
      loading,
      headers,
      dialog,
      dialogDelete,
      editedItem,
      
      getStatusColor,
      removeCapability,
      editItem,
      confirmDelete,
      closeDialog,
      closeDeleteDialog,
      saveDevice,
      deleteDevice
    }
  }
}
</script>

<style scoped>
/* Add any component-specific styles here */
</style>