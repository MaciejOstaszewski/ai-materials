import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { FlashcardsResponse } from '../models/flashcard';
import { LanguageLevel } from '../models/language-level';

@Injectable()
export class FlashcardService {
  private readonly logger = new Logger(FlashcardService.name);
  private openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      this.logger.error('OPENAI_API_KEY not found in environment variables.');
    }

    this.openai = new OpenAI({ apiKey });
  }

  async generateFlashcards(
    category: string,
    level: LanguageLevel,
    amount: number = 5,
  ): Promise<FlashcardsResponse | null> {
    try {
      const prompt = `Generate a set of ${amount} English flashcards in the "${category}" category 
  for a ${level} level student. 
  Please return valid JSON **only** in the following structure:
  {
    "result": [
      {
        "source": "<English word>",
        "translation": "<Polish translation>",
        "sourceSentence": "<English sentence>",
        "sourceTranslation": "<Polish translation of the sentence>"
      }
    ]
  }
  No additional keys. 
  No additional text outside the JSON. 
  Make sure it is valid JSON.
  `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are an AI assistant that helps with language learning. Output must be valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      });

      if (!response.choices || response.choices.length === 0) {
        this.logger.error('No choices returned from OpenAI.');
        return null;
      }

      const rawContent = response.choices[0].message?.content?.trim() ?? '';

      // Attempt to parse JSON
      let data: FlashcardsResponse;
      try {
        data = JSON.parse(rawContent) as FlashcardsResponse;
      } catch (parseError) {
        this.logger.error(
          'Failed to parse OpenAI response as JSON:',
          parseError,
        );
        this.logger.error('Raw response content:', rawContent);
        return null;
      }

      // Optionally, you can validate the structure, e.g., check if data.result is an array, etc.
      if (!data.result || !Array.isArray(data.result)) {
        this.logger.error(
          'Parsed JSON does not contain expected "result" array.',
        );
        return null;
      }

      return data;
    } catch (error) {
      this.logger.error('Error while generating flashcards:', error);
      return null;
    }
  }
}
