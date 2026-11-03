import { beforeEach, describe, expect, it, vi } from 'vitest';

const renderSiteImage = vi.fn();
const renderTeaImage = vi.fn();
const renderProfileImage = vi.fn();

vi.mock('@/features/share', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/share')>()),
  renderSiteImage: (...a: unknown[]) => renderSiteImage(...a),
  renderTeaImage: (...a: unknown[]) => renderTeaImage(...a),
  renderProfileImage: (...a: unknown[]) => renderProfileImage(...a),
}));

import TeaImage, * as teaFile from './(public)/products/[id]/opengraph-image';
import ProfileImage, * as profileFile from './(public)/u/[id]/opengraph-image';
import SiteImage, * as siteFile from './opengraph-image';

beforeEach(() => vi.clearAllMocks());

describe('opengraph-image routes', () => {
  it('declare a 1200×630 PNG with alt text', () => {
    for (const file of [siteFile, teaFile, profileFile]) {
      expect(file.size).toEqual({ width: 1200, height: 630 });
      expect(file.contentType).toBe('image/png');
      expect(file.alt).toBeTruthy();
    }
  });

  it('site image renders the site card', () => {
    renderSiteImage.mockReturnValue('site');
    expect(SiteImage()).toBe('site');
  });

  it('tea image renders the tea from its route param', async () => {
    renderTeaImage.mockResolvedValue('tea');
    expect(await TeaImage({ params: Promise.resolve({ id: 't1' }) })).toBe('tea');
    expect(renderTeaImage).toHaveBeenCalledWith('t1');
  });

  it('profile image renders the profile from its route param', async () => {
    renderProfileImage.mockResolvedValue('profile');
    expect(await ProfileImage({ params: Promise.resolve({ id: 'p1' }) })).toBe('profile');
    expect(renderProfileImage).toHaveBeenCalledWith('p1');
  });
});
