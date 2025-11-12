/** @type {import('next').NextConfig} */
const nextConfig = {
  webpackDevMiddleware: (config: { watchOptions: { ignored: string[]; }; }) => {
    config.watchOptions = {
      ignored: ['**/.next/**', '**/node_modules/**', '**/out/**', '**/build/**'],
    };
    return config;
  },
};

export default nextConfig;
