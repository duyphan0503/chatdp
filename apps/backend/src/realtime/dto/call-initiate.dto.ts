import { IsEnum, IsOptional, IsString } from 'class-validator';
import type { CallType } from '../call-state.store.js';

export class CallInitiateDto {
  @IsString()
  conversationId!: string;

  @IsEnum(['voice', 'video'] as const)
  type!: CallType;

  @IsOptional()
  sdpOffer?: unknown;
}
