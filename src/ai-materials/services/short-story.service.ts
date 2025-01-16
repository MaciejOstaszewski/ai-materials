// short-story.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import { ShortStoryResponse } from '../models/short-story';

@Injectable()
export class ShortStoryService {
  private readonly logger = new Logger(ShortStoryService.name);
  private openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.error('OPENAI_API_KEY not found in environment variables.');
    }

    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Generate a short story in JSON format.
   *
   * @param topic The main topic or theme of the story.
   * @param maxLength Maximum character length (default = 500).
   * @returns ShortStoryResponse or null on error.
   */
  async generateShortStory(
    topic: string,
    maxLength: number = 500,
  ): Promise<ShortStoryResponse | null> {
    try {
      // Construct the prompt
      const prompt = `
Generate a short story about "${topic}" with a maximum of ${maxLength} characters. 
Output valid JSON ONLY in the following format:
{
  "story": "<your short story text>"
}
No additional keys or text outside the JSON.
If the story exceeds ${maxLength} characters, truncate or compress it.
`.trim();

      // Call OpenAI
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are an AI that outputs valid JSON only. No extra commentary.',
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

      // Parse JSON
      let data: ShortStoryResponse;
      try {
        data = JSON.parse(rawContent) as ShortStoryResponse;
      } catch (parseError) {
        this.logger.error('Failed to parse story as JSON:', parseError);
        this.logger.error('Raw content from OpenAI:', rawContent);
        return null;
      }

      // Basic validation
      if (!data.story) {
        this.logger.error('JSON does not contain the "story" field.');
        return null;
      }

      return data;
    } catch (error) {
      this.logger.error('Error generating short story:', error);
      return null;
    }
  }
}
