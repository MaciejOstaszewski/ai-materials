import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class GenerateTrueFalseDto {
  @IsString()
  text: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  amount: number;
}
