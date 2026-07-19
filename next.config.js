/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["openai"],
  turbopack: { root: __dirname },
}
module.exports = nextConfig

if (process.env.NODE_ENV === "development") {
  const { initOpenNextCloudflareForDev } = require("@opennextjs/cloudflare")
  initOpenNextCloudflareForDev()
}
