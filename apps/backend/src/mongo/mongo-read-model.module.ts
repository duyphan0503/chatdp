import { Module, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongoClient } from 'mongodb';
import type { Env } from '../config/env.schema.js';
import {
  MESSAGES_READ_MODEL_STORE,
  MongoMessagesReadModelStore,
  NoopMessagesReadModelStore,
  type MessagesReadModelStore,
  type MessagesReadModelDocument,
} from './messages-read-model.store.js';
import { MessageOutboxProjector } from './message-outbox.projector.js';
import { MessageOutboxProjectorRunner } from './message-outbox.projector.runner.js';

@Module({
  providers: [
    {
      provide: MESSAGES_READ_MODEL_STORE,
      inject: [ConfigService],
      useFactory: async (config: ConfigService<Env, true>): Promise<MessagesReadModelStore> => {
        const logger = new Logger('MongoReadModel');

        const useMongo = config.get('USE_MONGO_READ_MODEL', { infer: true });
        if (!useMongo) {
          logger.log('USE_MONGO_READ_MODEL=false; Mongo read model disabled (no-op store).');
          return new NoopMessagesReadModelStore();
        }

        const uri = config.get('MONGODB_URI', { infer: true });
        const dbName = config.get('MONGODB_DBNAME', { infer: true });

        if (!uri || !dbName) {
          logger.warn(
            'Mongo read model disabled: MONGODB_URI or MONGODB_DBNAME is not configured. Using no-op store.',
          );
          return new NoopMessagesReadModelStore();
        }

        try {
          const client = new MongoClient(uri);
          await client.connect();

          const db = client.db(dbName);
          const collection = db.collection<MessagesReadModelDocument>('messages_read_model');

          await MongoMessagesReadModelStore.ensureIndexes(collection);

          logger.log(
            `Mongo read model connected to db="${dbName}", collection="messages_read_model"`,
          );

          return new MongoMessagesReadModelStore(collection);
        } catch (err) {
          logger.error(
            `Failed to initialize Mongo read model. Falling back to no-op store. Error=${String(
              err,
            )}`,
          );

          return new NoopMessagesReadModelStore();
        }
      },
    },
    MessageOutboxProjector,
    MessageOutboxProjectorRunner,
  ],
  exports: [MESSAGES_READ_MODEL_STORE, MessageOutboxProjector],
})
export class MongoReadModelModule {}
