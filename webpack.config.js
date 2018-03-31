const webpack = require('webpack')
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin')

const env = process.env.NODE_ENV

const reactExternal = {
  root: 'React',
  commonjs2: 'react',
  commonjs: 'react',
  amd: 'react'
}

const immutableExternal = {
  root: 'Immutable',
  commonjs2: 'immutable',
  commonjs: 'immutable',
  amd: 'immutable'
}

const reduxExternal = {
  root: 'Redux',
  commonjs2: 'redux',
  commonjs: 'redux',
  amd: 'redux'
}

const reselectExternal = {
  root: 'Reselect',
  commonjs2: 'reselect',
  commonjs: 'reselect',
  amd: 'reselect'
}

const reactReduxExternal = {
  root: 'ReactRedux',
  commonjs2: 'react-redux',
  commonjs: 'react-redux',
  amd: 'react-redux'
}

const config = {
  externals: {
    react: reactExternal,
    redux: reduxExternal,
    immutable: immutableExternal,
    reselect: reselectExternal,
    'react-redux': reactReduxExternal
  },
  module: {
    loaders: [
      { test: /\.js$/, loaders: ['babel-loader'], exclude: /node_modules/ }
    ]
  },
  output: {
    library: 'ReduxSignal',
    libraryTarget: 'umd'
  },
  plugins: [
    new LodashModuleReplacementPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(env)
    })
  ]
}

if (env === 'production') {
  config.plugins.push(
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        pure_getters: true,
        unsafe: true,
        unsafe_comps: true,
        warnings: false
      }
    })
  )
}

module.exports = config
