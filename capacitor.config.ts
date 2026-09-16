import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.badre.electrician",
  appName: "Badre Electrician",
  // Static build output (npm run build ke baad banta hai)
  webDir: "dist/client",

  // IMPORTANT: Ye app login/database ke liye server use karta hai.
  // Agar app publish ho jaye, to neeche wali line uncomment karke
  // apni published URL daal do — phir APK hamesha live site dikhayega
  // aur login/database bhi kaam karega:
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
