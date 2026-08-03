/**
 * AI Service — Abstração para OpenAI GPT-4 / Claude
 * Centraliza todas as operações de IA do sistema
 */

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';

/**
 * Call OpenAI API
 */
async function callOpenAI(messages, options = {}) {
  if (!OPENAI_KEY) {
    return { error: 'OPENAI_API_KEY não configurada', fallback: true };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 500,
      })
    });

    const data = await response.json();
    if (data.error) return { error: data.error.message };

    return {
      content: data.choices?.[0]?.message?.content || '',
      usage: data.usage
    };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Generate response suggestions for inbox
 */
async function generateSuggestion(conversationHistory, leadInfo) {
  const systemPrompt = `Você é um assistente de vendas imobiliárias. Gere 2-3 sugestões de resposta curtas e profissionais para o corretor enviar ao cliente.
Contexto do lead: ${leadInfo || 'Não disponível'}
Responda em formato JSON: { "suggestions": ["sugestão 1", "sugestão 2", "sugestão 3"] }`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-5).map(msg => ({
      role: msg.direction === 'inbound' ? 'user' : 'assistant',
      content: msg.content
    }))
  ];

  const result = await callOpenAI(messages, { temperature: 0.8, maxTokens: 300 });
  if (result.error) return { suggestions: [], error: result.error };

  try {
    const parsed = JSON.parse(result.content);
    return { suggestions: parsed.suggestions || [] };
  } catch {
    return { suggestions: [result.content] };
  }
}

/**
 * Qualify a lead based on conversation history
 */
async function qualifyLead(leadData, conversationHistory) {
  const systemPrompt = `Analise as informações do lead e histórico de conversa. Classifique em:
- temperatura: "quente" (pronto para comprar), "morno" (interessado mas indeciso), "frio" (apenas explorando)
- score: 1 a 10 (chance de conversão)
- justificativa: breve explicação
Responda em JSON: { "temperatura": "...", "score": N, "justificativa": "..." }`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Lead: ${JSON.stringify(leadData)}\nHistórico: ${conversationHistory.map(m => `${m.direction}: ${m.content}`).join('\n')}` }
  ];

  const result = await callOpenAI(messages, { temperature: 0.3, maxTokens: 200 });
  if (result.error) return { temperatura: 'morno', score: 5, justificativa: 'IA indisponível' };

  try {
    return JSON.parse(result.content);
  } catch {
    return { temperatura: 'morno', score: 5, justificativa: result.content };
  }
}

/**
 * Summarize a conversation
 */
async function summarizeConversation(messages) {
  const systemPrompt = 'Resuma esta conversa entre corretor e cliente em 2-3 frases objetivas. Destaque: interesse principal, objeções e próximo passo.';

  const chatMessages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: messages.map(m => `${m.direction === 'inbound' ? 'Cliente' : 'Corretor'}: ${m.content}`).join('\n') }
  ];

  const result = await callOpenAI(chatMessages, { temperature: 0.3, maxTokens: 200 });
  return result.content || result.error || 'Não foi possível gerar resumo';
}

/**
 * Natural language search — convert query to structured filters
 */
async function searchNLP(query) {
  const systemPrompt = `Converta a busca em linguagem natural para filtros estruturados.
Campos disponíveis: nome, telefone, email, cidade, estado, valor_min, valor_max, status, origem, tipo(lead/imovel/empreendimento).
Responda em JSON: { "tipo": "...", "filtros": { ... }, "explicacao": "..." }`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: query }
  ];

  const result = await callOpenAI(messages, { temperature: 0.2, maxTokens: 200 });
  if (result.error) return { tipo: 'lead', filtros: {}, explicacao: result.error };

  try {
    return JSON.parse(result.content);
  } catch {
    return { tipo: 'lead', filtros: {}, explicacao: result.content };
  }
}

module.exports = {
  callOpenAI,
  generateSuggestion,
  qualifyLead,
  summarizeConversation,
  searchNLP
};
