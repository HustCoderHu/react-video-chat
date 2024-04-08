/* eslint-disable @typescript-eslint/no-var-requires */
/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n: {
    locales: ['en', 'zh-cn'], // 'fr', 'es', 'de', 'it', 'ja', 'ko', 'ru', 'zh-cn', 'zh-tw'],
    defaultLocale: 'en',
    localeDetection: true
  },
  reactStrictMode: true,
  swcMinify: true
  // output: 'standalone'
  // distDir: 'z:/coding/github/react_webrtc_nextjs'
  // cleanDistDir: 'z:/coding/github/react_webrtc_nextjs',
};

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  sw: '/sw.js'
});

module.exports = nextConfig; //withPWA(nextConfig);
