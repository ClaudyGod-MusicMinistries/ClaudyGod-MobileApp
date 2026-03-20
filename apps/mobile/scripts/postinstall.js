/* global __dirname */
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const shouldSkipHooks = () => {
  const ciValue = String(process.env.CI || '').trim().toLowerCase();
  if (ciValue === '1' || ciValue === 'true') {
    return true;
  }

  const hooksDir = path.resolve(__dirname, '..', '..', '.git', 'hooks');
  if (!fs.existsSync(hooksDir)) {
    return true;
  }

  try {
    fs.accessSync(hooksDir, fs.constants.W_OK);
  } catch {
    return true;
  }

  const gitCheck = spawnSync('git', ['--version'], { stdio: 'ignore' });
  return Boolean(gitCheck.error) || gitCheck.status !== 0;
};

if (shouldSkipHooks()) {
  process.exit(0);
}

const isWindows = process.platform === 'win32';
const binaryName = isWindows ? 'lefthook.cmd' : 'lefthook';
const binaryPath = path.join(__dirname, '..', 'node_modules', '.bin', binaryName);

if (!fs.existsSync(binaryPath)) {
  process.exit(0);
}

try {
  const result = spawnSync(binaryPath, ['install'], {
    stdio: 'inherit',
  });

  if (result.error) {
    process.exit(0);
  }

  process.exit(0);
} catch {
  process.exit(0);
}
