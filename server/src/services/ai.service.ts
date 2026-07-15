import dotenv from 'dotenv';

dotenv.config();

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

interface PageContext {
  pageName: string;
  pathname: string;
  details?: any;
}

export class AiService {
  /**
   * Generates a chat response using a fallback chain: Gemini -> OpenRouter -> Groq.
   * If a service fails or is rate-limited, it automatically falls back to the next.
   */
  static async generateChatResponse(
    message: string,
    history: ChatMessage[],
    pageContext: PageContext
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(pageContext);

    // List of providers in fallback order
    const providers = [
      { name: 'Gemini', fn: () => this.callGemini(message, history, systemPrompt) },
      { name: 'OpenRouter', fn: () => this.callOpenRouter(message, history, systemPrompt) },
      { name: 'Groq', fn: () => this.callGroq(message, history, systemPrompt) }
    ];

    let lastError: Error | null = null;

    for (const provider of providers) {
      try {
        console.log(`[AI Chat] Attempting response with ${provider.name}...`);
        const response = await provider.fn();
        if (response && response.trim()) {
          console.log(`[AI Chat] Success with ${provider.name}`);
          return response;
        }
      } catch (error: any) {
        console.error(`[AI Chat] ${provider.name} failed:`, error.message || error);
        lastError = error;
      }
    }

    // If all providers failed, fallback to a friendly localized/offline response
    console.error('[AI Chat] All AI providers failed. Using fallback response.');
    return this.getLocalFallbackResponse(message, pageContext);
  }

  private static buildSystemPrompt(context: PageContext): string {
    const pageName = context.pageName || 'EyeGlaze Website';
    const pathname = context.pathname || '/';
    const details = context.details ? JSON.stringify(context.details, null, 2) : 'No details';

    return `You are a helpful customer support AI assistant for EyeGlaze, a premium eyewear and eyeglasses e-commerce platform.

CRITICAL INSTRUCTION: The user is currently browsing the "${pageName}" page of our website (URL Path: "${pathname}"). 
You MUST ONLY answer questions that are directly related to the content, context, and products on this specific page. 
Do NOT talk about off-topic subjects, programming, general jokes, other pages, or unrelated website sections unless they are directly relevant to this page.

Below is the context/details of the "${pageName}" page the user is currently looking at:
------------------
Page Name: ${pageName}
Page Path: ${pathname}
Page Context Details:
${details}
------------------

If the user's question is NOT related to the current page's context or products, you MUST politely decline to answer. 
For example: "I am your assistant for the ${pageName} page, and I can only answer questions related to it. Please visit the corresponding page or contact support if you need help with other topics."

Keep your responses concise (1-3 sentences maximum), engaging, premium, and focused on helping the customer choose or buy.`;
  }

  private static async callGemini(
    message: string,
    history: ChatMessage[],
    systemPrompt: string
  ): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not defined in environment.');

    // Google AI Studio endpoint for gemini-2.0-flash
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    // Map history and system prompt to Gemini format
    const contents = [];

    // Prepend system prompt to guide the model
    contents.push({
      role: 'user',
      parts: [{ text: `System Instructions: ${systemPrompt}` }]
    });

    contents.push({
      role: 'model',
      parts: [{ text: 'Understood. I will strictly act as the EyeGlaze customer support assistant and only answer questions about the active page context.' }]
    });

    // Add conversation history
    history.forEach((msg) => {
      contents.push({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      });
    });

    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const body = {
      contents,
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 250
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API HTTP Error ${response.status}: ${errorText}`);
    }

    const data: any = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('Gemini API returned an empty or malformed candidates list.');
    }

    return candidateText;
  }

  private static async callOpenRouter(
    message: string,
    history: ChatMessage[],
    systemPrompt: string
  ): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('OPENROUTER_API_KEY is not defined in environment.');

    const url = 'https://openrouter.ai/api/v1/chat/completions';

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      })),
      { role: 'user', content: message }
    ];

    const body = {
      model: 'google/gemini-2.5-flash',
      messages,
      temperature: 0.4,
      max_tokens: 250
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://eyeglaze.in',
        'X-Title': 'EyeGlaze Chatbot'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API HTTP Error ${response.status}: ${errorText}`);
    }

    const data: any = await response.json();
    const responseText = data.choices?.[0]?.message?.content;
    if (!responseText) {
      throw new Error('OpenRouter API returned an empty response choices.');
    }

    return responseText;
  }

  private static async callGroq(
    message: string,
    history: ChatMessage[],
    systemPrompt: string
  ): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY is not defined in environment.');

    const url = 'https://api.groq.com/openai/v1/chat/completions';

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      })),
      { role: 'user', content: message }
    ];

    const body = {
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.4,
      max_tokens: 250
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API HTTP Error ${response.status}: ${errorText}`);
    }

    const data: any = await response.json();
    const responseText = data.choices?.[0]?.message?.content;
    if (!responseText) {
      throw new Error('Groq API returned an empty response choices.');
    }

    return responseText;
  }

  /**
   * Safe offline client-side fallback if all services fail.
   * Matches the original hardcoded mock rules so users always get a response.
   */
  private static getLocalFallbackResponse(message: string, context: PageContext): string {
    const val = message.toLowerCase();
    const pageName = context.pageName || '';

    if (pageName.includes('Product')) {
      const prod = context.details || {};
      if (val.includes('price') || val.includes('cost') || val.includes('rate')) {
        return `This frame starts at ₹${prod.price?.selling || 1}. With prescription lenses, packages start from ₹699.`;
      }
      if (val.includes('size') || val.includes('fit') || val.includes('measure') || val.includes('dimension')) {
        return `This frame has a total width of ${prod.frame?.width || 140}mm, lens width of ${prod.frame?.lensWidth || 54}mm, bridge width of ${prod.frame?.bridgeWidth || 18}mm, and temple length of ${prod.frame?.templeLength || 145}mm.`;
      }
      return `This frame is highly compatible with prescription, blue cut, and progressive lenses starting from ₹699. How can I help you choose?`;
    }

    if (pageName.includes('Membership') || pageName.includes('Gold')) {
      return `Our Gold Membership is just ₹129! Members get frames starting at ₹1, Buy 1 Get 1 free, and zero convenience fees. Would you like to join?`;
    }

    if (val.includes('round') || val.includes('face')) {
      return 'For a round face, rectangular or square frames like our EG-2041 Matte Square Frame are perfect because they add sharp angles and structure!';
    }
    if (val.includes('prescription') || val.includes('upload') || val.includes('lens')) {
      return 'You can upload your prescription directly on the home page or select "Buy with Lens" on any product page. We offer HMC, Blue Cut, and Progressive options starting from ₹699.';
    }
    if (val.includes('offer') || val.includes('discount') || val.includes('price')) {
      return 'We currently have a spectacular UP TO 50% OFF promotion on selected sunglasses! Frames start at just ₹1.';
    }
    if (val.includes('delivery') || val.includes('shipping') || val.includes('track')) {
      return 'We offer FREE SHIPPING on all orders! Standard delivery takes 2-4 business days, and you can track your order using the "Track Order" widget.';
    }

    return "I'd love to help you find the perfect eyewear! Are you looking for prescription glasses, sunglasses, or trying to find your frame size?";
  }
}
