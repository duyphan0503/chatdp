import { ServiceUnavailableException } from '@nestjs/common';
import { MediaQuotaService, MediaStorage } from '../../src/media/media.service.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';

describe('MediaQuotaService', () => {
  let prisma: jest.Mocked<Partial<PrismaService>>;
  let config: { get: jest.Mock };
  let storage: jest.Mocked<MediaStorage>;
  let service: MediaQuotaService;

  beforeEach(() => {
    prisma = {
      media: {
        aggregate: jest.fn(),
        findMany: jest.fn(),
        delete: jest.fn(),
      },
    } as any;

    storage = {
      createPresignedUpload: jest.fn(),
      deleteObject: jest.fn().mockResolvedValue(undefined),
    } as any;

    config = {
      get: jest.fn((key: string) => {
        if (key === 'MEDIA_R2_SOFT_LIMIT_BYTES') return 500;
        if (key === 'MEDIA_R2_HARD_LIMIT_BYTES') return 1000;
        return undefined;
      }),
    };

    service = new MediaQuotaService(prisma as PrismaService, config as any, storage as any);
  });

  it('does nothing when projected size is under soft limit', async () => {
    // current total = 100, estimated = 100 -> projected = 200 <= soft(500)
    (prisma.media!.aggregate as jest.Mock).mockResolvedValue({ _sum: { size: 100 } });

    await service.enforceQuotaForUpload(100);

    expect(prisma.media!.findMany).not.toHaveBeenCalled();
    expect(prisma.media!.delete).not.toHaveBeenCalled();
    expect(storage.deleteObject).not.toHaveBeenCalled();
  });

  it('evicts media until under soft limit and respects hard limit', async () => {
    // Config is soft=500, hard=1000 from beforeEach
    // Call sequence for aggregate:
    // 1) before soft check -> 700
    // 2) inside evictUntilUnder -> 700
    // 3) after eviction -> 200
    (prisma.media!.aggregate as jest.Mock)
      .mockResolvedValueOnce({ _sum: { size: 700 } })
      .mockResolvedValueOnce({ _sum: { size: 700 } })
      .mockResolvedValueOnce({ _sum: { size: 200 } });

    const candidates = [
      {
        id: 'm1',
        size: 300,
        url: 'https://example.com/u1',
        objectKey: 'uploads/u1/file1',
      },
      {
        id: 'm2',
        size: 200,
        url: 'https://example.com/u2',
        objectKey: 'uploads/u2/file2',
      },
    ];

    (prisma.media!.findMany as jest.Mock).mockResolvedValue(candidates);

    await service.enforceQuotaForUpload(100);

    // Should have tried to delete at least the first candidate
    expect(storage.deleteObject).toHaveBeenCalledWith({
      url: candidates[0].url,
      objectKey: candidates[0].objectKey,
    });

    expect(prisma.media!.delete).toHaveBeenCalledWith({ where: { id: candidates[0].id } });
  });

  it('throws when after eviction projected size exceeds hard limit', async () => {
    // Override config for this test: tight hard limit
    config.get.mockImplementation((key: string) => {
      if (key === 'MEDIA_R2_SOFT_LIMIT_BYTES') return 500;
      if (key === 'MEDIA_R2_HARD_LIMIT_BYTES') return 600;
      return undefined;
    });

    // Recreate service with new config behavior
    service = new MediaQuotaService(prisma as PrismaService, config as any, storage as any);

    // Call sequence for aggregate:
    // 1) before soft check -> 500
    // 2) inside evictUntilUnder -> 500 (no candidates to evict)
    // 3) after eviction -> 500
    (prisma.media!.aggregate as jest.Mock)
      .mockResolvedValueOnce({ _sum: { size: 500 } })
      .mockResolvedValueOnce({ _sum: { size: 500 } })
      .mockResolvedValueOnce({ _sum: { size: 500 } });

    (prisma.media!.findMany as jest.Mock).mockResolvedValue([]);

    await expect(service.enforceQuotaForUpload(400)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
