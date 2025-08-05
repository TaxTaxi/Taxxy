import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { transactions } = await req.json();

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json({ error: 'Missing or invalid transactions array.' }, { status: 400 });
    }

    const prompt = `
You're a tax assistant AI. Based on the following transactions, suggest possible deductions or tax write-offs.
Return a JSON array with objects that contain:
- "description": the original transaction description
- "suggestion": a brief tax advice or deduction suggestion
- "confidence": a number between 0 and 1 indicating your confidence

Here are the transactions:
${JSON.stringify(transactions, null, 2)}

Respond ONLY with JSON in this format:
[
  {
    "description": "Transaction description here",
    "suggestion": "Tax suggestion here",
    "confidence": 0.9
  }
]
`;

    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
    });

    const responseText = chatResponse.choices[0]?.message?.content;

    if (!responseText) {
      return NextResponse.json({ error: 'No suggestions returned.' }, { status: 500 });
    }

    try {
      const suggestions = JSON.parse(responseText);
      return NextResponse.json(suggestions);
    } catch (err) {
      console.error('❌ Failed to parse AI response:', responseText);
      return NextResponse.json({ error: 'Invalid AI response format.' }, { status: 500 });
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return NextResponse.json({ error: 'Unexpected error occurred.' }, { status: 500 });
  }
}
