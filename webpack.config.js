const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");
module.exports = (env) => {
    return {
        mode: 'development',
        entry: {
            xnwebglglobal: {
                import: './src/xnwebglglobal.js',
            }
        },
        // devtool:'eval-source-map',//追踪错误源码
        devtool: env.production ? 'source-map' : 'eval-source-map',//追踪错误源码
        devServer: {
            contentBase: './dist',
        },
        plugins: [
            new CleanWebpackPlugin({cleanStaleWebpackAssets: true}),
            // new MiniCssExtractPlugin({
            //     filename: '[name].css',
            //     chunkFilename: '[id].css',
            // }),
            new HtmlWebpackPlugin({
                template: './index.html',
            }),
            new UglifyJsPlugin(),
            new CopyPlugin({
                patterns: [
                    {
                        from: path.resolve(__dirname, './static'),
                        to: 'static',
                    },
                ],
            }),
        ],
        output: {
            filename: '[name].min.js',
            path: path.resolve(__dirname, 'dist'),
            // publicPath: '/',
            environment: {//输出es5的语法，用于兼容ie
                // The environment supports arrow functions ('() => { ... }').
                arrowFunction: false,
                // The environment supports BigInt as literal (123n).
                bigIntLiteral: false,
                // The environment supports const and let for variable declarations.
                const: false,
                // The environment supports destructuring ('{ a, b } = obj').
                destructuring: false,
                // The environment supports an async import() function to import EcmaScript modules.
                dynamicImport: false,
                // The environment supports 'for of' iteration ('for (const x of array) { ... }').
                forOf: false,
                // The environment supports ECMAScript Module syntax to import ECMAScript modules (import ... from '...').
                module: false,
            }
        },
        optimization: {},
        module: {
            rules: [
                {
                    test: /\.js$/,
                    loader: "babel-loader",
                    options: {
                        presets: [
                            ['babel-preset-env', {
                                targets: {
                                    browsers: ['> 1%']
                                },
                                debug: false
                            }]
                        ]
                    }
                },
                {
                    test: /\.css$/i,
                    use: ['style-loader', 'css-loader'],
                },
                {
                    test: /\.(png|svg|jpg|jpeg|gif|json)$/i,
                    use: {
                        loader: 'file-loader',
                        options: {
                            name: 'img/[name].[ext]'
                        }
                    }

                },
                // {
                //     test: /\.(jpg|png|gif)$/i,  //i表示忽略图片格式大小写，例如.PNG
                //     use: [{
                //         loader: 'url-loader',  // url-loader依赖于file-loader所以这两个包都需要下载
                //         options:{
                //             limit: 10*1024, //如果图片小于10k，就使用base64处理，
                //         }
                //     }]
                // }
            ],
        },
    }
};
