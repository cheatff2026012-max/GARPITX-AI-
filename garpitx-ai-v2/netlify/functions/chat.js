const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { messages } = JSON.parse(event.body);

    if (!messages || !Array.isArray(messages)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Format pesan tidak valid.' }),
      };
    }

    const apiKey = process.env.CROWLLM_API_KEY;
    const apiUrl = process.env.CROWLLM_API_URL || 'https://api-inference.huggingface.co/models/crowllm/CrowLLM';

    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'CROWLLM_API_KEY belum dikonfigurasi di Environment Variables Netlify.',
        }),
      };
    }

    const systemPrompt = "Kamu adalah GARPITX AI, asisten kecerdasan buatan tingkat lanjut berbasis model CrowLLM. Jawablah dalam Bahasa Indonesia dengan cerdas, ramah, terstruktur, dan menggunakan format Markdown yang rapi bila diperlukan.\n\n";
    const conversationText = messages
      .map((m) => `${m.role === 'user' ? 'User' : 'GARPITX AI'}: ${m.content}`)
      .join('\n');
    const fullPrompt = `${systemPrompt}${conversationText}\nGARPITX AI:`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: fullPrompt,
        parameters: {
          max_new_tokens: 768,
          temperature: 0.7,
          top_p: 0.9,
          return_full_text: false
        }
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `API Error: ${errText}` }),
      };
    }

    const data = await response.json();

    let replyText = '';
    if (Array.isArray(data) && data[0]?.generated_text) {
      replyText = data[0].generated_text.trim();
    } else if (data.choices && data.choices[0]?.message?.content) {
      replyText = data.choices[0].message.content.trim();
    } else if (data.generated_text) {
      replyText = data.generated_text.trim();
    } else {
      replyText = JSON.stringify(data);
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: replyText }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Server Error: ${error.message}` }),
    };
  }
};
