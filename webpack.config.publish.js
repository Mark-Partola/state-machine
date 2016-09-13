var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry    : [
    './src/StateMachine.js'
  ],
  output   : {
    path         : path.join(__dirname, 'public'),
    libraryTarget: 'umd',
    library      : 'StateMachine',
    filename     : 'index.js',
    publicPath   : '/public/'
  },
  externals: {
    "graphlib"     : "graphlib",
    "promise-defer": "promise-defer"
  },
  plugins  : [
    new webpack.OldWatchingPlugin()
  ],
  module   : {
    loaders: [{
      test   : /\.jsx?$/,
      exclude: /node_modules/,
      loader : 'babel',
      query  : {
        presets: ['es2015', 'stage-0']
      },
      include: path.join(__dirname, 'src')
    }]
  }
}
;
