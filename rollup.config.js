import ts from "@wessberg/rollup-plugin-ts";
import path from "path";
import nodeResolve from "rollup-plugin-node-resolve";
import { terser } from "rollup-plugin-terser";

const extensions = [".ts", ".tsx"];

function isExternal(id) {
  return id.startsWith(".") === false && path.isAbsolute(id) === false;
}

export default function configureRollup() {
	return [
		// CJS:
		{
			input: "src/index.ts",
			output: { file: `dist/cjs/index.js`, format: "cjs", compact: true },
			external: isExternal,
			plugins: [
				nodeResolve({ extensions }),
				ts({
					transpiler: "babel",
				}),
			],
		},
		{
			input: "src/index.ts",
			output: { file: `dist/cjs/index.min.js`, format: "cjs", compact: true },
			external: isExternal,
			plugins: [
				nodeResolve({ extensions }),
				ts({
					transpiler: "babel",
				}),
				terser(),
			],
		},
		// ESM:
		{
			input: "src/index.ts",
			output: { file: `dist/esm/index.js`, format: "esm" },
			external: isExternal,
			plugins: [
				nodeResolve({ extensions }),
				ts({
					transpiler: "babel",
				}),
			],
		},
	];
}
