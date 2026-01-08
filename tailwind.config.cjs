module.exports = {
  content: ["./src/renderer/**/*.{ts,tsx,html}"] ,
  theme: {
    extend: {
      fontFamily: {
        display: ["\"Space Grotesk\"", "\"IBM Plex Sans\"", "Segoe UI", "sans-serif"],
        body: ["\"IBM Plex Sans\"", "\"Space Grotesk\"", "Segoe UI", "sans-serif"]
      },
      colors: {
        ink: {
          900: "#0d0f12",
          800: "#161a20",
          700: "#1f2630",
          600: "#2b3442",
          500: "#3c495b",
          400: "#56657a",
          300: "#7a8aa1",
          200: "#a9b4c3",
          100: "#dde3ec"
        },
        accent: {
          500: "#ff7a59",
          600: "#e56344",
          700: "#c55337"
        },
        mint: {
          500: "#45c2a4",
          600: "#34a38a"
        }
      },
      boxShadow: {
        glow: "0 12px 40px rgba(255, 122, 89, 0.25)",
        soft: "0 18px 50px rgba(13, 15, 18, 0.12)"
      },
      keyframes: {
        floaty: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" }
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0px)" }
        }
      },
      animation: {
        floaty: "floaty 8s ease-in-out infinite",
        fadeInUp: "fadeInUp 500ms ease-out"
      }
    }
  },
  plugins: []
};
