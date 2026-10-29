import { BadRequestError } from '../../lib/errors';
import type { ContentType } from './content.types';

export type SectionContract = {
  id: string;
  title: string;
  contentTypes: Array<ContentType | 'live'>;
};

export const SYSTEM_SECTIONS: Record<string, SectionContract> = {
  'home-featured': {
    id: 'home-featured',
    title: 'Featured / For You',
    contentTypes: ['audio', 'video', 'live', 'playlist', 'announcement'],
  },
  'music-featured': {
    id: 'music-featured',
    title: 'Featured Worship & Praise',
    contentTypes: ['audio', 'video', 'playlist'],
  },
  'video-featured': {
    id: 'video-featured',
    title: 'Featured Videos & Messages',
    contentTypes: ['video', 'live'],
  },
  'latest-releases': {
    id: 'latest-releases',
    title: 'Latest Releases & Premieres',
    contentTypes: ['audio', 'video', 'playlist'],
  },
  'library-saved': {
    id: 'library-saved',
    title: 'Library',
    contentTypes: ['audio', 'video', 'playlist', 'live'],
  },
};

const LEGACY_SECTION_ALIASES: Record<string, string> = {
  'claudygod-music': 'music-featured',
  'claudygod-messages': 'video-featured',
  'claudygod-nuggets-of-truth': 'video-featured',
  music: 'music-featured',
  videos: 'video-featured',
  home: 'home-featured',
};

export function validateSectionAssignments(params: {
  assignedSectionIds: string[];
  contentType: ContentType;
  configuredSections: SectionContract[];
  publishing: boolean;
}): string[] {
  const sectionsById = new Map<string, SectionContract>();

  // Seed with system default sections
  for (const [id, sysSection] of Object.entries(SYSTEM_SECTIONS)) {
    sectionsById.set(id, { ...sysSection, contentTypes: [...sysSection.contentTypes] });
  }

  // Merge explicitly configured sections from mobile config
  for (const section of params.configuredSections) {
    const existing = sectionsById.get(section.id);
    if (existing) {
      sectionsById.set(section.id, {
        id: section.id,
        title: section.title || existing.title,
        contentTypes: [...new Set([...existing.contentTypes, ...section.contentTypes])],
      });
    } else {
      sectionsById.set(section.id, {
        id: section.id,
        title: section.title,
        contentTypes: [...section.contentTypes],
      });
    }
  }

  // Ensure music-featured always accepts video (worship ministrations & music videos)
  const musicSection = sectionsById.get('music-featured');
  if (musicSection && !musicSection.contentTypes.includes('video')) {
    musicSection.contentTypes.push('video');
  }

  const normalized = [
    ...new Set(
      params.assignedSectionIds
        .map((value) => {
          const trimmed = value.trim();
          if (sectionsById.has(trimmed)) {
            return trimmed;
          }
          if (LEGACY_SECTION_ALIASES[trimmed] && sectionsById.has(LEGACY_SECTION_ALIASES[trimmed])) {
            return LEGACY_SECTION_ALIASES[trimmed];
          }
          return trimmed;
        })
        .filter(Boolean),
    ),
  ];
  if (params.publishing && normalized.length === 0) {
    throw new BadRequestError(
      'Published content must include at least one configured app section',
      'CONTENT_PUBLISH_MISSING_APP_SECTIONS',
      'appSections',
    );
  }

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
