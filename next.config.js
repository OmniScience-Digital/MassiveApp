/** @type {import('next').NextConfig} */

const nextConfig = {
  api: {
    bodyParser: {
      sizeLimit: '15mb', // Adjust this based on your needs
    },
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb', // Increase for server actions if needed
    },
  },
   // Specifies the maximum allowed duration for this function to execute (in seconds)
  maxDuration: 60,
};
export default nextConfig;
module.exports = nextConfig;
