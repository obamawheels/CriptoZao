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

// ✅ Rate limiting: 100 requests per IP per minute
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100
});
app.use(limiter);

// ✅ Main proxy route (for all Solana JSON-RPC)
app.post("/", async (req, res) => {
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

app.get("/token-info", async (req, res) => {
  const poolAddress = "857wGRbkBN7uAKdsdzop4BCQ8ZPeqKX8x3v6JDPbpSnc"; // CRL pool
  const url = `https://api.geckoterminal.com/api/v2/networks/solana/pools/${poolAddress}`;

  try {
      const response = await fetch(url);
      const data = await response.json();
      res.json(data);
  } catch (error) {
      console.error("GeckoTerminal API error:", error);
      res.status(500).json({ error: "Failed to fetch token info" });
  }
});

app.get("/holders", async (req, res) => {
  const tokenAddress = "9AtC4cXKs7XUGCsoxPcEuMeig68MJwHpn6LXQCgF19DY";
  const url = `https://api.helius.xyz/v0/tokens/${tokenAddress}/holders`;

  try {
      const response = await fetch(url, {
          headers: {
              'X-API-KEY': process.env.HELIUS_API_KEY
          }
      });
      const data = await response.json();
      const holders = data.total; // ✅ the number you want

      res.json({ holders: holders });
  } catch (error) {
      console.error("Helius API error:", error);
      res.status(500).json({ error: "Failed to fetch holders" });
  }
});




