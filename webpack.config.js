const path = require('path');
const slsw = require('serverless-webpack');
const nodeExternals = require('webpack-node-externals');
const ESLintPlugin = require('eslint-webpack-plugin');

module.exports = {
	name: 'learn-serverless',
	devtool: 'source-map',
	target: 'node',
	mode: slsw.lib.webpack.isLocal ? 'development' : 'production',
	entry: slsw.lib.entries,
	externals: [nodeExternals(), /aws-sdk/],
	module: {
		rules: [
			{
				test: /\.m?js$/,
				include: __dirname,
				exclude: /node_modules/,
				use: { loader: 'babel-loader' }
			}
		]
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, 'src', 'lib')
		}
	},
	plugins: [new ESLintPlugin({ exclude: 'node_modules' })]
};
