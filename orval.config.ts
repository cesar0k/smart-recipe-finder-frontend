// orval.config.ts
import { defineConfig } from 'orval';
import * as dotenv from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

dotenv.config();

const apiUrl = process.env.VITE_API_URL || 'http://localhost:8001';
const schemaUrl = `${apiUrl}/openapi.json`;
const localSchemaPath = resolve(import.meta.dirname, 'openapi.json');

// Pick a schema source: prefer the live backend, fall back to the committed
// openapi.json snapshot when the backend is unreachable. This keeps `npm run
// gen:api` working offline / when the backend is down, while still picking up
// fresh schema changes whenever the backend is available.
async function pickSchemaTarget(): Promise<string> {
  try {
    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 3000);
    const res = await fetch(schemaUrl, { method: 'GET', signal: ac.signal });
    clearTimeout(timeout);

    if (res.ok) {
      console.log(`[orval] using live schema: ${schemaUrl}`);
      return schemaUrl;
    }
    console.warn(
      `[orval] ${schemaUrl} responded with ${res.status}, falling back to local openapi.json`,
    );
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.warn(
      `[orval] cannot reach ${schemaUrl} (${reason}), falling back to local openapi.json`,
    );
  }

  if (!existsSync(localSchemaPath)) {
    throw new Error(
      `[orval] backend schema is unreachable and no local fallback found at ${localSchemaPath}`,
    );
  }
  return localSchemaPath;
}

export default defineConfig({
  api: {
    input: {
      target: await pickSchemaTarget(),
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
        },
      },
    },
  },
});
