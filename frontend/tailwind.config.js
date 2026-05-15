/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Playfair Display'", "Georgia", "serif"],
        body: ["'Lora'", "Georgia", "serif"],
        hindi: ["'Tiro Devanagari Hindi'", "serif"],
        mono: ["'JetBrains Mono'", "monospace"],
        ui: ["'DM Sans'", "sans-serif"],
      },
      colors: {
        ink: {
          50: "#faf8f5",
          100: "#f2ede4",
          200: "#e0d5c3",
          300: "#c8b99a",
          400: "#a89070",
          500: "#8a7055",
          600: "#6e5840",
          700: "#574432",
          800: "#3d3024",
          900: "#26201a",
          950: "#15110e",
        },
        saffron: {
          400: "#f5a623",
          500: "#e8920a",
          600: "#c97a00",
        },
        crimson: {
          400: "#e05454",
          500: "#c93333",
          600: "#a82020",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease forwards",
        "slide-up": "slideUp 0.5s ease forwards",
        "scale-in": "scaleIn 0.4s ease forwards",
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: "translateY(24px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        scaleIn: { from: { opacity: 0, transform: "scale(0.95)" }, to: { opacity: 1, transform: "scale(1)" } },
      },
      typography: (theme) => ({
        ink: {
          css: {
            "--tw-prose-body": theme("colors.ink[800]"),
            "--tw-prose-headings": theme("colors.ink[900]"),
            "--tw-prose-links": theme("colors.saffron[600]"),
            fontFamily: theme("fontFamily.body").join(", "),
          },
        },
      }),
    },
  },
  plugins: [],
};
