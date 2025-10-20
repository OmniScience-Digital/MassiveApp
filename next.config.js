/** @type {import('next').NextConfig} */
 const nextConfig = {
  api: {
    bodyParser: {
      sizeLimit: '16mb',
    },
    responseLimit: '16mb',
    externalResolver: true,
  },
}

module.exports = nextConfig;
