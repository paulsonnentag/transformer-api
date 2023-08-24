import { TransformerTarget } from "./api";
import * as automerge from "@automerge/automerge";
import { createDefaultMapFromCDN, createSystem, createVirtualTypeScriptEnvironment } from "@typescript/vfs";
import ts from "typescript"
import { applyPatch } from "../utils";

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

  let outputModule = automerge.change<Module>(automerge.init(), (module) => {
    module.files = {}
  })

  return {
    patch(inputModule: Module, patches: automerge.Patch[]) {
      let oldHeads = automerge.getHeads(outputModule)
      outputModule = automerge.change(outputModule, (outputModule) => {

        for (const patch of patches) {

          if (patch.path.length >= 2  && patch.path[0] === "files") {
            const fileName = patch.path[1].toString()

            switch (patch.action) {
              case "put": {
                const newSource = inputModule.files[fileName]

                // ignore patch if source no longer exists
                // this can happen if a subsequent delete patch has deleted the file
                if (!newSource) {
                  continue
                }

                if (fileName.endsWith(".ts")) {
                  if (fsMap.has(fileName)) {
                    env.updateFile(fileName, newSource.toString())
                  } else {
                    env.createFile(fileName, newSource.toString())
                  }

                  const outputFiles = env.languageService.getEmitOutput(fileName).outputFiles
                  for (const outputFile of outputFiles) {
                    outputModule.files[outputFile.name] = outputFile.text
                  }
                } else if (inputModule.files[fileName]) {
                  outputModule.files[fileName] = newSource
                }
                break;
              }

              case "del":
                if (fileName.endsWith(".ts") && fsMap.has(fileName)) {
                  env.updateFile(fileName, "") // hack: virtual env has no method to delete files
                }

                delete outputModule.files[fileName]
                break;
            }
          } else {
            applyPatch(outputModule, patch)
          }
        }
      })

      const outputPatches = automerge.diff(outputModule, oldHeads, automerge.getHeads(outputModule))
      target.patch(outputModule, outputPatches)
    },

    close() {
      target.close()
    }
  }
}



