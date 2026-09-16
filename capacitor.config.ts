import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.badre.electrician",
  appName: "Badre Electrician",
  // Capacitor ko sync ke waqt ek local index.html chahiye. App khulne par
  // niche di hui published site load hogi, isliye login/database bhi chalega.
  webDir: "capacitor-web",
  server: {
    url: "https://mere-pyare-app.lovable.app",
    cleartext: false,
  },

  android: {
    allowMixedContent: false,
  },
};

export default config;
