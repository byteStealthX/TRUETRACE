# AntiGravity Backend v2 🚀

Enterprise-grade AI-powered URL threat detection with advanced security features.

## ✨ Features

### 🤖 AI-Powered Threat Detection
- GPT-4o-mini for intelligent URL analysis
- Context-aware phishing detection
- Human-readable explanations

### 🔗 Redirect Chain Resolution
- Automatically follows URL shorteners (bit.ly, tinyurl, etc.)
- Analyzes final destination, not just initial link
- Detects redirect loops and suspicious chains

### 🌐 DNS Verification
- Validates domain existence
- Checks A, MX, and NS records
- Flags domains with missing/invalid DNS

### 📦 Batch Processing
- Process up to 100 URLs at once
- Concurrency control for optimal performance
- Perfect for bulk verification

### 🔌 Browser Extension Ready
- CORS enabled for cross-origin requests
- Stateless API design
- No authentication required

### 🔍 Optional Tavily Integration
- Real-time threat intelligence
- Web search for known threats
- Enhanced detection accuracy

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.template .env
# Edit .env and add your OPENAI_API_KEY
```

### 3. Start Server
```bash
npm start
```

Server runs on `http://localhost:3000`

---

## 📡 API Endpoints

### Single URL Verification
```bash
POST /api/verify
{
  "url": "https://suspicious-link.com",
  "context": "Received via SMS" // optional
}
```

### Batch Verification
```bash
POST /api/verify/batch
{
  "urls": ["https://url1.com", "https://url2.com", ...]
}
```

**See [API_DOCS.md](./API_DOCS.md) for complete documentation.**

---

## 🧪 Testing

### Test Single URL
```bash
curl -X POST http://localhost:3000/api/verify \
  -H "Content-Type: application/json" \
  -d '{"url": "https://google.com"}'
```

### Test Batch Processing
```bash
curl -X POST http://localhost:3000/api/verify/batch \
  -H "Content-Type: application/json" \
  -d '{"urls": ["https://google.com", "https://github.com"]}'
```

---

## 📦 What's New in v2

- ✅ **Redirect Chain Resolver** - Follows URL shorteners to final destination
- ✅ **DNS Verification** - Validates domain existence and records
- ✅ **Batch Processing** - Analyze up to 100 URLs at once
- ✅ **Enhanced API** - More detailed response with redirect and DNS data
- ✅ **Browser Extension Support** - CORS enabled for extensions

---

## 🔧 Configuration

### Environment Variables
```bash
OPENAI_API_KEY=sk-...        # Required
TAVILY_API_KEY=tvly-...      # Optional (for enhanced search)
PORT=3000                     # Optional (default: 3000)
NODE_ENV=development          # Optional
```

### Multiple OpenAI Keys (Optional)
For higher rate limits, add multiple keys:
```bash
OPENAI_API_KEY=sk-key1
OPENAI_API_KEY_2=sk-key2
OPENAI_API_KEY_3=sk-key3
```

---

## 📚 Documentation
- [API_DOCS.md](./API_DOCS.md) - Complete API reference
- [.env.template](./.env.template) - Environment configuration

---

## 🛡️ Security & Privacy
- ✅ Stateless design (no data storage)
- ✅ No logging of user URLs
- ✅ CORS enabled for browser extensions
- ✅ Privacy-first architecture

---

## 🚀 Deployment
Works on:
- Render
- Vercel (with serverless adaptation)
- Railway
- Any Node.js hosting

---

## 📄 License
MIT

---

**Built with ❤️ for a safer internet**
