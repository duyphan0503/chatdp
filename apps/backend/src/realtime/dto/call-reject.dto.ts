import { IsOptional, IsString } from 'class-validator';

export class CallRejectDto {
  @IsString()
  callId!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
