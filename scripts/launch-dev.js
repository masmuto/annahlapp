// Daemon launcher — spawns `bun run dev` as a detached process that survives parent exit.
// Usage: node /home/z/my-project/scripts/launch-dev.js
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_DIR = '/home/z/my-project';
const devLog = fs.openSync(path.join(PROJECT_DIR, 'dev.log'), 'w');

const child = spawn('bun', ['run', 'dev'], {
  cwd: PROJECT_DIR,
  detached: true,          // new process group — survives parent exit
  stdio: ['ignore', devLog, devLog],
  env: { ...process.env, FORCE_COLOR: '0' },
});

child.unref();             // allow parent (this script) to exit independently

// Write the PID file so we can manage it later
fs.writeFileSync(path.join(PROJECT_DIR, '.zscripts', 'dev.pid'), String(child.pid));

console.log(`Dev server launched as PID ${child.pid} (detached, will survive parent exit)`);
process.exit(0);
