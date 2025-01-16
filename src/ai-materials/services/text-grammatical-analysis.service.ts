import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';

@Injectable()
export class TextGrammaticalAnalysisService {
  private readonly logger = new Logger(TextGrammaticalAnalysisService.name);
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.error('OPENAI_API_KEY is missing in environment variables.');
    }
    this.openai = new OpenAI({ apiKey });
  }

  async analyzeTextForTenses(text: string): Promise<any | null> {
    try {
      // Updated prompt emphasizing future vs present continuous distinction
      const prompt = `
Analyze the following English text by splitting it into individual sentences.

**Important**:
1) If a sentence uses “am/is/are + verb-ing” and includes a future time adverb ("tomorrow", "next week", "soon", "in 2 days"), classify it as a future tense (prefer 'future_continuous') rather than present_continuous.
2) Otherwise, classify each sentence into exactly one of these tenses:
   - present_simple
   - present_continuous
   - past_simple
   - past_continuous
   - present_perfect
   - present_perfect_continuous
   - past_perfect
   - past_perfect_continuous
   - future_simple
   - future_continuous

Then produce:
1) "coloredText" – the original text with each sentence wrapped in <span class="tense-..."> ... </span>.
2) "tenses_in_text" – an object with the breakdown of each tense, including absolute count, percentage, color, and the array of exact sentences.

Use these color mappings:
- present_simple: salmon
- present_continuous: orange
- past_simple: yellow
- past_continuous: green
- present_perfect: blue
- present_perfect_continuous: light-blue
- past_perfect: magenta
- past_perfect_continuous: pink
- future_simple: red
- future_continuous: cyan

Output valid JSON ONLY in this format:

{
  "coloredText": "<the entire text with <span class=\\"tense-...\\">Sentence</span> ...>",
  "tenses_in_text": {
    "all_tenses": {
      "absolute": <totalSentenceCount>,
      "percentage": 100
    },
    "present_simple": {
      "absolute": ...,
      "percentage": ...,
      "color": "salmon",
      "sentences": ["..."]
    },
    "present_continuous": {
      "absolute": ...,
      "percentage": ...,
      "color": "orange",
      "sentences": ["..."]
    },
    ...
  }
}

No additional text or disclaimers.

Text to analyze:
"""${text}"""
`.trim();

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are an AI that outputs valid JSON, with no extra commentary.',
          },
          { role: 'user', content: prompt },
        ],
        // Lower temperature => more compliance
        temperature: 0.2,
      });

      if (!response.choices || response.choices.length === 0) {
        this.logger.error('No choices returned from GPT.');
        return null;
      }

      const rawContent = response.choices[0].message?.content?.trim() ?? '';

      // Attempt JSON parse
      let data: any;
      try {
        data = JSON.parse(rawContent);
      } catch (parseError) {
        this.logger.error('Failed to parse JSON from GPT:', parseError);
        this.logger.error('Raw response:', rawContent);
        return null;
      }

      // Basic validation checks
      if (!data.coloredText) {
        this.logger.error('Missing "coloredText" in the response.');
        return null;
      }
      if (!data.tenses_in_text) {
        this.logger.error('Missing "tenses_in_text" in the response.');
        return null;
      }

      return data;
    } catch (error) {
      this.logger.error('Error analyzing text for tenses:', error);
      return null;
    }
  }
}
