import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Uses Claude Haiku to map arbitrary CSV column headers to Nudgenest review fields.
 * Returns a mapping of { csvColumn: nudgenestField } — unmappable columns are omitted.
 */
export async function mapCsvFields(
    headers: string[],
    sampleRow: string[]
): Promise<Record<string, string>> {
    const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [{
            role: 'user',
            content: `Map these CSV columns to Nudgenest review fields.
Nudgenest fields: customerName, customerEmail, rating (integer 1-5), comment, productName, createdAt (ISO date string), published (boolean true/false).
CSV headers: ${JSON.stringify(headers)}
Sample row values: ${JSON.stringify(sampleRow)}
Return ONLY valid JSON object: { "csvColumn": "nudgenestField" } — omit columns that don't map to any Nudgenest field.`,
        }],
    });

    const text = (message.content[0] as Anthropic.TextBlock).text;
    // Strip markdown code fences if present
    const jsonText = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    return JSON.parse(jsonText) as Record<string, string>;
}
