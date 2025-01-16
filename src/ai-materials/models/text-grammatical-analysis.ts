import { IsString } from 'class-validator';

export class TextGrammaticalAnalysisDto {
  @IsString()
  text: string;
}
