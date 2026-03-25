<template>
  <v-container class="py-8" max-width="800">
    <v-card>
      <v-card-title>Live Order Notifications</v-card-title>
      <v-divider></v-divider>

      <v-card-text class="py-6" style="min-height: 500px">
        <div class="d-flex align-center mb-4">
          <v-chip
            :color="connected ? 'green' : 'red'"
            size="small"
            variant="flat"
          >
            {{ connected ? "Connected" : "Disconnected" }}
          </v-chip>
        </div>

        <div
          v-if="notifications.length === 0"
          class="text-center text-grey py-8"
        >
          <p class="text-sm">No notifications yet</p>
        </div>

        <div v-else>
          <div
            v-for="(notification, index) in notifications"
            :key="index"
            class="mb-4 pb-4"
            :style="
              index < notifications.length - 1
                ? 'border-bottom: 1px solid #eee;'
                : ''
            "
          >
            <p class="text-sm ma-0">
              Order placed for {{ notification.data.lensName }} by
              {{ notification.data.customerName }}
            </p>
            <p class="text-xs text-grey-darken-1 mt-1">
              {{ formatTime(notification.timestamp) }}
            </p>
          </div>
        </div>
      </v-card-text>

      <v-divider v-if="notifications.length > 0"></v-divider>
      <v-card-actions v-if="notifications.length > 0">
        <v-spacer></v-spacer>
        <v-btn size="small" variant="text" @click="clearNotifications">
          Clear
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const notifications = ref([]);
const connected = ref(false);
let ws = null;
let reconnectTimer = null;

const WS_URL =
  import.meta.env.VITE_NOTIFICATION_WS || "ws://localhost:3003/ws";

function connectWebSocket() {
  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    connected.value = true;
    console.log("WebSocket connected");
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      notifications.value.unshift(data);
    } catch (e) {
      console.error("Failed to parse WebSocket message:", e);
    }
  };

  ws.onclose = () => {
    connected.value = false;
    console.log("WebSocket disconnected, reconnecting in 3s...");
    reconnectTimer = setTimeout(connectWebSocket, 3000);
  };

  ws.onerror = (err) => {
    console.error("WebSocket error:", err);
    ws.close();
  };
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function clearNotifications() {
  notifications.value = [];
}

onMounted(() => {
  connectWebSocket();
});

onUnmounted(() => {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (ws) ws.close();
});
</script>
