import { IsUUID } from 'class-validator';

export class GroupMemberAddDto {
  @IsUUID('4')
  userId!: string;
}
