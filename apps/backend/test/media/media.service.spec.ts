import { ForbiddenException } from '@nestjs/common';
import { MediaService, MediaStorage } from '../../src/media/media.service.js';

class StubMediaStorage implements MediaStorage {
  async createPresignedUpload(): Promise<any> {
    return {
      uploadUrl: 'https://stub-upload',
      downloadUrl: 'https://stub-download',
      expiresIn: 123,
    };
  }
}

describe('MediaService', () => {
  it('delegates to MediaStorage and enforces quota', async () => {
    const storage = new StubMediaStorage();
    const quota = { enforceQuotaForUpload: jest.fn().mockResolvedValue(undefined) } as any;
    const prisma = {} as any;

    const service = new MediaService(storage as any, quota, prisma);
    const result = await service.presignUpload({
      fileName: 'file.txt',
      mimeType: 'text/plain',
      uploaderId: 'user-1',
    });

    expect(quota.enforceQuotaForUpload).toHaveBeenCalledWith(0);
    expect(result.uploadUrl).toBe('https://stub-upload');
    expect(result.downloadUrl).toBe('https://stub-download');
    expect(result.expiresIn).toBe(123);
  });

  it('markAccessed updates lastAccessAt for uploader', async () => {
    const storage = new StubMediaStorage();
    const quota = { enforceQuotaForUpload: jest.fn().mockResolvedValue(undefined) } as any;
    const prisma = {
      media: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'm1',
          uploaderId: 'u1',
          conversation: null,
          storageProvider: 'none',
        }),
        update: jest.fn().mockResolvedValue({}),
      },
    } as any;

    const service = new MediaService(storage as any, quota, prisma);
    await service.markAccessed('m1', 'u1');

    expect(prisma.media.findUnique).toHaveBeenCalledWith({
      where: { id: 'm1' },
      include: { conversation: { include: { participants: true } } },
    });
    expect(prisma.media.update).toHaveBeenCalledWith({
      where: { id: 'm1' },
      data: { lastAccessAt: expect.any(Date) },
    });
  });

  it('markAccessed updates lastAccessAt for conversation participant', async () => {
    const storage = new StubMediaStorage();
    const quota = { enforceQuotaForUpload: jest.fn().mockResolvedValue(undefined) } as any;
    const prisma = {
      media: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'm2',
          uploaderId: 'other',
          conversation: {
            participants: [{ userId: 'u2' }],
          },
          storageProvider: 'none',
        }),
        update: jest.fn().mockResolvedValue({}),
      },
    } as any;

    const service = new MediaService(storage as any, quota, prisma);
    await service.markAccessed('m2', 'u2');

    expect(prisma.media.update).toHaveBeenCalledWith({
      where: { id: 'm2' },
      data: { lastAccessAt: expect.any(Date) },
    });
  });

  it('markAccessed throws ForbiddenException for unauthorized user', async () => {
    const storage = new StubMediaStorage();
    const quota = { enforceQuotaForUpload: jest.fn().mockResolvedValue(undefined) } as any;
    const prisma = {
      media: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'm3',
          uploaderId: 'u1',
          conversation: {
            participants: [{ userId: 'u1' }],
          },
          storageProvider: 'r2',
          url: 'https://example.com/uploads/u1/file.png',
          objectKey: 'uploads/u1/file.png',
        }),
        update: jest.fn().mockResolvedValue({}),
      },
    } as any;

    const service = new MediaService(storage as any, quota, prisma);

    await expect(service.markAccessed('m3', 'intruder')).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.media.update).not.toHaveBeenCalled();
  });

  it('markAccessed deletes R2 object and updates metadata for cloud-backed media', async () => {
    const storage: MediaStorage = {
      createPresignedUpload: async () => ({
        uploadUrl: 'https://stub-upload',
        downloadUrl: 'https://stub-download',
        expiresIn: 123,
      }),
      deleteObject: jest.fn().mockResolvedValue(undefined),
    };

    const quota = { enforceQuotaForUpload: jest.fn().mockResolvedValue(undefined) } as any;
    const prisma = {
      media: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'm4',
          uploaderId: 'u1',
          url: 'https://example.com/uploads/u1/file.png',
          objectKey: 'uploads/u1/file.png',
          storageProvider: 'r2',
          size: 1024,
          conversation: {
            participants: [{ userId: 'u1' }],
          },
        }),
        update: jest.fn().mockResolvedValue({}),
      },
    } as any;

    const service = new MediaService(storage as any, quota, prisma);
    await service.markAccessed('m4', 'u1');

    expect(storage.deleteObject as jest.Mock).toHaveBeenCalledWith({
      url: 'https://example.com/uploads/u1/file.png',
      objectKey: 'uploads/u1/file.png',
    });

    expect(prisma.media.update).toHaveBeenCalledWith({
      where: { id: 'm4' },
      data: {
        lastAccessAt: expect.any(Date),
        status: 'cloud_deleted',
        storageProvider: 'none',
        size: 0,
      },
    });
  });
});
