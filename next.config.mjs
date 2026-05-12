/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'pdfjs-dist'],
    outputFileTracingIncludes: {
      '/api/report': [
        './node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2',
      ],
    },
  },
};

export default nextConfig;
