import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ShortStoryDto {
  @IsString()
  topic: string;

  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(5000)
  maxLength?: number; // optional, defaults to 500 if not provided
}

export interface ShortStoryResponse {
  story: string;
}
