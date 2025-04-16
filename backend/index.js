import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ✅ Optional: Only allow safe methods
const ALLOWED_METHODS = [
  "getBalance",
  "getTokenAccountsByOwner",
  "getRecentBlockhash",
  "getTokenSupply",
  "getParsedTokenAccountsByOwner",
  "getAccountInfo",
  "getProgramAccounts"
];

// ✅ Rate limiting: 100 requests per IP per minute
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100
});
app.use(limiter);

// ✅ Main proxy route (mimics real RPC)
app.post("/", async (req, res) => {
  const method = req.body?.method;
  if (!ALLOWED_METHODS.includes(method)) {
    return res.status(403).json({ error: "RPC method not allowed." });
  }

  try {
    const response = await fetch(process.env.QUICKNODE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({ error: "Proxy failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy running at http://localhost:${PORT}`);
});
