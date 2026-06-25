import { spawnSync } from 'node:child_process';

const run = (cmd) => {
  const result = spawnSync(cmd, { stdio: 'inherit', shell: true });
  if (typeof result.status === 'number' && result.status !== 0) {
    process.exit(result.status);
  }
};

run('npm run build:server');
run('npm run build:client');

