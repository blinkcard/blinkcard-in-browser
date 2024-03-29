import babel from '@rollup/plugin-babel'
import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from 'rollup-plugin-typescript2'
import { terser } from 'rollup-plugin-terser'

const bannerMsg = `/*! ****************************************************************************
Copyright (c) Microblink. All rights reserved.

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.
***************************************************************************** */`

const terserConfig = {
    compress: {
        pure_getters: true,
        unsafe: true,
        unsafe_comps: true,
        warnings: false
    }
}

const config = {
    worker: {
        preserveSymlinks: true,
        input: 'src/worker.ts',
        output: {
            file: 'resources/BlinkCardWasmSDK.worker.min.js',
            format: 'iife'
        },
        plugins: [
            nodeResolve(),
            typescript({ tsconfigOverride: { compilerOptions: { declaration: false, types: [] } } }),
            babel({ babelHelpers: 'bundled' }),
            terser(terserConfig)
        ]
    },
    cjs: {
        preserveSymlinks: true,
        input: 'src/index.ts',
        output: {
            file: 'lib/blinkcard-sdk.js',
            format: 'cjs',
            indent: false,
            banner: bannerMsg
        },
        plugins: [
            nodeResolve(),
            typescript({ useTsconfigDeclarationDir: true }),
            babel({ babelHelpers: 'bundled' }),
        ]
    },
    es: {
        preserveSymlinks: true,
        input: 'src/index.ts',
        output: {
            file: 'es/blinkcard-sdk.js',
            format: 'es',
            indent: false,
            sourcemap: true,
            banner: bannerMsg
        },
        plugins: [
            nodeResolve(),
            typescript({ tsconfigOverride: { compilerOptions: { declaration: false, sourceMap: true } } }),
            babel({ babelHelpers: 'bundled' }),
        ]
    },
    esModule: {
        preserveSymlinks: true,
        input: 'src/index.ts',
        output: {
            file: 'es/blinkcard-sdk.mjs',
            format: 'es',
            indent: false,
            banner: bannerMsg
        },
        plugins: [
            nodeResolve(),
            typescript({ tsconfigOverride: { compilerOptions: { declaration: false } } }),
            babel({ babelHelpers: 'bundled' }),
            terser(terserConfig),
        ]
    },
    umdDev: {
        preserveSymlinks: true,
        input: 'src/index.ts',
        output: {
            file: 'dist/blinkcard-sdk.js',
            format: 'umd',
            name: 'BlinkCardSDK',
            indent: false,
            sourcemap: true,
            banner: bannerMsg
        },
        plugins: [
            nodeResolve(),
            typescript({ tsconfigOverride: { compilerOptions: { declaration: false, sourceMap: true } } }),
            babel({ babelHelpers: 'bundled' }),
        ]
    },
    umdProd: {
        preserveSymlinks: true,
        input: 'src/index.ts',
        output: {
            file: 'dist/blinkcard-sdk.min.js',
            format: 'umd',
            name: 'BlinkCardSDK',
            indent: false,
            banner: bannerMsg
        },
        plugins: [
            nodeResolve(),
            typescript({ tsconfigOverride: { compilerOptions: { declaration: false } } }),
            babel({ babelHelpers: 'bundled' }),
            terser(terserConfig),
        ]
    }
}

export default [
    config.worker,
    config.cjs,
    config.es,
    config.esModule,
    config.umdDev,
    config.umdProd
]
