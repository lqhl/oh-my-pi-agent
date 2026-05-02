import * as http from "node:http";
import * as https from "node:https";
import { URL } from "node:url";

// 简单的代理支持，不依赖外部包
export function getProxyAgent(protocol: string): http.Agent | undefined {
  const proxyUrl = process.env.https_proxy || process.env.HTTPS_PROXY ||
                   process.env.http_proxy || process.env.HTTP_PROXY;
  
  if (!proxyUrl) return undefined;
  
  // 对于 HTTPS 请求，使用 CONNECT 隧道
  if (protocol === "https:") {
    return new https.Agent({
      // @ts-ignore
      createConnection: (options: any, callback: any) => {
        const proxy = new URL(proxyUrl);
        const socket = http.request({
          host: proxy.hostname,
          port: proxy.port || 80,
          method: "CONNECT",
          path: `${options.host}:${options.port}`,
          headers: {
            host: options.host,
          },
        });
        
        socket.on("connect", (res, sock) => {
          if (res.statusCode === 200) {
            callback(null, sock);
          } else {
            callback(new Error(`Proxy connection failed: ${res.statusCode}`));
          }
        });
        
        socket.on("error", callback);
        socket.end();
        return socket;
      }
    });
  }
  
  return undefined;
}
