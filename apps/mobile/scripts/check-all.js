#!/usr/bin/env node
/* eslint-disable no-undef */

/**
 * Comprehensive Error Check Script
 * Runs all checks (dependencies, TypeScript, ESLint, tests) in one command
 * Perfect for CI/CD pipelines and pre-commit/pre-push validation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

class CheckRunner {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  log(message, color = 'reset') {
    console.log(`${COLORS[color]}${message}${COLORS.reset}`);
  }

  header(title) {
    this.log(`\n${'='.repeat(60)}`, 'cyan');
    this.log(`  ${title}`, 'cyan');
    this.log(`${'='.repeat(60)}\n`, 'cyan');
  }

  runCheck(name, command, optional = false) {
    this.log(`⏳ ${name}...`, 'blue');

    try {
      execSync(command, {
        stdio: 'pipe',
        cwd: __dirname.replace('/scripts', ''),
      });

      this.log(`✅ ${name} passed\n`, 'green');
      this.results.push({ name, passed: true, optional });
      return true;
    } catch (error) {
      const status = optional ? '⚠️  (optional)' : '❌';
      this.log(`${status} ${name} failed\n`, 'red');

      if (error.stdout) console.log(error.stdout.toString());
      if (error.stderr) console.log(error.stderr.toString());

      this.results.push({ name, passed: false, optional });
      return !optional; // Fail if not optional
    }
  }

  checkDependencies() {
    this.header('1️⃣  DEPENDENCY CHECK');

    const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
    const packageJsonPath = path.join(__dirname, '..', 'package.json');

    if (!fs.existsSync(nodeModulesPath)) {
      this.log('❌ node_modules not found', 'red');
      this.log('   Run: yarn install\n', 'yellow');
      return false;
    }

    if (!fs.existsSync(packageJsonPath)) {
      this.log('❌ package.json not found\n', 'red');
      return false;
    }

    this.log('✅ Dependencies installed\n', 'green');
    return true;
  }

  checkTypeScript() {
    this.header('2️⃣  TYPESCRIPT CHECK');
    return this.runCheck('TypeScript compilation', 'yarn typecheck');
  }

  checkLinting() {
    this.header('3️⃣  LINTING CHECK');
    return this.runCheck('ESLint', 'yarn lint');
  }

  checkTests() {
    this.header('4️⃣  TESTS CHECK');
    return this.runCheck('Test suite', 'yarn test --passWithNoTests', true);
  }

  summary() {
    this.header('SUMMARY');

    const passed = this.results.filter((r) => r.passed).length;
    const failed = this.results.filter((r) => !r.passed && !r.optional).length;
    const failedOptional = this.results.filter((r) => !r.passed && r.optional).length;

    this.log(`Total checks: ${this.results.length}`, 'cyan');
    this.log(`✅ Passed: ${passed}`, 'green');

    if (failedOptional > 0) {
      this.log(`⚠️  Failed (optional): ${failedOptional}`, 'yellow');
    }

    if (failed > 0) {
      this.log(`❌ Failed (critical): ${failed}`, 'red');
    }

    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(2);
    this.log(`⏱️  Time: ${elapsed}s\n`, 'cyan');

    return failed === 0;
  }

  run() {
    this.header('🔍 COMPREHENSIVE CODE CHECK');

    const depsOk = this.checkDependencies();
    if (!depsOk) {
      this.log('⛔ Cannot continue without dependencies installed\n', 'red');
      return 1;
    }

    let hasFailures = false;

    hasFailures |= !this.checkTypeScript();
    hasFailures |= !this.checkLinting();
    this.checkTests(); // Optional, doesn't affect result

    const summaryOk = this.summary();

    if (!summaryOk || hasFailures) {
      this.log('❌ CHECKS FAILED', 'red');
      this.log('   Fix the errors above and try again.\n', 'yellow');
      return 1;
    }

    this.log('✅ ALL CHECKS PASSED', 'green');
    this.log('   Your code is ready!\n', 'green');
    return 0;
  }
}

const runner = new CheckRunner();
process.exit(runner.run());
