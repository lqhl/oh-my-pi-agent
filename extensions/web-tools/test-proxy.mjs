import { HttpsProxyAgent } from "https-proxy-agent";
import https from "node:https";

const proxyUrl = process.env.https_proxy || process.env.HTTPS_PROXY ||
                 process.env.http_proxy || process.env.HTTP_PROXY;

console.log("Testing with proxy:", proxyUrl);
console.log("API Key present:", !!process.env.BRAVE_API_KEY);

const agent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;

const options = {
  hostname: "api.search.brave.com",
  path: "/res/v1/web/search?q=test&count=3",
  method: "GET",
  headers: {
    "X-Subscription-Token": process.env.BRAVE_API_KEY,
    "Accept": "application/json",
  },
  agent,
};

console.log("Sending request...");

const req = https.request(options, (res) => {
  console.log("Status:", res.statusCode);
  let data = "";
  res.on("data", chunk => data += chunk);
  res.on("end", () => {
    if (res.statusCode === 200) {
      const result = JSON.parse(data);
      const results = result.web?.results || [];
      console.log("SUCCESS! Found", results.length, "results");
      results.slice(0, 3).forEach((r, i) => console.log(`${i + 1}. ${r.title}`));
    } else {
      console.log("Error:", data.substring(0, 200));
    }
  });
});

req.on("error", (err) => console.log("Request error:", err.message));
req.on("timeout", () => { console.log("Timeout!"); req.destroy(); });
req.setTimeout(30000);
req.end();
