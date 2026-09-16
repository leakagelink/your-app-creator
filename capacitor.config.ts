import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.badre.electrician",
  appName: "Badre Electrician",
  // Static build output (npm run build ke baad banta hai)
  // TanStack Start is build se .output/public folder banta hai
  webDir: ".output/public",

  // IMPORTANT: Ye app email login aur database (Lovable Cloud) ke liye
  // server use karti hai. Local static files mein login/database kaam nahi karega.
  //
  // Test/development ke liye niche preview URL uncomment kar sakte ho.
  // Public release ke liye Lovable mein Publish karein aur published URL daalein.
  //
  // server: {
  //   url: "https://id-preview--417b9b4c-2a06-4b3d-8e33-2e31d178f2fe.lovable.app",
  //   cleartext: false,
  // },

  android: {
    allowMixedContent: false,
  },
};

export default config;
