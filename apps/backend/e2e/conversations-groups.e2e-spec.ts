import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap.js';

function randEmail() {
  return `user_${Math.random().toString(36).slice(2)}@test.io`;
}

async function signup(app: INestApplication, email: string) {
  const password = 'secretpw';
  const res = await request(app.getHttpServer())
    .post('/api/auth/signup')
    .send({ email, password, displayName: 'Tester' })
    .expect(201);
  return {
    accessToken: res.body.accessToken as string,
    userId: res.body.user.id as string,
  };
}

describe('Group Conversations (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('allows admin to add, promote, demote and remove members', async () => {
    const owner = await signup(app, randEmail());
    const member = await signup(app, randEmail());

    // Create group conversation as owner
    const convCreate = await request(app.getHttpServer())
      .post('/api/conversations')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ type: 'group', groupName: 'My Group' })
      .expect(201);

    const conversationId = convCreate.body.id as string;

    // Add member
    const afterAdd = await request(app.getHttpServer())
      .post(`/api/conversations/${conversationId}/members`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ userId: member.userId })
      .expect(201);

    expect(afterAdd.body.id).toBe(conversationId);

    // Promote member to admin
    const afterPromote = await request(app.getHttpServer())
      .post(`/api/conversations/${conversationId}/members/${member.userId}/promote`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(201);

    expect(afterPromote.body.id).toBe(conversationId);

    // Demote member back to member
    const afterDemote = await request(app.getHttpServer())
      .post(`/api/conversations/${conversationId}/members/${member.userId}/demote`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(201);

    expect(afterDemote.body.id).toBe(conversationId);

    // Remove member
    const afterRemove = await request(app.getHttpServer())
      .delete(`/api/conversations/${conversationId}/members/${member.userId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    expect(afterRemove.body.id).toBe(conversationId);
  });

  it('prevents non-admin and last-admin dangerous operations', async () => {
    const owner = await signup(app, randEmail());
    const member = await signup(app, randEmail());
    const other = await signup(app, randEmail());

    // Owner creates group
    const convCreate = await request(app.getHttpServer())
      .post('/api/conversations')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ type: 'group', groupName: 'Secure Group' })
      .expect(201);

    const conversationId = convCreate.body.id as string;

    // Owner adds member
    await request(app.getHttpServer())
      .post(`/api/conversations/${conversationId}/members`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ userId: member.userId })
      .expect(201);

    // Non-admin member cannot add another member
    await request(app.getHttpServer())
      .post(`/api/conversations/${conversationId}/members`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({ userId: other.userId })
      .expect(403);

    // Non-admin member cannot promote someone
    await request(app.getHttpServer())
      .post(`/api/conversations/${conversationId}/members/${owner.userId}/promote`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .expect(403);

    // Last admin cannot remove themselves
    await request(app.getHttpServer())
      .delete(`/api/conversations/${conversationId}/members/${owner.userId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(400);

    // Last admin cannot demote themselves
    await request(app.getHttpServer())
      .post(`/api/conversations/${conversationId}/members/${owner.userId}/demote`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(400);
  });
});
