<template>
  <v-container>
    <v-card>
      <v-tabs v-model="tab" color="primary">
        <v-tab value="general">General</v-tab>
        <v-tab value="account">Account</v-tab>
        <v-tab value="notifications">Notifications</v-tab>
      </v-tabs>

      <v-card-text>
        <v-window v-model="tab">
          <!-- General Settings -->
          <v-window-item value="general">
            <v-form @submit.prevent="saveSettings">
              <v-select
                v-model="settings.currency"
                :items="currencies"
                label="Default Currency"
                variant="outlined"
                class="mb-4"
              ></v-select>

              <v-select
                v-model="settings.theme"
                :items="themes"
                label="Theme"
                variant="outlined"
                class="mb-4"
              ></v-select>

              <v-switch
                v-model="settings.showDecimals"
                label="Show Decimals"
                color="primary"
                hide-details
                class="mb-4"
              ></v-switch>

              <div class="d-flex justify-end">
                <v-btn
                  type="submit"
                  color="primary"
                  :loading="saving"
                >
                  Save Changes
                </v-btn>
              </div>
            </v-form>
          </v-window-item>

          <!-- Account Settings -->
          <v-window-item value="account">
            <v-form @submit.prevent="updateProfile">
              <v-text-field
                v-model="user.name"
                label="Name"
                variant="outlined"
                class="mb-4"
              ></v-text-field>

              <v-text-field
                v-model="user.email"
                label="Email"
                type="email"
                variant="outlined"
                class="mb-4"
              ></v-text-field>

              <div class="d-flex justify-end">
                <v-btn
                  type="submit"
                  color="primary"
                  :loading="updating"
                >
                  Update Profile
                </v-btn>
              </div>
            </v-form>

            <v-divider class="my-6"></v-divider>

            <div class="text-h6 mb-4">Change Password</div>
            <v-form @submit.prevent="changePassword">
              <v-text-field
                v-model="password.current"
                label="Current Password"
                type="password"
                variant="outlined"
                class="mb-4"
                :rules="[v => !!v || 'Current password is required']"
              ></v-text-field>

              <v-text-field
                v-model="password.new"
                label="New Password"
                type="password"
                variant="outlined"
                class="mb-4"
                :rules="[v => !!v || 'New password is required']"
              ></v-text-field>

              <v-text-field
                v-model="password.confirm"
                label="Confirm New Password"
                type="password"
                variant="outlined"
                class="mb-4"
                :rules="[v => v === password.new || 'Passwords do not match']"
              ></v-text-field>

              <div class="d-flex justify-end">
                <v-btn
                  type="submit"
                  color="primary"
                  :loading="changingPassword"
                >
                  Change Password
                </v-btn>
              </div>
            </v-form>
          </v-window-item>

          <!-- Notifications Settings -->
          <v-window-item value="notifications">
            <v-switch
              v-model="notifications.priceAlerts"
              label="Price Alerts"
              color="primary"
              hide-details
              class="mb-4"
            ></v-switch>

            <v-switch
              v-model="notifications.portfolioUpdates"
              label="Portfolio Updates"
              color="primary"
              hide-details
              class="mb-4"
            ></v-switch>

            <v-switch
              v-model="notifications.newsletter"
              label="Newsletter"
              color="primary"
              hide-details
              class="mb-4"
            ></v-switch>

            <div class="d-flex justify-end">
              <v-btn
                color="primary"
                @click="saveNotificationSettings"
                :loading="savingNotifications"
              >
                Save Preferences
              </v-btn>
            </div>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const tab = ref('general');
const saving = ref(false);
const updating = ref(false);
const changingPassword = ref(false);
const savingNotifications = ref(false);

// Settings
const settings = ref({
  currency: 'USD',
  theme: 'light',
  showDecimals: true
});

// User profile
const user = ref({
  name: 'John Doe',
  email: 'john@example.com'
});

// Password change
const password = ref({
  current: '',
  new: '',
  confirm: ''
});

// Notification preferences
const notifications = ref({
  priceAlerts: true,
  portfolioUpdates: true,
  newsletter: false
});

// Available options
const currencies = [
  { title: 'US Dollar (USD)', value: 'USD' },
  { title: 'Euro (EUR)', value: 'EUR' },
  { title: 'British Pound (GBP)', value: 'GBP' },
  { title: 'Japanese Yen (JPY)', value: 'JPY' },
  { title: 'Bitcoin (BTC)', value: 'BTC' },
  { title: 'Ethereum (ETH)', value: 'ETH' }
];

const themes = [
  { title: 'Light', value: 'light' },
  { title: 'Dark', value: 'dark' },
  { title: 'System', value: 'system' }
];

// Load saved settings from localStorage
const loadSettings = () => {
  const savedSettings = localStorage.getItem('appSettings');
  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings);
      settings.value = { ...settings.value, ...parsed.settings };
      user.value = { ...user.value, ...parsed.user };
      notifications.value = { ...notifications.value, ...parsed.notifications };
    } catch (e) {
      console.error('Error loading settings:', e);
    }
  }
};

// Save settings to localStorage
const saveSettings = async () => {
  saving.value = true;
  try {
    const settingsToSave = {
      settings: settings.value,
      user: user.value,
      notifications: notifications.value
    };
    
    localStorage.setItem('appSettings', JSON.stringify(settingsToSave));
    
    // In a real app, you would make an API call here
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Show success message
    // In a real app, you might use a toast notification here
    console.log('Settings saved successfully');
  } catch (error) {
    console.error('Error saving settings:', error);
  } finally {
    saving.value = false;
  }
};

const updateProfile = async () => {
  updating.value = true;
  try {
    // In a real app, you would make an API call here
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update local storage
    const currentSettings = JSON.parse(localStorage.getItem('appSettings') || '{}');
    currentSettings.user = user.value;
    localStorage.setItem('appSettings', JSON.stringify(currentSettings));
    
    console.log('Profile updated successfully');
  } catch (error) {
    console.error('Error updating profile:', error);
  } finally {
    updating.value = false;
  }
};

const changePassword = async () => {
  changingPassword.value = true;
  try {
    // In a real app, you would make an API call here
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Reset password fields
    password.value = { current: '', new: '', confirm: '' };
    
    console.log('Password changed successfully');
  } catch (error) {
    console.error('Error changing password:', error);
  } finally {
    changingPassword.value = false;
  }
};

const saveNotificationSettings = async () => {
  savingNotifications.value = true;
  try {
    // In a real app, you would make an API call here
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update local storage
    const currentSettings = JSON.parse(localStorage.getItem('appSettings') || '{}');
    currentSettings.notifications = notifications.value;
    localStorage.setItem('appSettings', JSON.stringify(currentSettings));
    
    console.log('Notification preferences saved');
  } catch (error) {
    console.error('Error saving notification preferences:', error);
  } finally {
    savingNotifications.value = false;
  }
};

// Load settings when component mounts
onMounted(() => {
  loadSettings();
});
</script>

<style scoped>
.v-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.v-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.v-card-text {
  padding: 24px;
}

.v-window-item {
  padding-top: 16px;
}
</style>
