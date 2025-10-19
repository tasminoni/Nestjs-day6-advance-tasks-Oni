import { IsOptional, IsString, IsNumber, Min, Max, IsBoolean, IsIn, IsArray } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class QueryUsersDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  pageSize?: number = 10;

  @IsOptional()
  @IsString()
  sort?: string = 'createdAt:-1';

  @IsOptional()
  @IsIn(['basic', 'admin', 'custom'])
  fields?: string = 'basic';

  @IsOptional()
  @IsString()
  customFields?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  includeDeleted?: boolean = false;

  // Query operators
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  age?: number;

  @IsOptional()
  @IsString()
  phone?: string;

  // Advanced query operators
  @IsOptional()
  @IsString()
  ageIn?: string; // comma-separated values

  @IsOptional()
  @IsString()
  ageNin?: string; // comma-separated values

  @IsOptional()
  @IsString()
  nameRegex?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  hasPhone?: boolean;

  // Text search
  @IsOptional()
  @IsString()
  q?: string;
}
