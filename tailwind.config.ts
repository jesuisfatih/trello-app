import type { Config } from 'tailwindcss';
import tailwindPlugin from './src/@core/tailwind/plugin';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  corePlugins: {
    preflight: false
  },
  important: '#__next',
  plugins: [tailwindPlugin],
  theme: {
    extend: {},
  },
};

export default config;

