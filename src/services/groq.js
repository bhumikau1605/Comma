const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

async function groqChat(systemPrompt, userPrompt) {
  if (!GROQ_API_KEY) throw new Error('EXPO_PUBLIC_GROQ_API_KEY is not set in .env');
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 300,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Groq API error ${res.status}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? '';
}

export const GroqService = {
  /**
   * Suggest a fair price in INR for a second-hand item.
   * Returns a number string like "1200".
   */
  async suggestPrice(title, category, condition) {
    const system = `You are a pricing expert for a second-hand marketplace in India.
Given an item's title, category, and condition, respond with ONLY a single integer representing a fair resale price in Indian Rupees (₹). No explanation, no symbol, just the number.`;
    const user = `Title: ${title}\nCategory: ${category}\nCondition: ${condition}`;
    const raw = await groqChat(system, user);
    const num = parseInt(raw.replace(/[^0-9]/g, ''), 10);
    if (isNaN(num)) throw new Error('Could not parse price from AI response');
    return num;
  },

  /**
   * Generate a short, engaging listing description.
   * Returns 2-3 sentences.
   */
  async generateDescription(title, category, condition) {
    const system = `You are a copywriter for a second-hand marketplace app in India called Comma.
Write a short, honest, and engaging product description (2-3 sentences max) for a second-hand item being listed for sale. Be specific, mention condition, and make it appealing. No bullet points, no headers, just plain text.`;
    const user = `Item: ${title}\nCategory: ${category}\nCondition: ${condition}`;
    return groqChat(system, user);
  },
};
