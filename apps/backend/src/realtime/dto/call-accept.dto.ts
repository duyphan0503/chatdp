import { IsOptional, IsString } from 'class-validator';

export class CallAcceptDto {
  @IsString()
  callId!: string;

  @IsOptional()
  sdpAnswer?: unknown;
}
