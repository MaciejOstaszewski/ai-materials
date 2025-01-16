import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';

export interface TrueFalseThesis {
  thesis: string;
  isTrue: boolean;
}

@Injectable()
export class TrueFalseService {
  private readonly logger = new Logger(TrueFalseService.name);
  private readonly openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.error('OPENAI_API_KEY missing from environment.');
    }

    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Generates a set of true/false theses based on a given text.
   * @param text The source text from which to derive statements
   * @param numberOfTheses How many statements to generate (default 5)
   */
  async generateTrueFalseTheses(
    text: string,
    numberOfTheses = 5,
  ): Promise<TrueFalseThesis[] | null> {
    try {
      const prompt = `
Read the following text and create ${numberOfTheses} statements (theses) about it. 
Some should be correct (true) facts, and some should be incorrect (false). 
Return only valid JSON in an array of objects, each object having:
- "thesis": a string statement
- "isTrue": a boolean that indicates if the statement is true or false

No additional keys, no extra commentary. Output example:
[
  { "thesis": "The main character's name is John.", "isTrue": true },
  { "thesis": "The events take place in Spain.", "isTrue": false }
]

TEXT:
"""${text}"""
      `.trim();

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You output valid JSON only, no explanations.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
      });

      if (!response.choices || response.choices.length === 0) {
        this.logger.error('No choices returned by GPT.');
        return null;
      }

      const rawContent = response.choices[0].message?.content?.trim() ?? '';

      let data: TrueFalseThesis[];
      try {
        data = JSON.parse(rawContent) as TrueFalseThesis[];
      } catch (parseError) {
        this.logger.error('Failed to parse JSON from GPT:', parseError);
        this.logger.error('Raw content:', rawContent);
        return null;
      }

      // Optional: validate shape
      if (!Array.isArray(data)) {
        this.logger.error(
          'Expected an array of statements, got something else.',
        );
        return null;
      }

      return data;
    } catch (error) {
      this.logger.error('OpenAI request failed:', error);
      return null;
    }
  }
}
