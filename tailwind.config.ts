import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { ink: "#172033", ocean: "#0d4b6e", mint: "#19a974" },
    },
  },
  plugins: [],
} satisfies Config;
