import * as webpack from 'webpack'
import { merge } from 'webpack-merge'

import commonConfig from './webpack.common'

const devConfig: webpack.Configuration = merge(commonConfig, {
  mode: 'development',
  devtool: 'inline-source-map'
})

export default devConfig
