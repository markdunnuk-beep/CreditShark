import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}"
  ],
  corePlugins: {
    preflight: false
  },
  theme: {
    extend: {
      colors: {
        creditshark: {
          navy: "#0D2B45",
          teal: "#1CA3A6",
          aqua: "#6DD1D6",
          mist: "#F0F2F4",
          white: "#FAFBFC",
          ink: "#17212B",
          muted: "#5F6B76",
          border: "#D8E7EA",
          surface: "#FFFFFF",
          warm: "#FBF8F2"
        },
        risk: {
          low: "#1F9D65",
          moderate: "#E9A23B",
          elevated: "#B7791F",
          high: "#D94C4C"
        }
      },
      borderRadius: {
        creditshark: "16px"
      },
      boxShadow: {
        creditshark: "0 18px 50px rgba(6, 43, 63, 0.08)"
      },
      fontFamily: {
        sans: ["Inter", "Arial", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
