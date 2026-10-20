/* global __dirname */
const fs = require('node:fs');
const path = require('node:path');

function patchPackage(packageName, certifiedVersion, patches) {
  const candidates = [
    path.resolve(__dirname, `../node_modules/${packageName}`),
    path.resolve(__dirname, `../../../node_modules/${packageName}`),
  ];
  const roots = candidates.filter((candidate) => fs.existsSync(path.join(candidate, 'package.json')));
  if (roots.length === 0) {
    throw new Error(`Security patch failed: installed ${packageName} package was not found`);
  }

  for (const root of roots) {
    const metadata = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    if (metadata.version !== certifiedVersion) {
      throw new Error(`Security patch requires ${packageName} ${certifiedVersion}; found ${metadata.version}`);
    }

    for (const { relativePath, vulnerableSource, securedSource, marker } of patches) {
      const target = path.join(root, relativePath);
      if (!fs.existsSync(target)) continue;
      const source = fs.readFileSync(target, 'utf8');
      if (source.includes(marker)) continue;
      if (!source.includes(vulnerableSource)) {
        throw new Error(`Security patch source verification failed for ${packageName}/${relativePath}`);
      }
      fs.writeFileSync(target, source.replace(vulnerableSource, securedSource), 'utf8');
    }
  }
}

// 1. image-size (GHSA-5p2g-fcmc-qvqq & GHSA-w3rx-r6r6-pgpr)
patchPackage('image-size', '1.2.1', [
  {
    relativePath: 'dist/types/utils.js',
    vulnerableSource: `    const boxSize = (0, exports.readUInt32BE)(input, offset);\n    if (input.length - offset < boxSize)\n        return;`,
    securedSource: `    const boxSize = (0, exports.readUInt32BE)(input, offset);\n    // CLAUDYGOD_SECURITY_PATCH_GHSA_5P2G: ISO BMFF boxes must include their 8-byte header.\n    if (boxSize < 8 || input.length - offset < boxSize)\n        return;`,
    marker: 'CLAUDYGOD_SECURITY_PATCH_GHSA_5P2G',
  },
  {
    relativePath: 'dist/types/icns.js',
    vulnerableSource: `        let imageHeader = readImageHeader(input, imageOffset);\n        let imageSize = getImageSize(imageHeader[0]);\n        imageOffset += imageHeader[1];`,
    securedSource: `        let imageHeader = readImageHeader(input, imageOffset);\n        // CLAUDYGOD_SECURITY_PATCH_GHSA_W3RX: reject entries that cannot advance the parser.\n        if (imageHeader[1] < SIZE_HEADER)\n            throw new TypeError('Invalid ICNS image entry length');\n        let imageSize = getImageSize(imageHeader[0]);\n        imageOffset += imageHeader[1];`,
    marker: 'CLAUDYGOD_SECURITY_PATCH_GHSA_W3RX',
  },
  {
    relativePath: 'dist/types/icns.js',
    vulnerableSource: `            imageHeader = readImageHeader(input, imageOffset);\n            imageSize = getImageSize(imageHeader[0]);\n            imageOffset += imageHeader[1];`,
    securedSource: `            imageHeader = readImageHeader(input, imageOffset);\n            if (imageHeader[1] < SIZE_HEADER)\n                throw new TypeError('Invalid ICNS image entry length');\n            imageSize = getImageSize(imageHeader[0]);\n            imageOffset += imageHeader[1];`,
    marker: "if (imageHeader[1] < SIZE_HEADER)\n                throw new TypeError('Invalid ICNS image entry length');\n            imageSize",
  },
]);

// 2. node-forge (GHSA-86w9-cpqp-85rv / CVE-2026-85393)
patchPackage('node-forge', '1.4.0', [
  {
    relativePath: 'lib/rsa.js',
    vulnerableSource: `          // validate DigestInfo structure and element count\n          var capture = {};\n          var errors = [];\n          if(!asn1.validate(obj, digestInfoValidator, capture, errors) ||\n            obj.value.length !== 2) {`,
    securedSource: `          // validate DigestInfo structure and element count\n          var capture = {};\n          var errors = [];\n          // CLAUDYGOD_SECURITY_PATCH_GHSA_86W9: validate nested DigestAlgorithm element count\n          if(!asn1.validate(obj, digestInfoValidator, capture, errors) ||\n            obj.value.length !== 2 ||\n            !obj.value[0] || !Array.isArray(obj.value[0].value) ||\n            obj.value[0].value.length !== (('parameters' in capture) ? 2 : 1)) {`,
    marker: 'CLAUDYGOD_SECURITY_PATCH_GHSA_86W9',
  },
]);

// 3. braces (GHSA-vfj7-8cjw-p6xm / CVE-2026-93687)
patchPackage('braces', '3.0.3', [
  {
    relativePath: 'lib/parse.js',
    vulnerableSource: `    if (value === CHAR_LEFT_CURLY_BRACE) {\n      depth++;`,
    securedSource: `    if (value === CHAR_LEFT_CURLY_BRACE) {\n      // CLAUDYGOD_SECURITY_PATCH_GHSA_VFJ7: enforce bounded recursion depth\n      depth++;\n      if (depth > 64) {\n        throw new SyntaxError('Braces depth limit exceeded');\n      }`,
    marker: 'CLAUDYGOD_SECURITY_PATCH_GHSA_VFJ7',
  },
  {
    relativePath: 'lib/compile.js',
    vulnerableSource: `const compile = (ast, options = {}) => {\n  const walk = (node, parent = {}) => {`,
    securedSource: `const compile = (ast, options = {}) => {\n  const walk = (node, parent = {}, depth = 0) => {\n    // CLAUDYGOD_SECURITY_PATCH_GHSA_VFJ7: enforce bounded recursion depth\n    if (depth > 64) {\n      throw new SyntaxError('Braces depth limit exceeded');\n    }`,
    marker: 'CLAUDYGOD_SECURITY_PATCH_GHSA_VFJ7',
  },
  {
    relativePath: 'lib/compile.js',
    vulnerableSource: `    if (node.nodes) {\n      for (const child of node.nodes) {\n        output += walk(child, node);\n      }\n    }`,
    securedSource: `    if (node.nodes) {\n      for (const child of node.nodes) {\n        output += walk(child, node, depth + 1);\n      }\n    }`,
    marker: 'output += walk(child, node, depth + 1);',
  },
  {
    relativePath: 'lib/expand.js',
    vulnerableSource: `  const walk = (node, parent = {}) => {\n    node.queue = [];`,
    securedSource: `  const walk = (node, parent = {}, depth = 0) => {\n    // CLAUDYGOD_SECURITY_PATCH_GHSA_VFJ7: enforce bounded recursion depth\n    if (depth > 64) {\n      throw new SyntaxError('Braces depth limit exceeded');\n    }\n    node.queue = [];`,
    marker: 'CLAUDYGOD_SECURITY_PATCH_GHSA_VFJ7',
  },
  {
    relativePath: 'lib/expand.js',
    vulnerableSource: `      if (child.nodes) {\n        walk(child, node);\n      }`,
    securedSource: `      if (child.nodes) {\n        walk(child, node, depth + 1);\n      }`,
    marker: 'walk(child, node, depth + 1);',
  },
]);

process.stdout.write('Applied verified vendor security patches (image-size, node-forge, braces).\n');
