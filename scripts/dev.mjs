/**
 * Dev launcher: runs the Express API (tsx server.ts) and the Vite dev server
 * together, cross-platform, with no extra dependencies.
 *
 *   npm run dev        → API on :3000 + Vite on :5173 (proxies /api → :3000)
 */
import { spawn } from 'node:child_process';
import process from 'node:process';

const children = [];

function run(name, command, args) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
  });
  child.on('exit', (code) => {
    console.log(`[dev] ${name} exited with code ${code ?? 0} — shutting down.`);
    shutdown(code ?? 0);
  });
  children.push(child);
  return child;
}

function shutdown(code) {
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

run('api', 'npx', ['tsx', 'server.ts']);
run('vite', 'npx', ['vite']);
