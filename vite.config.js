import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 3000 },
  preview: {
    allowedHosts: [
      "expense-tracker-lb-1464887793.ap-south-1.elb.amazonaws.com"
    ]
  }

});
