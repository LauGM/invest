<script setup>
import { ref, onMounted } from 'vue';
import { useTheme } from 'vuetify';
import { RouterView } from 'vue-router';

const theme = useTheme();
const drawer = ref(true);
const rail = ref(false);
const isDark = ref(false);

// Load theme preference from localStorage
onMounted(() => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    isDark.value = savedTheme === 'dark';
    theme.change(isDark.value ? 'dark' : 'light');
  } else {
    // Default to system preference if no saved preference
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
    theme.change(isDark.value ? 'dark' : 'light');
  }
});

// Watch for system theme changes
if (typeof window !== 'undefined') {
  const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  darkModeMediaQuery.addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      isDark.value = e.matches;
      theme.global.name.value = isDark.value ? 'dark' : 'light';
    }
  });
}

// Toggle theme
const toggleTheme = () => {
  isDark.value = !isDark.value;
  theme.change(isDark.value ? 'dark' : 'light');
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
};

const menuItems = [
  { title: 'Dashboard', icon: 'mdi-view-dashboard', to: '/' },
  { title: 'My Investments', icon: 'mdi-chart-line', to: '/investments' },
  { title: 'Add Investment', icon: 'mdi-plus-circle', to: '/add-investment' },
  { title: 'Analytics', icon: 'mdi-chart-areaspline', to: '/analytics' },
  { title: 'Settings', icon: 'mdi-cog', to: '/settings' },
];
</script>

<template>
  <v-app :theme="isDark ? 'dark' : 'light'">
    <v-navigation-drawer
      v-model="drawer"
      :rail="rail"
      permanent
      @click="rail = false"
    >
      <v-list-item
        prepend-avatar="https://randomuser.me/api/portraits/men/85.jpg"
        title="John Leider"
        nav
      >
        <template v-slot:append>
          <v-btn
            variant="text"
            :icon="rail ? 'mdi-chevron-right' : 'mdi-chevron-left'"
            @click.stop="rail = !rail"
          ></v-btn>
        </template>
      </v-list-item>

      <v-divider></v-divider>

      <v-list density="compact" nav>
        <v-list-item
          v-for="(item, i) in menuItems"
          :key="i"
          :value="item"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
        ></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar color="primary">
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title>Investments Tracker</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn
        icon
        @click="toggleTheme"
        :title="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
      >
        <v-icon>{{ isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
      </v-btn>
      <v-btn icon>
        <v-icon>mdi-magnify</v-icon>
      </v-btn>

      <v-btn icon>
        <v-badge content="2" color="error">
          <v-icon>mdi-bell</v-icon>
        </v-badge>
      </v-btn>
    </v-app-bar>

    <v-main>
      <v-container fluid class="pa-6">
        <router-view v-slot="{ Component, route }">
          <transition name="fade" mode="out-in">
            <component :is="Component" :key="route.path" v-if="Component" />
          </transition>
        </router-view>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.v-main {
  min-height: 100vh;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Ensure the transition wrapper takes full width */
:deep(.fade-enter-active),
:deep(.fade-leave-active) {
  display: block;
  width: 100%;
}

.v-navigation-drawer__content {
  overflow-y: auto !important;
}
</style>
