import path from 'node:path'
import * as webpack from 'webpack'
import BundleTrackerPlugin from 'webpack-bundle-tracker'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'

const __dirname = import.meta.dirname
const frontendPath = path.resolve(__dirname, '..')

const commonConfig: webpack.Configuration = {
  optimization: { usedExports: true },
  context: frontendPath,
  entry: path.resolve('client','src', 'index.tsx'),
  module: {
    rules: [
      {
        test: /\.(tsx|ts)?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: path.resolve(frontendPath, 'tsconfig.json')
          }
        },
        exclude: /node_modules/
      },
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader']
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource'
      }
    ]
  },
  resolve: {
    modules: ['node_modules'],
    extensions: ['.tsx', '.ts', '.js'],
    extensionAlias: {
      '.js': ['.ts', '.js', '.tsx', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    },
  },
  plugins: [
    new BundleTrackerPlugin({ path: frontendPath, filename: 'webpack-stats.json' }),
    new MiniCssExtractPlugin({
      filename: '[name]-[fullhash].css',
      chunkFilename: '[name]-[chunkhash].css',
    })
  ],
  output: {
    path: path.resolve('./bundles/'),
    filename: '[name]-[chunkhash].js',
    chunkFilename: '[name]-[chunkhash].js'
  }
}

export default commonConfig
