import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MessageOutboxProjectorRunner } from '../../src/mongo/message-outbox.projector.runner.js';
import { MessageOutboxProjector } from '../../src/mongo/message-outbox.projector.js';
import {
  MESSAGES_READ_MODEL_STORE,
  MongoMessagesReadModelStore,
  NoopMessagesReadModelStore,
  type MessagesReadModelStore,
} from '../../src/mongo/messages-read-model.store.js';
import type { Env } from '../../src/config/env.schema.js';

class DummyMongoStore extends MongoMessagesReadModelStore {
  constructor() {
    // @ts-expect-error - we do not need a real MongoDB collection in tests.
    super({});
  }
}

describe('MessageOutboxProjectorRunner', () => {
  let runner: MessageOutboxProjectorRunner;
  let projector: { processBatch: jest.Mock } & Partial<MessageOutboxProjector>;
  let configService: ConfigService<Env, true>;
  let store: MessagesReadModelStore;

  beforeEach(async () => {
    jest.useFakeTimers();

    projector = {
      processBatch: jest.fn().mockResolvedValue({ processed: 0, failed: 0 }),
    } as any;

    const moduleRef = await Test.createTestingModule({
      providers: [
        MessageOutboxProjectorRunner,
        {
          provide: MessageOutboxProjector,
          useValue: projector,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: keyof Env) => {
              switch (key) {
                case 'USE_MONGO_READ_MODEL':
                  return true;
                case 'MONGO_PROJECTOR_ENABLED':
                  return true;
                case 'MONGO_PROJECTOR_INTERVAL_MS':
                  return 1000;
                case 'MONGO_PROJECTOR_BATCH_SIZE':
                  return 100;
                default:
                  return undefined;
              }
            }),
          } as Partial<ConfigService<Env, true>>,
        },
        {
          provide: MESSAGES_READ_MODEL_STORE,
          useFactory: () => {
            store = new DummyMongoStore();
            return store;
          },
        },
      ],
    }).compile();

    runner = moduleRef.get(MessageOutboxProjectorRunner);
    configService = moduleRef.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('does not start when USE_MONGO_READ_MODEL=false', async () => {
    (configService.get as jest.Mock).mockImplementation((key: keyof Env) => {
      if (key === 'USE_MONGO_READ_MODEL') return false;
      if (key === 'MONGO_PROJECTOR_ENABLED') return true;
      return undefined as any;
    });

    await runner.onModuleInit();

    await jest.runOnlyPendingTimersAsync();

    expect(projector.processBatch).not.toHaveBeenCalled();
  });

  it('does not start when MONGO_PROJECTOR_ENABLED=false', async () => {
    (configService.get as jest.Mock).mockImplementation((key: keyof Env) => {
      if (key === 'USE_MONGO_READ_MODEL') return true;
      if (key === 'MONGO_PROJECTOR_ENABLED') return false;
      return undefined as any;
    });

    await runner.onModuleInit();
    await jest.runOnlyPendingTimersAsync();

    expect(projector.processBatch).not.toHaveBeenCalled();
  });

  it('does not start when store is NoopMessagesReadModelStore', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        MessageOutboxProjectorRunner,
        {
          provide: MessageOutboxProjector,
          useValue: projector,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: keyof Env) => {
              switch (key) {
                case 'USE_MONGO_READ_MODEL':
                  return true;
                case 'MONGO_PROJECTOR_ENABLED':
                  return true;
                case 'MONGO_PROJECTOR_INTERVAL_MS':
                  return 1000;
                case 'MONGO_PROJECTOR_BATCH_SIZE':
                  return 100;
                default:
                  return undefined;
              }
            }),
          } as Partial<ConfigService<Env, true>>,
        },
        {
          provide: MESSAGES_READ_MODEL_STORE,
          useValue: new NoopMessagesReadModelStore(),
        },
      ],
    }).compile();

    const localRunner = moduleRef.get(MessageOutboxProjectorRunner);

    await localRunner.onModuleInit();
    await jest.runOnlyPendingTimersAsync();

    expect(projector.processBatch).not.toHaveBeenCalled();
  });

  it('calls processBatch with configured batch size when enabled and Mongo store is active', async () => {
    await runner.onModuleInit();

    await runner.runOnce();

    expect(projector.processBatch).toHaveBeenCalledWith(100);
  });

  it('guards against overlapping runs when processBatch is still in progress', async () => {
    let resolveFirst: () => void;
    const firstCallPromise = new Promise<{ processed: number; failed: number }>((resolve) => {
      resolveFirst = () => resolve({ processed: 1, failed: 0 });
    });

    projector.processBatch.mockReturnValue(firstCallPromise as any);

    await runner.onModuleInit();

    // First tick: starts the long-running call.
    const tick1 = runner.runOnce();

    // Second tick while first is still running should be skipped by isRunning guard.
    const tick2 = runner.runOnce();

    expect(projector.processBatch).toHaveBeenCalledTimes(1);

    resolveFirst!();
    await tick1;
    await tick2;
  });
});
