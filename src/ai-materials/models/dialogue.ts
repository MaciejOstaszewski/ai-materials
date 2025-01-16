import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { LanguageLevel } from './language-level';

export interface DialogueMessage {
  speaker: string;
  text: string;
}

export interface DialogueResponse {
  dialogue: DialogueMessage[];
}

export enum Complexity {
  BASIC = 'basic',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export class DialogueDto {
  @IsString()
  topic: string;

  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(50)
  lines?: number;

  @IsOptional()
  @IsEnum(LanguageLevel)
  languageLevel?: LanguageLevel;

  @IsOptional()
  @IsEnum(Complexity)
  complexity?: Complexity;
}
