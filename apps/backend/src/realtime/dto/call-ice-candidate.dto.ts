import { IsObject, IsString } from 'class-validator';

export class CallIceCandidateDto {
  @IsString()
  callId!: string;

  @IsObject()
  candidate!: unknown;
}
