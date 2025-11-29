# API Documentation - AntiGravity Backend v2

## Overview
AntiGravity is an AI-powered URL threat detection API with advanced features including redirect resolution, DNS verification, and batch processing.

## Base URL
```
http://localhost:3000
```

---

## Endpoints

### 1. Single URL Verification
**POST** `/api/verify`

Analyzes a single URL for security threats.

#### Request Body
```json
{
  "url": "https://suspicious-link.com",
  "context": "Received via SMS" // optional
}
```

#### Response
```json
{
  "url": "https://suspicious-link.com",
  "finalUrl": "https://actual-destination.com",
  "redirects": [
    { "status": 301, "url": "https://suspicious-link.com", "next": "https://actual-destination.com" },
    { "status": 200, "url": "https://actual-destination.com", "final": true }
  ],
  "dns": {
    "valid": true,
    "records": {
      "a": ["192.0.2.1"],
      "mx": [{ "exchange": "mail.example.com", "priority": 10 }],
      "ns": ["ns1.example.com"]
    }
  },
  "riskLevel": "HIGH",
  "verdict": "Likely phishing attempt",
  "reasons": "Domain mimics legitimate service...",
  "tips": "Do not enter credentials...",
  "sources": []
}
```

---

### 2. Batch URL Verification
**POST** `/api/verify/batch`

Analyzes multiple URLs at once (up to 100).

#### Request Body
```json
{
  "urls": [
    "https://example.com",
    "https://bit.ly/abc123",
    "https://suspicious-site.com"
  ]
}
```

#### Response
```json
{
  "total": 3,
  "processed": 3,
  "results": [
    {
      "url": "https://example.com",
      "finalUrl": "https://example.com",
      "redirects": [...],
      "dns": {...},
      "riskLevel": "LOW",
      "verdict": "...",
      "reasons": "...",
      "tips": "..."
    },
    // ... more results
  ]
}
```

**Notes:**
- Maximum 100 URLs per batch
- Processes 3 URLs concurrently for optimal performance
- Tavily search is disabled in batch mode for speed

---

### 3. Health Check
**GET** `/health`

Returns server status.

#### Response
```json
{
  "status": "healthy",
  "version": "2.0.0"
}
```

---

### 4. API Info
**GET** `/`

Returns API information and available endpoints.

---

## Features

### 🔗 Redirect Chain Resolution
- Follows HTTP 3xx redirects automatically
- Analyzes the final destination, not just the initial URL
- Detects redirect loops (max 10 hops)

### 🌐 DNS Verification
- Checks for valid A, MX, and NS records
- Flags domains with missing DNS as suspicious
- Helps identify newly registered or fake domains

### 🤖 AI-Powered Analysis
- Uses GPT-4o-mini for threat classification
- Analyzes URL structure, patterns, and context
- Provides human-readable explanations

### 📦 Batch Processing
- Process up to 100 URLs at once
- Concurrency control (3 simultaneous requests)
- Ideal for bulk verification

### 🌍 Browser Extension Support
- CORS enabled for cross-origin requests
- Stateless design (no authentication required)

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "URL is required"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "details": "Error message here"
}
```

---

## Usage Examples

### cURL - Single Verification
```bash
curl -X POST http://localhost:3000/api/verify \
  -H "Content-Type: application/json" \
  -d '{"url": "https://bit.ly/suspicious"}'
```

### cURL - Batch Verification
```bash
curl -X POST http://localhost:3000/api/verify/batch \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://google.com",
      "https://bit.ly/test123",
      "https://suspicious-domain.xyz"
    ]
  }'
```

### JavaScript (Browser Extension)
```javascript
async function checkURL(url) {
  const response = await fetch('http://localhost:3000/api/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  return await response.json();
}
```

---

## Rate Limits
Currently no rate limits are enforced. For production use, consider implementing:
- Per-IP rate limiting
- API key authentication
- Request throttling
