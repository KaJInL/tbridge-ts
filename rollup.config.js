import typescript from "rollup-plugin-typescript2";

export default {
    input: "src/index.ts", // 入口文件
    output: [
        {
            file: "dist/index.cjs.js",
            format: "cjs", // CommonJS
            sourcemap: true
        },
        {
            file: "dist/index.esm.js",
            format: "esm", // ESM
            sourcemap: true
        }
    ],
    plugins: [typescript({ tsconfig: "./tsconfig.json" })]
};
