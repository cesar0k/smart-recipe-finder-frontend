// orval.config.ts
import { defineConfig } from 'orval';
import * as dotenv from 'dotenv'

dotenv.config();

const apiUrl = process.env.VITE_API_URL || "http://localhost:8001"
const schemaUrl = `${apiUrl}/openapi.json`;

export default defineConfig({
  api: {
    input: {
      target: schemaUrl, 
    },
    output: {
      mode: 'tags-split',
      target: 'src/api/generated.ts',
      schemas: 'src/api/model',
      client: 'react-query',
      mock: false,
      prettier: true,
      override: {
        mutator: {
          path: './src/api/axios.ts',
          name: 'customInstance',
        }
      }
    },
  },
});