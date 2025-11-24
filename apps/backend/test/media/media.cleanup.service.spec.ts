import { MediaCleanupService } from '../../src/media/media.cleanup.service.js';
import { MediaStorage } from '../../src/media/media.service.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';

describe('MediaCleanupService', () => {
  let prisma: jest.Mocked<Partial<PrismaService>>;
  let storage: jest.Mocked<MediaStorage>;
  let service: MediaCleanupService;

  beforeEach(() => {
    prisma = {
      media: {
        findMany: jest.fn(),
        delete: jest.fn(),
      },
    } as any;

    storage = {
      createPresignedUpload: jest.fn(),
      deleteObject: jest.fn().mockResolvedValue(undefined),
    } as any;

    service = new MediaCleanupService(prisma as PrismaService, storage as any);
  });

  it('does nothing when there are no expired media', async () => {
    (prisma.media!.findMany as jest.Mock).mockResolvedValue([]);

    const result = await service.cleanupExpiredMediaBatch(new Date(), 50);

    expect(result).toEqual({ deletedCount: 0 });
    expect(prisma.media!.delete).not.toHaveBeenCalled();
    expect(storage.deleteObject).not.toHaveBeenCalled();
  });

  it('deletes expired R2 media from storage and DB', async () => {
    const expired = [
      {
        id: 'm1',
        url: 'https://example.com/uploads/u1/file1',
        objectKey: 'uploads/u1/file1',
        storageProvider: 'r2',
        expiresAt: new Date(Date.now() - 1000),
      },
      {
        id: 'm2',
        url: 'https://example.com/uploads/u2/file2',
        objectKey: 'uploads/u2/file2',
        storageProvider: 'none',
        expiresAt: new Date(Date.now() - 2000),
      },
    ];

    (prisma.media!.findMany as jest.Mock).mockResolvedValue(expired);

    const result = await service.cleanupExpiredMediaBatch(new Date(), 100);

    expect(result).toEqual({ deletedCount: 2 });

    // Only R2-backed media should trigger deleteObject
    expect(storage.deleteObject).toHaveBeenCalledTimes(1);
    expect(storage.deleteObject).toHaveBeenCalledWith({
      url: expired[0].url,
      objectKey: expired[0].objectKey,
    });

    // Both media rows should be deleted from DB
    expect(prisma.media!.delete).toHaveBeenCalledTimes(2);
    expect(prisma.media!.delete).toHaveBeenCalledWith({ where: { id: 'm1' } });
    expect(prisma.media!.delete).toHaveBeenCalledWith({ where: { id: 'm2' } });
  });
});
