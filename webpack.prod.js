const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");
module.exports = {
    entry: './src/index.tsx',
    module: {
        rules: [{
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/
        },
        {
            test: /\.less$/,
            use: [
                {
                    loader: 'style-loader',
                },
                {
                    loader: 'css-loader',
                },
                {
                    loader: 'less-loader',
                    options: {
                        lessOptions: {
                            strictMath: true,
                            noIeCompat: true,
                        },
                    },
                },
            ],
        }]
    },
    resolve: {
        extensions: ['.ts', '.js', '.tsx']
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: "./node_modules/wa-sqlite/dist", to: "wasm" },
                { from: "./node_modules/rxdb-premium/dist/workers", to: "rxdb" }
            ],
        }),
    ],
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    mode: 'production'
};
