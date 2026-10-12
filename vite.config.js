import {defineConfig} from 'vite';
export default defineConfig({
  server:{host:'127.0.0.1',proxy:{'/api/icon':'http://127.0.0.1:8787'}},
  build:{target:'es2022',sourcemap:false}
});
