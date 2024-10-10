// webpack.config.js
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const projectRootPath = path.resolve(
    __dirname,
    './' // path from webpack-config to the root folder of the repo
);
const baseDir = './dist/workers/'; // output path
module.exports = {
    target: 'webworker',
    entry: {
        'opfs.worker': projectRootPath + '/src/worker/opfs.worker.ts',
    },
    output: {
        filename: '[name].js',
        clean: true,
        path: path.resolve(
            projectRootPath,
            'dist/workers'
        ),
    },
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.ts$/, // Apply this rule to .ts files
                exclude: /node_modules/, // Exclude node_modules
                use: 'ts-loader', // Use ts-loader to handle TypeScript files
            }
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.mjs', '.mts']
    },
    optimization: {
        moduleIds: 'deterministic',
        minimize: true,
        minimizer: [new TerserPlugin({
            terserOptions: {
                format: {
                    comments: false,
                },
            },
            extractComments: false,
        })],
    }
};
