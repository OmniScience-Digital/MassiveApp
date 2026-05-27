/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {},
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-select",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-dropdown-menu",
      "aws-amplify",
      "@aws-amplify/ui-react",
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

module.exports = nextConfig;
