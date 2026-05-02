export function checkEnv() {
  return {
    https_proxy: process.env.https_proxy,
    http_proxy: process.env.http_proxy,
    hasApiKey: !!process.env.BRAVE_API_KEY,
  };
}
