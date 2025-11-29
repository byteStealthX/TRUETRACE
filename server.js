import express from 'express';
import cors from 'cors';
import { ChatOpenAI } from '@langchain/openai';
import { TavilySearchResults } from '@langchain/community/tools/tavily_search';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';
import dotenv from 'dotenv';
import dns from 'dns/promises';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// OpenAI API Key Rotation
const OPENAI_KEYS = [
    process.env.OPENAI_API_KEY,
    process.env.OPENAI_API_KEY_2,
    process.env.OPENAI_API_KEY_3,
    process.env.OPENAI_API_KEY_4,
].filter(Boolean);

let currentKeyIndex = 0;

const getNextApiKey = () => {
    const key = OPENAI_KEYS[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % OPENAI_KEYS.length;
    return key;
};

// Initialize OpenAI model
const createModel = () => new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0.3,
    openAIApiKey: getNextApiKey(),
});

// Initialize Tavily Search
let tavilySearch = null;
if (process.env.TAVILY_API_KEY) {
    try {
        tavilySearch = new TavilySearchResults({
            apiKey: process.env.TAVILY_API_KEY,
            maxResults: 3,
        });
        console.log('✅ Tavily search enabled');
    } catch (error) {
        console.log('⚠️  Tavily search initialization failed:', error.message);
        console.log('   Continuing without Tavily search...');
    }
} else {
    console.log('⚠️  Tavily search disabled (no API key)');
}


// Define output schema
const outputSchema = z.object({
    riskLevel: z.enum(['HIGH', 'MEDIUM', 'LOW']).describe('The risk level of the URL'),
    verdict: z.string().describe('A brief summary of the threat assessment'),
    reasons: z.string().describe('Detailed explanation of why this URL is risky or safe'),
    tips: z.string().describe('Safety recommendations for the user'),
    sources: z.array(z.string()).describe('Optional sources or evidence'),
});

const parser = StructuredOutputParser.fromZodSchema(outputSchema);

// URL normalization
function normalizeUrl(url) {
    if (!url) return null;
    let normalized = url.trim().toLowerCase();
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
        normalized = 'https://' + normalized;
    }
    try {
        new URL(normalized);
        return normalized;
    } catch (error) {
        return null;
    }
}

// --- NEW FEATURE: Redirect Chain Resolver ---
async function resolveRedirects(url) {
    const chain = [];
    let currentUrl = url;
    let hops = 0;
    const maxHops = 10;

    try {
        while (hops < maxHops) {
            const response = await fetch(currentUrl, { method: 'HEAD', redirect: 'manual' });
            if (response.status >= 300 && response.status < 400) {
                const location = response.headers.get('location');
                if (!location) break;

                // Handle relative redirects
                const nextUrl = new URL(location, currentUrl).href;
                chain.push({ status: response.status, url: currentUrl, next: nextUrl });
                currentUrl = nextUrl;
                hops++;
            } else {
                chain.push({ status: response.status, url: currentUrl, final: true });
                break;
            }
        }
    } catch (error) {
        chain.push({ error: error.message, url: currentUrl });
    }
    return { finalUrl: currentUrl, chain };
}

// --- NEW FEATURE: DNS Verification ---
async function verifyDNS(hostname) {
    const records = {};
    try {
        const [a, mx, ns] = await Promise.allSettled([
            dns.resolve(hostname, 'A'),
            dns.resolve(hostname, 'MX'),
            dns.resolve(hostname, 'NS')
        ]);

        records.a = a.status === 'fulfilled' ? a.value : [];
        records.mx = mx.status === 'fulfilled' ? mx.value : [];
        records.ns = ns.status === 'fulfilled' ? ns.value : [];

        return { valid: a.status === 'fulfilled', records };
    } catch (error) {
        return { valid: false, error: error.message };
    }
}

