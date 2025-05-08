import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables
  const env = loadEnv(mode, process.cwd(), '');
  const supabaseUrl = env.VITE_SUPABASE_URL || '';

  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        '/api/media': {
          target: supabaseUrl,
          changeOrigin: true,
          rewrite: (path) => {
            return path.replace(/^\/api\/media/, '/storage/v1/object/public');
          },
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log(`[Vite Proxy] Forwarding request: ${req.method} ${req.url} -> ${supabaseUrl}${proxyReq.path}`);
            });
            proxy.on('error', (err, _req, _res) => {
              console.error('[Vite Proxy] Error:', err);
            });
          },
        },
      },
    },
    plugins: [
      react(),
      mode === 'development' &&
      componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ['react-quill']
    },
    optimizeDeps: {
      include: ['react-quill'],
      esbuildOptions: {
        target: 'esnext'
      }
    },
    build: {
      commonjsOptions: {
        include: [/react-quill/, /node_modules/],
      },
    }
  };
});
