const { execSync } = require('child_process');
try {
  const result = execSync('npx.cmd vite build', { cwd: __dirname, stdio: 'inherit', shell: true });
  console.log('Build succeeded');
} catch (e) {
  console.error('Build failed:', e.message);
  process.exit(1);
}
