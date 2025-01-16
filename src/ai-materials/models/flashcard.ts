import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { LanguageLevel } from './language-level';

export interface Flashcard {
  source: string;
  translation: string;
  sourceSentence: string;
  sourceTranslation: string;
}

export interface FlashcardsResponse {
  result: Flashcard[];
}

export class FlashcardDto {
  @IsString()
  category: string;

  @IsOptional()
  @IsEnum(LanguageLevel)
  level: LanguageLevel;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(100)
  amount: number;
}
