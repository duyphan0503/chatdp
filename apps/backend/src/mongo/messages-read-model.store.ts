import type { Collection, Document, Filter, Sort } from 'mongodb';
import type { ObjectId } from 'mongodb';

export interface MessagesReadModelDocument extends Document {
  _id?: ObjectId;
  messageId: string;
  conversationId: string;
  senderId: string;
  contentType: string;
  content: string | null;
  mediaUrl: string | null;
  createdAt: Date;
  deletedAt: Date | null;
  replyToMessageId: string | null;
  // Precomputed field for timeline sorting; currently same as createdAt.
  sortKey: Date;
}

export interface MessagesReadModelStore {
  upsertMessage(doc: MessagesReadModelDocument): Promise<void>;
  markDeleted(messageId: string, deletedAt: Date): Promise<void>;
  listConversationMessages(
    conversationId: string,
    options: { limit: number; cursor?: string },
  ): Promise<MessagesReadModelDocument[]>;
}

export const MESSAGES_READ_MODEL_STORE = 'MESSAGES_READ_MODEL_STORE';

export class MongoMessagesReadModelStore implements MessagesReadModelStore {
  constructor(private readonly collection: Collection<MessagesReadModelDocument>) {}

  async upsertMessage(doc: MessagesReadModelDocument): Promise<void> {
    const { _id, ...rest } = doc;
    void _id;
    await this.collection.updateOne(
      { messageId: doc.messageId },
      {
        $set: rest,
      },
      { upsert: true },
    );
  }

  async markDeleted(messageId: string, deletedAt: Date): Promise<void> {
    await this.collection.updateOne(
      { messageId },
      {
        $set: {
          deletedAt,
          content: null,
        },
      },
    );
  }

  async listConversationMessages(
    conversationId: string,
    options: { limit: number; cursor?: string },
  ): Promise<MessagesReadModelDocument[]> {
    const safeLimit = Math.min(Math.max(options.limit ?? 20, 1), 100);

    const filter: Filter<MessagesReadModelDocument> = { conversationId };

    if (options.cursor) {
      const cursorDoc = await this.collection.findOne({ messageId: options.cursor });
      if (cursorDoc) {
        // Seek-based pagination: fetch messages strictly older than the cursor in timeline order.
        filter.$or = [
          { createdAt: { $lt: cursorDoc.createdAt } },
          { createdAt: cursorDoc.createdAt, _id: { $lt: cursorDoc._id } },
        ];
      }
    }

    const sort: Sort = { createdAt: -1, _id: -1 };
    return this.collection
      .find(filter, {
        sort,
        limit: safeLimit,
      })
      .toArray();
  }

  static async ensureIndexes(collection: Collection<MessagesReadModelDocument>): Promise<void> {
    await collection.createIndexes([
      {
        key: { conversationId: 1, createdAt: -1 },
        name: 'conversation_createdAt_desc',
      },
      {
        key: { senderId: 1, createdAt: -1 },
        name: 'sender_createdAt_desc',
      },
      {
        key: { messageId: 1 },
        name: 'messageId_unique',
        unique: true,
      },
    ]);
  }
}

export class NoopMessagesReadModelStore implements MessagesReadModelStore {
  // No-op implementation used when MongoDB is disabled or misconfigured.
  async upsertMessage(): Promise<void> {
    // intentionally empty
  }

  async markDeleted(): Promise<void> {
    // intentionally empty
  }

  async listConversationMessages(): Promise<MessagesReadModelDocument[]> {
    // No-op store should not be used for reads; higher layers must fall back to Postgres.
    await Promise.resolve();
    return [];
  }
}
