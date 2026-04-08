/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#11243a",
        mist: "#eff4f8",
        sand: "#f8efe1",
        accent: "#0f9d8f",
        coral: "#dd6b4d",
        navy: "#18314f"
      },
      boxShadow: {
        panel: "0 20px 45px rgba(17, 36, 58, 0.12)"
      }
    },
  },
  plugins: [],
};
