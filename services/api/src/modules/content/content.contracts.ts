import { BadRequestError } from '../../lib/errors';
import type { ContentType } from './content.types';

export type SectionContract = {
  id: string;
  title: string;
  contentTypes: Array<ContentType | 'live'>;
};

export function validateSectionAssignments(params: {
  assignedSectionIds: string[];
  contentType: ContentType;
  configuredSections: SectionContract[];
  publishing: boolean;
}): string[] {
  const normalized = [...new Set(params.assignedSectionIds.map((value) => value.trim()).filter(Boolean))];
  if (params.publishing && normalized.length === 0) {
    throw new BadRequestError(
      'Published content must include at least one configured app section',
      'CONTENT_PUBLISH_MISSING_APP_SECTIONS',
      'appSections',
    );
  }

  const sectionsById = new Map(params.configuredSections.map((section) => [section.id, section]));
  for (const sectionId of normalized) {
    const section = sectionsById.get(sectionId);
    if (!section) {
      throw new BadRequestError(
        `App section "${sectionId}" does not exist`,
        'CONTENT_SECTION_NOT_FOUND',
        'appSections',
      );
    }
    if (!section.contentTypes.includes(params.contentType)) {
      throw new BadRequestError(
        `App section "${section.title}" does not accept ${params.contentType} content`,
        'CONTENT_SECTION_TYPE_MISMATCH',
        'appSections',
      );
    }
  }

  return normalized;
}

export function assertConfirmedUploadSession(status: string, attachedAt?: string | Date | null, trustStatus?: string): void {
  if (status !== 'uploaded') {
    throw new BadRequestError(
      'Referenced upload session has not been confirmed as uploaded',
      'UPLOAD_SESSION_NOT_CONFIRMED',
    );
  }
  if (trustStatus !== 'clean') {
    throw new BadRequestError(
      trustStatus === 'quarantined'
        ? 'The uploaded file was quarantined and cannot be attached'
        : 'The uploaded file has not completed security scanning',
      trustStatus === 'quarantined' ? 'UPLOAD_QUARANTINED' : 'UPLOAD_SECURITY_SCAN_PENDING',
    );
  }
  if (attachedAt) {
    throw new BadRequestError(
      'Upload session is already attached or is no longer available',
      'UPLOAD_SESSION_NOT_ATTACHABLE',
    );
  }
}
