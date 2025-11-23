import { IsOptional, IsString } from 'class-validator';

export class CallEndDto {
  @IsString()
  callId!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
