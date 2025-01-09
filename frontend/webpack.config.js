const path = require("path");

module.exports = {
  entry: "./agoraLogic.js", // Entry point for the app
  output: {
    filename: "bundledAgoraLogic.js", // Output file name
    path: path.resolve(__dirname, "./dist"), // Output folder
  },
  devServer: {
    static: {
      directory: path.join(__dirname, "./"), // Serving static files from the root folder
    },
    compress: true, // Enable gzip compression
    port: 9000, // Port to serve the app on
    host: "0.0.0.0", // Allow access from external devices (such as ngrok)
    allowedHosts: "all", // Allow all hosts, including ngrok URL
    open: true, // Open the browser automatically
  },
};
