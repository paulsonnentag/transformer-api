import { TransformerTarget } from "./transformer";
import { Patch } from "@automerge/automerge";
import { createDefaultMapFromCDN, createSystem, createVirtualTypeScriptEnvironment } from "@typescript/vfs";
import ts from "typescript"

export interface Module {
  files: Record<string, string>
}

interface TypescriptCompilerConfig {
  compilerOptions: ts.CompilerOptions
}

export function getTypescriptCompiler ({ compilerOptions } : TypescriptCompilerConfig, target: TransformerTarget<Module>) : TransformerTarget<Module> {
  const fsMap: Map<String, String> = new Map()

  createDefaultMapFromCDN(compilerOptions, ts.version, true, ts).then(defaultFsMap => {
    for (const [key, value] of Object.entries(defaultFsMap)) {
      fsMap[key] = value
    }
  })

  const system = createSystem(fsMap)
  const env = createVirtualTypeScriptEnvironment(system, [], ts)

  return {
    onPatch(doc: Module, patches: Patch[]) {


      for (const patch of patches) {

        if (patch) {}

      }


    },

    onClose() {
      target.onClose()
    }
  }
}



