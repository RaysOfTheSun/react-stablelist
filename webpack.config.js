const path = require("path");
const SRC_DIR = path.join(__dirname, "./build");
const STYLES_DIR = path.resolve("./src", "styles");

module.exports = {
  mode: "production",
  entry: {
    main: path.join(SRC_DIR, "StableList.jsx"),
  },
  output: {
    filename: "./reactStableList.js",
    libraryTarget: "commonjs2",
  },
  resolve: {
    alias: {
      styles: STYLES_DIR,
    },
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        include: SRC_DIR,
        loader: "babel-loader",
        resolve: { extensions: [".js", ".jsx"] },
        options: {
          plugins: ["@babel/plugin-transform-runtime", "@babel/plugin-proposal-class-properties"],
          presets: ["@babel/preset-env", "@babel/preset-react"],
        },
      },
      {
        test: /\.scss$/,
        use: ["style-loader", "css-loader", "sass-loader"],
      },
    ],
  },
};
