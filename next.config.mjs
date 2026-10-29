/** @type {import('next').NextConfig} */
export default {
  // Static export: the output drops straight onto Cloudflare Pages,
  // the same way the current site is deployed. No server required.
  output: 'export',
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
  trailingSlash: true,
};
