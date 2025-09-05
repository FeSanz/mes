import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.space.mes',
  appName: 'mes',
  webDir: 'www',
  "plugins": {
    "CapacitorHttp": {
      "enabled": true
    }
  }
};

export default config;
