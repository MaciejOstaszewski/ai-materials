import {
  Body,
  Controller,
  Logger,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FlashcardService } from './services/flashcard.service';
import { FlashcardDto, FlashcardsResponse } from './models/flashcard';
import { DialogueService } from './services/dialogue.service';
import { DialogueDto } from './models/dialogue';
import { ShortStoryDto } from './models/short-story';
import { ShortStoryService } from './services/short-story.service';
import { TextGrammaticalAnalysisDto } from './models/text-grammatical-analysis';
import { TextGrammaticalAnalysisService } from './services/text-grammatical-analysis.service';
import { GenerateExercisesDto } from './models/grammar-exercises';
import { GrammarExercisesService } from './services/grammar-exercises.service';
import { GenerateTrueFalseDto } from './models/generate-true-false';
import { TrueFalseService } from './services/true-false.service';

@Controller()
export class AIMaterialController {
  constructor(
    private readonly flashcardService: FlashcardService,
    private readonly dialogueService: DialogueService,
    private readonly shortStoryService: ShortStoryService,
    private readonly analysisService: TextGrammaticalAnalysisService,
    private readonly grammarExercisesService: GrammarExercisesService,
    private readonly trueFalseService: TrueFalseService,
  ) {}
  private readonly logger = new Logger(AIMaterialController.name);

  @Post('flashcards')
  @UsePipes(new ValidationPipe())
  async generateFlashcards(@Body() dto: FlashcardDto): Promise<
    | FlashcardsResponse
    | {
        error: string;
      }
  > {
    const { category, level, amount } = dto;
    this.logger.debug(
      `Received request to generate flashcards [category=${category}, level=${level}]`,
    );

    const result = await this.flashcardService.generateFlashcards(
      category,
      level,
      amount,
    );

    if (!result) {
      return { error: 'Error while generating flashcards' };
    }

    return result;
  }

  @Post('dialogue')
  @UsePipes(new ValidationPipe())
  async generateDialogue(@Body() dto: DialogueDto) {
    const { topic, lines, languageLevel, complexity } = dto;

    this.logger.debug(`Received request for dialogue on topic: ${topic}`);

    const result = await this.dialogueService.generateDialogue(
      topic,
      lines,
      languageLevel,
      complexity,
    );

    if (!result) {
      return { error: 'Error while generating dialogue' };
    }
    return result;
  }

  @Post('short-story')
  @UsePipes(new ValidationPipe())
  async generateShortStory(@Body() dto: ShortStoryDto) {
    const { topic, maxLength } = dto;
    this.logger.debug(
      `Request for a short story => topic: ${topic}, maxLength: ${maxLength ?? 500}`,
    );

    const result = await this.shortStoryService.generateShortStory(
      topic,
      maxLength,
    );
    if (!result) {
      return { error: 'Error while generating short story' };
    }
    return result; // will return { "story": "..." }
  }

  @Post('text-grammatical-analysis')
  @UsePipes(new ValidationPipe())
  async analyzeText(@Body() dto: TextGrammaticalAnalysisDto) {
    this.logger.debug(`Received text of length: ${dto.text.length}`);
    const result = await this.analysisService.analyzeTextForTenses(dto.text);

    if (!result) {
      return { error: 'Error analyzing text or invalid JSON returned by GPT.' };
    }

    return result;
  }

  @Post('/grammar-exercises')
  @UsePipes(new ValidationPipe())
  async generateGrammarExercises(@Body() dto: GenerateExercisesDto) {
    return this.grammarExercisesService.generateExercises(
      dto.tense,
      dto.amount,
    );
  }

  @Post('true-false-theses')
  @UsePipes(new ValidationPipe())
  async generateTrueFalseTheses(@Body() dto: GenerateTrueFalseDto) {
    this.logger.debug(`Received text of length ${dto.text.length}`);

    // Call the service
    const result = await this.trueFalseService.generateTrueFalseTheses(
      dto.text,
      dto.amount,
    );

    if (!result) {
      return { error: 'Error generating true/false theses' };
    }
    // Return an array of { thesis, isTrue }
    return result;
  }
}
