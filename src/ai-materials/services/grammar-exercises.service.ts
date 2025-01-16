import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import { GrammarExercise, TenseTypeEnum } from '../models/grammar-exercises';

// The shape of each exercise

@Injectable()
export class GrammarExercisesService {
  private readonly logger = new Logger(GrammarExercisesService.name);
  private openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.error('Missing OPENAI_API_KEY in environment variables!');
    }
    this.openai = new OpenAI({ apiKey });
  }

  async generateExercises(
    tense: string,
    amount: number,
  ): Promise<GrammarExercise[]> {
    switch (tense) {
      case TenseTypeEnum.PRESENT_SIMPLE:
        return this.generatePresentSimpleExercises(amount);
      case TenseTypeEnum.PAST_SIMPLE:
        return this.generatePastSimpleExercises(amount);
      case TenseTypeEnum.PRESENT_SIMPLE_CONTINUOUS:
        return this.generatePresentContinuousExercises(amount);
      case TenseTypeEnum.PAST_CONTINUOUS:
        return this.generatePastContinuousExercises(amount);
    }
  }

  /**
   * Common method to generate exercises given a specific tense instruction
   */
  private async generateExercisesForTense(
    tenseName: string,
    promptDescription: string,
    amount = 5,
  ): Promise<GrammarExercise[] | null> {
    try {
      // We'll ask for 5 exercises, you can tweak.
      const prompt = `
Generate ${amount} English grammar exercises practicing the ${tenseName}. 
Each exercise must have:
1) A sentence with ONE gap in curly braces, e.g. "He {runs} every day." 
2) "answer" which is the correct word/phrase for that gap. 
3) "options" an array of exactly 4 items: the correct answer + 3 distractors.

Output valid JSON ONLY as an array, for example:
[
  {
    "sentence": "He {runs} every day.",
    "answer": "runs",
    "options": ["runs", "run", "ran", "is running"]
  },
  ...
]

No additional text or keys. No explanations. The gap is always in curly braces.
Give me exactly 5 exercises.
${promptDescription}
`.trim();

      // Call OpenAI with a relatively low temperature to keep answers consistent
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an AI that outputs valid JSON only.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
      });

      if (!response.choices || response.choices.length === 0) {
        this.logger.error('No choices returned from GPT.');
        return null;
      }

      const rawContent = response.choices[0].message?.content?.trim() ?? '';

      let data: GrammarExercise[];
      try {
        data = JSON.parse(rawContent) as GrammarExercise[];
      } catch (parseError) {
        this.logger.error('Error parsing GPT JSON:', parseError);
        this.logger.error('Raw content:', rawContent);
        return null;
      }

      // Basic validation checks
      if (!Array.isArray(data)) {
        this.logger.error(
          'Expected an array of exercises, got something else.',
        );
        return null;
      }

      // Optionally verify each object has sentence, answer, options
      return data;
    } catch (error) {
      this.logger.error('OpenAI request failed:', error);
      return null;
    }
  }

  async generatePresentSimpleExercises(
    amount?: number,
  ): Promise<GrammarExercise[] | null> {
    return this.generateExercisesForTense(
      'PRESENT SIMPLE',
      `
Use verbs typical for daily routines or general statements.
Make sure each sentence uses the present simple tense.
`,
      amount,
    );
  }

  async generatePresentContinuousExercises(
    amount?: number,
  ): Promise<GrammarExercise[] | null> {
    return this.generateExercisesForTense(
      'PRESENT CONTINUOUS',
      `
Focus on actions happening right now or current temporary situations.
`,
      amount,
    );
  }

  async generatePastSimpleExercises(
    amount?: number,
  ): Promise<GrammarExercise[] | null> {
    return this.generateExercisesForTense(
      'PAST SIMPLE',
      `
Use finished actions or events in the past, with simple forms like "walked", "played", "did", etc.
`,
      amount,
    );
  }

  async generatePastContinuousExercises(
    amount?: number,
  ): Promise<GrammarExercise[] | null> {
    return this.generateExercisesForTense(
      'PAST CONTINUOUS',
      `
Use was/were + verb-ing for actions in progress at a specific moment in the past.
`,
      amount,
    );
  }
}
