import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Complexity, DialogueResponse } from '../models/dialogue';
import { LanguageLevel } from '../models/language-level';

@Injectable()
export class DialogueService {
  private readonly logger = new Logger(DialogueService.name);
  private openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      this.logger.error('OPENAI_API_KEY not found in environment variables.');
    }

    this.openai = new OpenAI({ apiKey });
  }

  async generateDialogue(
    topic: string,
    lines?: number,
    languageLevel?: LanguageLevel,
    complexity?: Complexity,
  ): Promise<DialogueResponse | null> {
    try {
      const safeLevel = languageLevel ?? LanguageLevel.B1; // default if not provided
      const safeComplexity = complexity ?? Complexity.BASIC; // default if not provided
      const safeLines = lines ?? 10;
      const prompt = `
Generate a ${safeLines}-sentence dialogue (between Man and Woman) 
about "${topic}".
Language Level: ${safeLevel} 
Complexity: ${safeComplexity}

Output valid JSON ONLY in the following format:
{
  "dialogue": [
    {
      "speaker": "<random man name>",
      "text": "<first line>"
    },
    {
      "speaker": "<random woman name>",
      "text": "<second line>"
    }
    ...
  ]
}
No extra keys, no explanations, no disclaimers.
`.trim();

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are an AI that outputs valid JSON only. No text outside the JSON structure.',
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

      // Parse the JSON
      let data: DialogueResponse;
      try {
        data = JSON.parse(rawContent) as DialogueResponse;
      } catch (parseError) {
        this.logger.error(
          'Failed to parse dialogue response as JSON:',
          parseError,
        );
        this.logger.error('Raw content from OpenAI:', rawContent);
        return null;
      }

      // Basic validation
      if (!data.dialogue || !Array.isArray(data.dialogue)) {
        this.logger.error('Parsed JSON does not contain an array "dialogue".');
        return null;
      }

      return data;
    } catch (error) {
      this.logger.error('Error while generating dialogue:', error);
      return null;
    }
  }
}
