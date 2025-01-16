import { IsEnum, IsOptional, IsInt, Min, Max } from 'class-validator';

export enum TenseTypeEnum {
  PRESENT_SIMPLE = 'PRESENT_SIMPLE',
  PRESENT_SIMPLE_CONTINUOUS = 'PRESENT_SIMPLE_CONTINUOUS',
  PAST_SIMPLE = 'PAST_SIMPLE',
  PAST_CONTINUOUS = 'PAST_CONTINUOUS',
}

export interface GrammarExercise {
  sentence: string; // e.g. "He {runs} every morning."
  answer: string; // e.g. "runs"
  options: string[]; // e.g. ["run", "runs", "ran", "is running"]
}
export class GenerateExercisesDto {
  /**
   * Which tense do we want to generate exercises for?
   */
  @IsEnum(TenseTypeEnum)
  tense: TenseTypeEnum;

  /**
   * (Optional) How many exercises to generate.
   * Defaults to some reasonable number if not provided.
   */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  amount?: number;
}
