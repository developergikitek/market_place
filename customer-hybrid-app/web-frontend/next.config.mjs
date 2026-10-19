/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Android emulator reaches the dev server via 10.0.2.2, physical devices via LAN IP.
  // Without this, Next.js blocks dev resources for the WebView and the page never hydrates.
  allowedDevOrigins: ['10.0.2.2', '192.168.1.69', '*.local'],
  experimental: {
    // Keep visited and prefetched pages in the client cache for 5 minutes, so going back
    // to a tab renders from memory instead of refetching from the server (dynamic default is 0).
    staleTimes: {
      dynamic: 300,
      static: 300,
    },
  },
};

export default nextConfig;
