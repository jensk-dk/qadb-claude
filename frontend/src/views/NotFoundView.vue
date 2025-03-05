<template>
  <div class="d-flex flex-column align-center justify-center" style="min-height: 60vh;">
    <h1 class="text-h2">404</h1>
    <h2 class="text-h4 mt-4">Page Not Found</h2>
    <p class="mt-2">The page you are looking for does not exist or has been moved.</p>
    <v-btn 
      color="primary" 
      class="mt-4" 
      :to="{ name: 'home' }"
    >
      Return to Dashboard
    </v-btn>
  </div>
</template>

<script>
export default {
  name: 'NotFoundView'
}
</script>