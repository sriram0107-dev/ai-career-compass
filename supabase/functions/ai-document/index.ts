import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, documentText, option, chatHistory, question } = await req.json();

    let prompt = '';

    if (action === 'summarize') {
      const optionPrompts: Record<string, string> = {
        summary: `Summarize the following document for someone exploring career paths. Focus on key takeaways and actionable insights.`,
        keyTerms: `Extract and explain all key terms and technical vocabulary from this document. Organize by topic.`,
        studyGuide: `Create a comprehensive study guide from this document with chapters, key concepts, and review questions.`,
      };

      prompt = `${optionPrompts[option] || optionPrompts.summary}

Document text:
"${documentText}"

Return a JSON object (no markdown, just raw JSON):
{
  "title": "Result Title",
  "points": ["Key point 1", "Key point 2", "Key point 3", "Key point 4"],
  "terms": ["Term1", "Term2", "Term3", "Term4", "Term5"],
  "actions": ["Action item 1", "Action item 2", "Action item 3"]
}`;
    } else if (action === 'chat') {
      const history = (chatHistory || []).map((m: { role: string; text: string }) => 
        `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`
      ).join('\n');

      prompt = `You are a helpful study assistant. The user has uploaded a document and is asking questions about it.

Document text:
"${documentText}"

${history ? `Previous conversation:\n${history}\n` : ''}
User's question: "${question}"

Provide a helpful, concise answer. Use markdown formatting.`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    if (action === 'summarize') {
      let parsed;
      try {
        const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        parsed = JSON.parse(jsonStr);
      } catch {
        parsed = {
          title: option === 'keyTerms' ? 'Key Terms' : option === 'studyGuide' ? 'Study Guide' : 'Summary',
          points: [content.slice(0, 200)],
          terms: [],
          actions: [],
        };
      }
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ reply: content }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
