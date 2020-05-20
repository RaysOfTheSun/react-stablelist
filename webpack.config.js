const path = require("path");
const SRC_DIR = path.join(__dirname, "./src");

module.exports = {
  mode: "production",
  entry: {
    main: path.join(SRC_DIR, "components", "list", "StableList.jsx")
  },
  output: {
    filename: "reactStableList.js",
    libraryTarget: "commonjs2"
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        include: SRC_DIR,
        loader: "babel-loader",
        options: {
          plugins: ["@babel/plugin-transform-runtime", "@babel/plugin-proposal-class-properties"],
          presets: ["@babel/preset-env", "@babel/preset-react"]
        }
      }
    ]
  }
};
