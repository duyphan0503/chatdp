import { IsJWT, IsString } from 'class-validator';

export class AuthenticateDto {
  @IsString()
  @IsJWT()
  token!: string;
}
