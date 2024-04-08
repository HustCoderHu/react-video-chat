// import typescript from '@rollup/plugin-typescript';
// import { nodeResolve } from '@rollup/plugin-node-resolve';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
// import { terser } from 'rollup-plugin-terser';
import terser from '@rollup/plugin-terser';

export default {
  input: './out_tsc/src/server.js', // 你的项目入口文件
  output: {
    dir: 'rollup_dist_min',
    // file: 'dist/server.js', // 输出文件
    format: 'cjs', // 输出格式，CommonJS
    // sourcemap: true // 生成 source map 文件
  },
  plugins: [
    // typescript(),
    // resolve(),
    json(),
    // nodeResolve(), // 解析模块
    resolve(),
    commonjs(),
    // commonjs({
    //   include: ['node_modules/**', 'src/**']
    // }), // 将 CommonJS 转换为 ES6
    // typescript()
    terser()
  ]
};