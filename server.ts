import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const app = express();
const PORT = 3000;

// Body parsing middleware
app.use(express.json());

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// AI Voice Parsing Endpoint
app.post('/api/ai/parse-voice', async (req, res) => {
  try {
    const { mode = 'farmer', transcript = '' } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY || '';

    if (!apiKey) {
      return res.json({ success: false, error: 'GEMINI_API_KEY environment variable is not configured' });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    if (mode === 'farmer') {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Extract farmer registration fields from this spoken voice message: "${transcript}". Details may be spoken in ANY order and ANY Indian language (English, Hindi, Telugu, Kannada, Tamil, Marathi, Hinglish, Tenglish, etc.).`,
        config: {
          systemInstruction: `You are an AI speech processing engine for Indian Agricultural Mandis (PhoolMitra / Bharat Mandi). Extract farmer registration details from spoken text. Clean phone numbers to 10 digits. Output strict JSON.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              village: { type: Type.STRING },
              phone: { type: Type.STRING },
              primaryCrops: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['name', 'village', 'phone', 'primaryCrops'],
          },
        },
      });

      let parsed = {};
      try {
        parsed = JSON.parse(response.text || '{}');
      } catch {}

      return res.json({ success: true, mode, result: parsed });
    } else {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Extract consignment sale lot details from this spoken voice message: "${transcript}". Details (farmer name, mobile, village, commodity, variety, weight/quantity, rate, commission, labor) may be spoken in ANY order and ANY language.`,
        config: {
          systemInstruction: `You are an AI speech processing engine for Indian Agricultural Mandis (PhoolMitra / Bharat Mandi). Extract sale lot details from spoken text. Output strict JSON. Map unit to one of: 'Kgs', 'Bags', 'Crates', 'Quintals', 'Boxes', 'Bunches', 'Baskets'. Map commodityCategory to one of: 'flowers', 'grains', 'vegetables', 'fruits'.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              farmerName: { type: Type.STRING },
              farmerPhone: { type: Type.STRING },
              farmerVillage: { type: Type.STRING },
              commodityCategory: { type: Type.STRING },
              varietyName: { type: Type.STRING },
              quantity: { type: Type.NUMBER },
              unit: { type: Type.STRING },
              ratePerUnit: { type: Type.NUMBER },
              commissionPercent: { type: Type.NUMBER },
              laborCharge: { type: Type.NUMBER },
              rentCharge: { type: Type.NUMBER },
              summaryText: { type: Type.STRING },
            },
            required: [
              'farmerName',
              'farmerPhone',
              'farmerVillage',
              'commodityCategory',
              'varietyName',
              'quantity',
              'unit',
              'ratePerUnit',
            ],
          },
        },
      });

      let parsed = {};
      try {
        parsed = JSON.parse(response.text || '{}');
      } catch {}

      return res.json({ success: true, mode, result: parsed });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

/**
 * Setup Vite dev server middleware or serve production static assets
 */
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mandi Ledger server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
