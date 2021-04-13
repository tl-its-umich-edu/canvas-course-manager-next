import * as path from 'path'
import * as webpack from 'webpack'
import { CleanWebpackPlugin } from 'clean-webpack-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'

const clientPath = path.resolve(__dirname, '..', 'client')

const commonConfig: webpack.Configuration = {
  optimization: { usedExports: true },
  entry: path.resolve(clientPath, 'src', 'index.tsx'),
  module: {
    rules: [
      {
        test: /\.(tsx|ts)?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: path.resolve(clientPath, 'tsconfig.json')
          }
        },
        exclude: /node_modules/
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource'
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(clientPath, 'public', 'index.html'),
      inject: 'body',
      title: 'Canvas Course Manager',
      favicon: path.resolve(clientPath, 'public', 'favicon.ico')
    }),
    new CleanWebpackPlugin({ cleanStaleWebpackAssets: false })
  ],
  output: {
    filename: '[name]-[chunkhash].js',
    path: path.resolve(__dirname, '..', 'dist', 'client'),
    publicPath: '/'
  }
}

export default commonConfig
