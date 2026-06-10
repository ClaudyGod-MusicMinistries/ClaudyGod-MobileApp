#!/usr/bin/env node
/* eslint-disable no-undef */

/**
 * Check Dependencies Script
 * Verifies that all required dependencies are installed before committing/pushing
 * Prevents "Cannot find module" errors in git hooks and CI/CD pipelines
 */

const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function checkNodeModules() {
  const nodeModulesPath = path.join(__dirname, '..', 'node_modules');

  if (!fs.existsSync(nodeModulesPath)) {
    log('\n❌ FAILED: node_modules not found', 'red');
    log('   Run: npm install', 'yellow');
    return false;
  }

  return true;
}

function checkPackageJson() {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    log('\n❌ FAILED: package.json not found', 'red');
    return false;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const requiredDeps = {
      react: packageJson.dependencies?.react,
      'react-native': packageJson.dependencies?.['react-native'],
      typescript: packageJson.devDependencies?.typescript,
    };

    const missingDeps = Object.entries(requiredDeps)
      .filter(([_, version]) => !version)
      .map(([name]) => name);

    if (missingDeps.length > 0) {
      log(
        `\n❌ FAILED: Missing dependencies in package.json: ${missingDeps.join(', ')}`,
        'red'
      );
      return false;
    }

    return true;
  } catch (error) {
    log(`\n❌ FAILED: Error parsing package.json: ${error.message}`, 'red');
    return false;
  }
}

function checkRequiredModules() {
  const nodeModulesPath = path.join(__dirname, '..', 'node_modules');

  const requiredModules = [
    'react',
    'react-native',
    'typescript',
    '@react-navigation/native',
    'expo',
  ];

  const missingModules = requiredModules.filter(
    (module) => !fs.existsSync(path.join(nodeModulesPath, module))
  );

  if (missingModules.length > 0) {
    log(
      `\n⚠️  Missing modules: ${missingModules.join(', ')}`,
      'yellow'
    );
    log('   Run: npm install', 'yellow');
    return false;
  }

  return true;
}

function checkPackageLock() {
  const lockPath = path.join(__dirname, '..', 'package-lock.json');
  const yarnLockPath = path.join(__dirname, '..', 'yarn.lock');

  if (!fs.existsSync(lockPath) && !fs.existsSync(yarnLockPath)) {
    log('\n⚠️  WARNING: No lock file found (package-lock.json or yarn.lock)', 'yellow');
    log('   Dependency versions may be inconsistent', 'yellow');
    return false;
  }

  return true;
}

function runChecks() {
  log('\n🔍 Checking dependencies...', 'blue');

  const checks = [
    { name: 'package.json exists', fn: checkPackageJson },
    { name: 'node_modules exists', fn: checkNodeModules },
    { name: 'Required modules installed', fn: checkRequiredModules },
    { name: 'Lock file exists', fn: checkPackageLock },
  ];

  let allPassed = true;

  for (const { name, fn } of checks) {
    const passed = fn();
    const status = passed ? '✓' : '✗';
    const color = passed ? 'green' : 'red';
    log(`   ${status} ${name}`, color);

    if (!passed) {
      allPassed = false;
    }
  }

  if (allPassed) {
    log('\n✅ All dependency checks passed!\n', 'green');
    return 0;
  }

  log('\n❌ Dependency checks failed!', 'red');
  log('   Please run: npm install', 'yellow');
  log('   Then try again.\n', 'yellow');
  return 1;
}

// Run checks
process.exit(runChecks());
