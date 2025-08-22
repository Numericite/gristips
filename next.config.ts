import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.woff2$/,
      type: "asset/resource",
    });
    return config;
  },
  transpilePackages: ["@codegouvfr/react-dsfr", "tss-react"],
};

export default nextConfig;
