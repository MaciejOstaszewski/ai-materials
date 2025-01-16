import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FlashcardService } from './ai-materials/services/flashcard.service';
import { AIMaterialController } from './ai-materials/ai-materials.controller';
import { DialogueService } from './ai-materials/services/dialogue.service';
import { ShortStoryService } from './ai-materials/services/short-story.service';
import { TextGrammaticalAnalysisService } from './ai-materials/services/text-grammatical-analysis.service';
import { GrammarExercisesService } from './ai-materials/services/grammar-exercises.service';
import { TrueFalseService } from './ai-materials/services/true-false.service';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [AIMaterialController],
  providers: [
    FlashcardService,
    DialogueService,
    ShortStoryService,
    TextGrammaticalAnalysisService,
    GrammarExercisesService,
    TrueFalseService,
  ],
})
export class AppModule {}
