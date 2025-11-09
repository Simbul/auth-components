#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROUTES_DIR = join(process.cwd(), 'app', 'routes');

const ROUTE_FILES = {
  'login.tsx': `export { loader, default } from "@simbul/auth-components/routes/login";
`,
  'logout.tsx': `export { loader, action, default } from "@simbul/auth-components/routes/logout";
`,
  'auth.callback.tsx': `export { loader } from "@simbul/auth-components/routes/callback";
`,
};

console.log('🔐 Setting up Auth Components routes...\n');

// Ensure routes directory exists
if (!existsSync(ROUTES_DIR)) {
  console.log(`📁 Creating routes directory: ${ROUTES_DIR}`);
  mkdirSync(ROUTES_DIR, { recursive: true });
}

// Create route files
let created = 0;
let skipped = 0;

Object.entries(ROUTE_FILES).forEach(([filename, content]) => {
  const filepath = join(ROUTES_DIR, filename);

  if (existsSync(filepath)) {
    console.log(`⏭️  Skipped (already exists): ${filename}`);
    skipped++;
  } else {
    writeFileSync(filepath, content, 'utf-8');
    console.log(`✅ Created: ${filename}`);
    created++;
  }
});

console.log('\n' + '='.repeat(50));
console.log(`\n📊 Summary: ${created} created, ${skipped} skipped\n`);

if (created > 0) {
  console.log('📝 Next steps:\n');
  console.log('1. Add these routes to your app/routes.ts:\n');
  console.log(`   {
     path: "login",
     file: "routes/login.tsx",
   },
   {
     path: "logout",
     file: "routes/logout.tsx",
   },
   {
     path: "auth/callback",
     file: "routes/auth.callback.tsx",
   },\n`);
  console.log('2. Set up your root loader (see README)\n');
  console.log('3. Add the Header component to your layout\n');
  console.log('4. Configure environment variables (AUTH0_DOMAIN, etc.)\n');
} else {
  console.log('✨ All route files already exist. You\'re all set!\n');
}

console.log('📖 For full documentation, see packages/auth-components/README.md\n');