// Main verification endpoint
app.post('/api/verify', async (req, res) => {
    try {
        const { url, context = '' } = req.body;

        if (!url) return res.status(400).json({ error: 'URL is required' });

        const normalizedUrl = normalizeUrl(url);
        if (!normalizedUrl) return res.status(400).json({ error: 'Invalid URL format' });

        // 1. Resolve Redirects
        const redirectData = await resolveRedirects(normalizedUrl);
        const finalUrl = redirectData.finalUrl;
        const domain = new URL(finalUrl).hostname;

        // 2. Verify DNS
        const dnsData = await verifyDNS(domain);

        // 3. Threat Intelligence Search
        let searchResults = [];
        let searchContext = '';
        if (tavilySearch) {
            try {
                const searchQuery = `${domain} phishing scam malicious threat`;
                const results = await tavilySearch.invoke(searchQuery);
                if (results && Array.isArray(results)) {
                    searchResults = results.map(r => ({ title: r.title, url: r.url, content: r.content }));
                    searchContext = searchResults.map(r => `${r.title}: ${r.content}`).join('\n');
                }
            } catch (e) {
                console.error('Tavily error:', e.message);
            }
        }

        // 4. AI Analysis
        const formatInstructions = parser.getFormatInstructions();
        const promptTemplate = PromptTemplate.fromTemplate(`
You are an expert cybersecurity analyst. Analyze this URL for threats.

URL: {url}
Final Destination: {finalUrl}
Redirect Chain: {redirectChain}
DNS Status: {dnsStatus}
Context: {context}

${searchContext ? `\nThreat Intelligence:\n{searchContext}\n` : ''}

Classify risk (HIGH/MEDIUM/LOW), provide verdict, reasons, and tips.
{format_instructions}
`);

        const prompt = await promptTemplate.format({
            url: normalizedUrl,
            finalUrl: finalUrl,
            redirectChain: JSON.stringify(redirectData.chain.map(c => c.status ? `${c.status} -> ${c.next || 'Final'}` : c.error)),
            dnsStatus: dnsData.valid ? 'Valid DNS Records' : 'Missing/Invalid DNS Records',
            context: context || 'None',
            searchContext: searchContext || '',
            format_instructions: formatInstructions,
        });

        const model = createModel();
        const response = await model.invoke(prompt);
        const parsed = await parser.parse(response.content);

        if (searchResults.length > 0) parsed.sources = searchResults.map(r => r.url);

        res.json({
            url: normalizedUrl,
            finalUrl,
            redirects: redirectData.chain,
            dns: dnsData,
            ...parsed,
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// --- NEW FEATURE: Batch Processing ---
// Helper function to process URLs with concurrency control
async function processBatch(urls, concurrency = 3) {
    const results = [];
    const queue = [...urls];

    async function processOne(url) {
        try {
            const normalizedUrl = normalizeUrl(url);
            if (!normalizedUrl) {
                return { url, error: 'Invalid URL format' };
            }

            const redirectData = await resolveRedirects(normalizedUrl);
            const finalUrl = redirectData.finalUrl;
            const domain = new URL(finalUrl).hostname;
            const dnsData = await verifyDNS(domain);

            // Skip Tavily search in batch mode for speed
            const formatInstructions = parser.getFormatInstructions();
            const promptTemplate = PromptTemplate.fromTemplate(`
You are an expert cybersecurity analyst. Analyze this URL for threats.

URL: {url}
Final Destination: {finalUrl}
DNS Status: {dnsStatus}

Classify risk (HIGH/MEDIUM/LOW), provide verdict, reasons, and tips.
{format_instructions}
`);

            const prompt = await promptTemplate.format({
                url: normalizedUrl,
                finalUrl: finalUrl,
                dnsStatus: dnsData.valid ? 'Valid DNS Records' : 'Missing/Invalid DNS Records',
                format_instructions: formatInstructions,
            });

            const model = createModel();
            const response = await model.invoke(prompt);
            const parsed = await parser.parse(response.content);

            return {
                url: normalizedUrl,
                finalUrl,
                redirects: redirectData.chain,
                dns: dnsData,
                ...parsed,
            };
        } catch (error) {
            return { url, error: error.message };
        }
    }

    // Process with concurrency limit
    while (queue.length > 0 || results.length < urls.length) {
        const batch = queue.splice(0, concurrency);
        const batchResults = await Promise.all(batch.map(processOne));
        results.push(...batchResults);
    }

    return results;
}

// Batch verification endpoint
app.post('/api/verify/batch', async (req, res) => {
    try {
        const { urls } = req.body;

        if (!urls || !Array.isArray(urls)) {
            return res.status(400).json({ error: 'URLs array is required' });
        }

        if (urls.length === 0) {
            return res.status(400).json({ error: 'URLs array cannot be empty' });
        }

        if (urls.length > 100) {
            return res.status(400).json({ error: 'Maximum 100 URLs allowed per batch' });
        }

        const results = await processBatch(urls);

        res.json({
            total: urls.length,
            processed: results.length,
            results,
        });

    } catch (error) {
        console.error('Batch error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

app.get('/health', (req, res) => res.json({ status: 'healthy', version: '2.0.0' }));

// Root endpoint with API documentation
app.get('/', (req, res) => {
    res.json({
        service: 'AntiGravity Backend v2',
        version: '2.0.0',
        features: [
            'AI-powered threat detection',
            'Redirect chain resolution',
            'DNS verification',
            'Batch processing (up to 100 URLs)',
            'Browser extension support (CORS enabled)'
        ],
        endpoints: {
            verify: 'POST /api/verify',
            batch: 'POST /api/verify/batch',
            health: 'GET /health'
        }
    });
});

app.listen(PORT, () => {
    console.log(`🚀 AntiGravity Backend v2 running on port ${PORT}`);
    console.log(`📡 Single verify: POST /api/verify`);
    console.log(`📦 Batch verify: POST /api/verify/batch`);
    console.log(`💚 Health check: GET /health`);
});

export default app;
