import { build } from 'vite';
import fs from 'node:fs';

console.log('==============================================');
console.log('   STARTING VITE PRODUCTION BUILD             ');
console.log('==============================================');

try {
  await build({
    configFile: './vite.config.ts',
  });
  console.log('==============================================');
  console.log('   [SUCCESS] VITE BUILD COMPLETED!            ');
  console.log('==============================================');
  fs.writeFileSync('build_stages.txt', 'BUILD SUCCESS: ' + new Date().toISOString() + '\n', 'utf-8');
} catch (err) {
  console.error('==============================================');
  console.error('   [ERROR] VITE BUILD FAILED:                 ');
  console.error('==============================================');
  console.error(err);
  fs.writeFileSync('build_stages.txt', 'BUILD ERROR: ' + (err?.stack || err) + '\n', 'utf-8');
  process.exit(1);
}
