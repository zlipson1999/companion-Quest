// Ignore Vite-specific arguments supplied by the preview supervisor.
const { spawn } = require('node:child_process');
const child = spawn(process.execPath, [require.resolve('expo/bin/cli'), 'start', '--web', '--port', '4173', '--offline'], { stdio: 'inherit', env: process.env });
child.on('exit', code => process.exit(code || 0));
