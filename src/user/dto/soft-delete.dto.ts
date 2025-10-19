import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class SoftDeleteDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  deleteReason?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  deletedBy?: string;
}
