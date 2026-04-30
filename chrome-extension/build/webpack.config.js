const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')

module.exports = (env, argv) => ({
  mode: argv.mode || 'development',
  devtool: argv.mode === 'production' ? false : 'cheap-module-source-map',

  entry: {
    'background/service-worker': './background/service-worker.ts',
    'popup/popup': './popup/popup.ts',
    'content/linkedin': './content/linkedin.ts',
    'content/gmail': './content/gmail.ts',
  },

  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: '[name].js',
    clean: true,
  },

  resolve: {
    extensions: ['.ts', '.js'],
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: path.resolve(__dirname, 'tsconfig.json'),
          },
        },
        exclude: /node_modules/,
      },
    ],
  },

  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'popup/popup.html', to: 'popup/popup.html' },
        { from: 'popup/popup.css', to: 'popup/popup.css' },
        { from: 'options/options.html', to: 'options/options.html' },
        { from: 'content/linkedin.css', to: 'content/linkedin.css' },
        { from: 'content/gmail.css', to: 'content/gmail.css' },
        { from: 'icons', to: 'icons', noErrorOnMissing: true },
      ],
    }),
  ],

  optimization: {
    minimize: argv.mode === 'production',
  },
})
