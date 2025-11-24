import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

function randEmail() {
  return `user_${Math.random().toString(36).slice(2)}@media.test`;
}

async function signup(app: INestApplication, email: string) {
  const password = 'StrongPassw0rd!';
  const res = await request(app.getHttpServer())
    .post('/api/auth/signup')
    .send({ email, password, displayName: 'MediaUser' })
    .expect(201);
  return {
    accessToken: res.body.accessToken as string,
    userId: res.body.user.id as string,
  };
}

describe('Media upload flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = moduleRef.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('issues presigned URL and allows sending media message', async () => {
    // Sign up two users
    const u1 = await signup(app, randEmail());
    const u2 = await signup(app, randEmail());

    // Create private conversation between u1 and u2
    const convRes = await request(app.getHttpServer())
      .post('/api/conversations')
      .set('Authorization', `Bearer ${u1.accessToken}`)
      .send({ type: 'private', participantUserIds: [u2.userId] })
      .expect(201);

    const conversationId = convRes.body.id as string;

    // Request presigned upload URL as u1
    const presignRes = await request(app.getHttpServer())
      .post('/api/media/presign')
      .set('Authorization', `Bearer ${u1.accessToken}`)
      .query({
        fileName: 'photo.png',
        mime: 'image/png',
        contentLength: 1234,
      })
      .expect(201);

    expect(typeof presignRes.body.uploadUrl).toBe('string');
    // downloadUrl may be undefined for some drivers, but Local/S3 will set it
    if (presignRes.body.downloadUrl) {
      expect(typeof presignRes.body.downloadUrl).toBe('string');
    }
    expect(typeof presignRes.body.expiresIn).toBe('number');

    const mediaUrl = presignRes.body.downloadUrl as string | undefined;

    // Create a media message in that conversation (image)
    const msgPayload: any = {
      contentType: 'image',
    };
    if (mediaUrl) {
      msgPayload.mediaUrl = mediaUrl;
    }

    const msgRes = await request(app.getHttpServer())
      .post(`/api/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${u1.accessToken}`)
      .send(msgPayload)
      .expect(201);

    expect(msgRes.body.contentType).toBe('image');
    if (mediaUrl) {
      expect(msgRes.body.mediaUrl).toBe(mediaUrl);
    }

    const messageId = msgRes.body.id as string;
    expect(typeof messageId).toBe('string');

    // List messages as u2 and ensure the media message is visible
    const listRes = await request(app.getHttpServer())
      .get(`/api/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${u2.accessToken}`)
      .expect(200);

    expect(Array.isArray(listRes.body.items)).toBe(true);
    const first = listRes.body.items[0];
    expect(first.id).toBe(messageId);
    expect(first.contentType).toBe('image');
    if (mediaUrl) {
      expect(first.mediaUrl).toBe(mediaUrl);
    }
  });

  it('returns 403 when non-participant tries to mark media as accessed', async () => {
    // Sign up three users
    const u1 = await signup(app, randEmail());
    const u2 = await signup(app, randEmail());
    const intruder = await signup(app, randEmail());

    // Create private conversation between u1 and u2
    const convRes = await request(app.getHttpServer())
      .post('/api/conversations')
      .set('Authorization', `Bearer ${u1.accessToken}`)
      .send({ type: 'private', participantUserIds: [u2.userId] })
      .expect(201);

    const conversationId = convRes.body.id as string;

    // Request presigned upload URL as u1
    const presignRes = await request(app.getHttpServer())
      .post('/api/media/presign')
      .set('Authorization', `Bearer ${u1.accessToken}`)
      .query({
        fileName: 'photo.png',
        mime: 'image/png',
        contentLength: 1234,
      })
      .expect(201);

    const mediaUrl = presignRes.body.downloadUrl as string | undefined;

    // Create a media message in that conversation (image)
    const msgPayload: any = {
      contentType: 'image',
    };
    if (mediaUrl) {
      msgPayload.mediaUrl = mediaUrl;
    }

    const msgRes = await request(app.getHttpServer())
      .post(`/api/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${u1.accessToken}`)
      .send(msgPayload)
      .expect(201);

    const messageId = msgRes.body.id as string;

    // Look up Media row linked to this message
    const media = await prisma.media.findFirstOrThrow({
      where: { messageId },
    });

    // Intruder (not in conversation) tries to mark media as accessed
    await request(app.getHttpServer())
      .post(`/api/media/${media.id}/accessed`)
      .set('Authorization', `Bearer ${intruder.accessToken}`)
      .expect(403);
  });

  it('allows uploader to mark media as accessed and updates lastAccessAt', async () => {
    const u1 = await signup(app, randEmail());
    const u2 = await signup(app, randEmail());

    // Create private conversation between u1 and u2
    const convRes = await request(app.getHttpServer())
      .post('/api/conversations')
      .set('Authorization', `Bearer ${u1.accessToken}`)
      .send({ type: 'private', participantUserIds: [u2.userId] })
      .expect(201);

    const conversationId = convRes.body.id as string;

    // Presign + create media message as u1
    const presignRes = await request(app.getHttpServer())
      .post('/api/media/presign')
      .set('Authorization', `Bearer ${u1.accessToken}`)
      .query({ fileName: 'photo.png', mime: 'image/png', contentLength: 1234 })
      .expect(201);

    const mediaUrl = presignRes.body.downloadUrl as string | undefined;

    const msgPayload: any = { contentType: 'image' };
    if (mediaUrl) {
      msgPayload.mediaUrl = mediaUrl;
    }

    const msgRes = await request(app.getHttpServer())
      .post(`/api/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${u1.accessToken}`)
      .send(msgPayload)
      .expect(201);

    const messageId = msgRes.body.id as string;

    const media = await prisma.media.findFirstOrThrow({ where: { messageId } });
    expect(media.lastAccessAt).toBeNull();

    await request(app.getHttpServer())
      .post(`/api/media/${media.id}/accessed`)
      .set('Authorization', `Bearer ${u1.accessToken}`)
      .expect(200);

    const updated = await prisma.media.findFirstOrThrow({ where: { id: media.id } });
    expect(updated.lastAccessAt).not.toBeNull();
  });

  it('allows conversation participant to mark media as accessed and updates lastAccessAt', async () => {
    const u1 = await signup(app, randEmail());
    const u2 = await signup(app, randEmail());

    // Create private conversation between u1 and u2
    const convRes = await request(app.getHttpServer())
      .post('/api/conversations')
      .set('Authorization', `Bearer ${u1.accessToken}`)
      .send({ type: 'private', participantUserIds: [u2.userId] })
      .expect(201);

    const conversationId = convRes.body.id as string;

    // Presign + create media message as u1
    const presignRes = await request(app.getHttpServer())
      .post('/api/media/presign')
      .set('Authorization', `Bearer ${u1.accessToken}`)
      .query({ fileName: 'photo.png', mime: 'image/png', contentLength: 1234 })
      .expect(201);

    const mediaUrl = presignRes.body.downloadUrl as string | undefined;

    const msgPayload: any = { contentType: 'image' };
    if (mediaUrl) {
      msgPayload.mediaUrl = mediaUrl;
    }

    const msgRes = await request(app.getHttpServer())
      .post(`/api/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${u1.accessToken}`)
      .send(msgPayload)
      .expect(201);

    const messageId = msgRes.body.id as string;

    const media = await prisma.media.findFirstOrThrow({ where: { messageId } });
    expect(media.lastAccessAt).toBeNull();

    await request(app.getHttpServer())
      .post(`/api/media/${media.id}/accessed`)
      .set('Authorization', `Bearer ${u2.accessToken}`)
      .expect(200);

    const updated = await prisma.media.findFirstOrThrow({ where: { id: media.id } });
    expect(updated.lastAccessAt).not.toBeNull();
  });
});
