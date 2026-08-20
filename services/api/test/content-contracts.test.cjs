const test = require('node:test');
const assert = require('node:assert/strict');

const {
  assertConfirmedUploadSession,
  validateSectionAssignments,
} = require('../dist/modules/content/content.contracts.js');

const sections = [
  { id: 'music', title: 'Music', contentTypes: ['audio', 'playlist'] },
  { id: 'videos', title: 'Videos', contentTypes: ['video'] },
];

test('accepts only configured compatible section ids', () => {
  assert.deepEqual(validateSectionAssignments({
    assignedSectionIds: ['music', 'music'],
    contentType: 'audio',
    configuredSections: sections,
    publishing: true,
  }), ['music']);
});

test('rejects unconfigured, title-based, and incompatible assignments', () => {
  for (const assignedSectionIds of [['Music'], ['removed-section'], ['videos']]) {
    assert.throws(() => validateSectionAssignments({
      assignedSectionIds,
      contentType: 'audio',
      configuredSections: sections,
      publishing: true,
    }));
  }
});

test('published content requires a section while drafts may remain unassigned', () => {
  assert.deepEqual(validateSectionAssignments({
    assignedSectionIds: [], contentType: 'audio', configuredSections: sections, publishing: false,
  }), []);
  assert.throws(() => validateSectionAssignments({
    assignedSectionIds: [], contentType: 'audio', configuredSections: sections, publishing: true,
  }));
});

test('only security-cleared, confirmed, unattached upload sessions are attachable', () => {
  assert.doesNotThrow(() => assertConfirmedUploadSession('uploaded', null, 'clean'));
  assert.throws(() => assertConfirmedUploadSession('issued', null, 'clean'));
  assert.throws(() => assertConfirmedUploadSession('uploaded', new Date(), 'clean'));
  assert.throws(() => assertConfirmedUploadSession('uploaded', null, 'pending'));
  assert.throws(() => assertConfirmedUploadSession('uploaded', null, 'quarantined'));
});
