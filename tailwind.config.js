/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          midnight: "#070612",
          indigo: "#120B40",
          slate: "#647684",
          accent: "#ED8335",
          white: "#FEFEFE"
        }
      },
      boxShadow: {
        "card-glow": "0 24px 48px rgba(18, 11, 64, 0.45)"
      },
      fontFamily: {
        sans: ["Inter", "SF Pro Display", "Segoe UI", "system-ui", "-apple-system", "sans-serif"]
      }
    }
  },
  plugins: []
};
