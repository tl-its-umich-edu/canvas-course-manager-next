import * as webpack from 'webpack'
import { merge } from 'webpack-merge'

import commonConfig from './webpack.common.js'

const prodConfig: webpack.Configuration = merge(commonConfig, {
  mode: 'production',
  devtool: 'source-map'
})

export default prodConfig
