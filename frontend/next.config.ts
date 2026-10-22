import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  turbopack: {
    root: path.resolve(__dirname),
  },
  async redirects() {
    return [
      {
        source: "/portal",
        destination: "/portal/dashboard",
        permanent: true,
      },
      {
        source: "/dashboard",
        destination: "/portal/dashboard",
        permanent: true,
      },
      {
        source: "/orders",
        destination: "/portal/orders",
        permanent: true,
      },
      {
        source: "/bulk-orders",
        destination: "/portal/bulk-orders",
        permanent: true,
      },
      {
        source: "/catalog",
        destination: "/portal/catalog",
        permanent: true,
      },
      {
        source: "/catalog/:path*",
        destination: "/portal/catalog/:path*",
        permanent: true,
      },
      {
        source: "/inventory",
        destination: "/portal/inventory",
        permanent: true,
      },
      {
        source: "/payments",
        destination: "/portal/payments",
        permanent: true,
      },
      {
        source: "/returns",
        destination: "/portal/returns",
        permanent: true,
      },
      {
        source: "/signup",
        destination: "/signup/seller",
        permanent: true,
      },
      {
        source: "/register-seller",
        destination: "/signup/seller",
        permanent: true,
      },
      {
        source: "/register-seller/:path*",
        destination: "/signup/seller/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
