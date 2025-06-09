
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser  from '@rollup/plugin-terser';

export default {
    input: 'assets/javascripts/app.js',
    output: {
        file: 'public/javascripts/application.js',
        format: 'esm',
        sourcemap: true,
    },
    plugins: [
        nodeResolve(),
        commonjs(),
        terser()
    ],
};
