var path = require('path');
var webpack = require('webpack');

module.exports = {
    devtool: 'inline-source-map',
    entry  : [
        'babel-polyfill',
        './src/index'
    ],
    output : {
        path      : path.join(__dirname, 'dist'),
        filename  : 'bundle.js',
        publicPath: '/dist/'
    },
    plugins: [
        new webpack.OldWatchingPlugin()
    ],
    module : {
        loaders   : [{
            test   : /\.jsx?$/,
            exclude: /node_modules/,
            loader: 'babel',
            query: {
                presets: ['es2015', 'stage-0']
            },
            include: path.join(__dirname, 'src')
        }]
    }
};
