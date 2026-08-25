/* global __dirname */
const fs = require('node:fs');
const path = require('node:path');

const candidates = [
  path.resolve(__dirname, '../node_modules/image-size'),
  path.resolve(__dirname, '../../../node_modules/image-size'),
];
const packageRoot = candidates.find((candidate) => fs.existsSync(path.join(candidate, 'package.json')));

if (!packageRoot) {
  throw new Error('Security patch failed: installed image-size package was not found');
}

const metadata = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
if (metadata.version !== '1.2.1') {
  throw new Error(`Security patch requires image-size 1.2.1; found ${metadata.version}`);
}

function patchFile(relativePath, vulnerableSource, securedSource, marker) {
  const target = path.join(packageRoot, relativePath);
  const source = fs.readFileSync(target, 'utf8');
  if (source.includes(marker)) return;
  if (!source.includes(vulnerableSource)) {
    throw new Error(`Security patch source verification failed for image-size/${relativePath}`);
  }
  fs.writeFileSync(target, source.replace(vulnerableSource, securedSource), 'utf8');
}

patchFile(
  'dist/types/utils.js',
  `    const boxSize = (0, exports.readUInt32BE)(input, offset);\n    if (input.length - offset < boxSize)\n        return;`,
  `    const boxSize = (0, exports.readUInt32BE)(input, offset);\n    // CLAUDYGOD_SECURITY_PATCH_GHSA_5P2G: ISO BMFF boxes must include their 8-byte header.\n    if (boxSize < 8 || input.length - offset < boxSize)\n        return;`,
  'CLAUDYGOD_SECURITY_PATCH_GHSA_5P2G',
);

patchFile(
  'dist/types/icns.js',
  `        let imageHeader = readImageHeader(input, imageOffset);\n        let imageSize = getImageSize(imageHeader[0]);\n        imageOffset += imageHeader[1];`,
  `        let imageHeader = readImageHeader(input, imageOffset);\n        // CLAUDYGOD_SECURITY_PATCH_GHSA_W3RX: reject entries that cannot advance the parser.\n        if (imageHeader[1] < SIZE_HEADER)\n            throw new TypeError('Invalid ICNS image entry length');\n        let imageSize = getImageSize(imageHeader[0]);\n        imageOffset += imageHeader[1];`,
  'CLAUDYGOD_SECURITY_PATCH_GHSA_W3RX',
);

patchFile(
  'dist/types/icns.js',
  `            imageHeader = readImageHeader(input, imageOffset);\n            imageSize = getImageSize(imageHeader[0]);\n            imageOffset += imageHeader[1];`,
  `            imageHeader = readImageHeader(input, imageOffset);\n            if (imageHeader[1] < SIZE_HEADER)\n                throw new TypeError('Invalid ICNS image entry length');\n            imageSize = getImageSize(imageHeader[0]);\n            imageOffset += imageHeader[1];`,
  "if (imageHeader[1] < SIZE_HEADER)\n                throw new TypeError('Invalid ICNS image entry length');\n            imageSize",
);

process.stdout.write('Applied verified image-size denial-of-service security patches.\n');
