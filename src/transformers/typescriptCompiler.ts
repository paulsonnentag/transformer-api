import { applyPatch, TransformerTarget, withOutputDoc } from "./lib";
import {
  createDefaultMapFromCDN,
  createSystem,
  createVirtualTypeScriptEnvironment,
  VirtualTypeScriptEnvironment
} from "@typescript/vfs";
import ts from "typescript"
import { Simulate } from "react-dom/test-utils";
import input = Simulate.input;

export interface Module {
  files: Record<string, string>
}

interface TypescriptCompilerConfig {
  compilerOptions: ts.CompilerOptions
}

export function getTypescriptCompiler({ compilerOptions }: TypescriptCompilerConfig, target: TransformerTarget<Module>): TransformerTarget<Module> {
  const fsMap: Map<string, string> = new Map()

  createDefaultMapFromCDN(compilerOptions, ts.version, true, ts).then(defaultFsMap => {
    for (const [key, value] of Object.entries(defaultFsMap)) {
      fsMap[key] = value
    }
  })

  const system = createSystem(fsMap)
  const env = createVirtualTypeScriptEnvironment(system, [], ts)

  return withOutputDoc({
    target,
    patch(inputModule, patches, changeOutputDoc) {
      changeOutputDoc((outputModule) => {
        for (const patch of patches) {

          if (patch.path.length >= 2 && patch.path[0] === "files") {
            const fileName = patch.path[1].toString()

            switch (patch.action) {
              case "put": {
                updateFile(env, fsMap, inputModule, outputModule, fileName)
                break;
              }

              case "del":
                if (fileName.endsWith(".ts") && fsMap.has(fileName)) {
                  env.updateFile(fileName, "") // hack: virtual env has no method to delete files
                }

                delete outputModule.files[fileName]
                break;
            }
          } else if (patch.path.length == 1 && patch.path[0] === "files") {
            // files can be also set as a single patch that creates an object
            // this is a bit annoying about dealing with patches that there can be multiple ways that a change can be expressed
            // maybe we should create helper functions that normalize this
            if (patch.action === "put") {
              outputModule.files = {}

              for (const fileName of Object.keys(patch.value)) {
                updateFile(env, fsMap, inputModule, outputModule, fileName)
              }
            }
          }
        }
      })
    },

    close() {
      target.close()
    }
  })
}


function updateFile (env: VirtualTypeScriptEnvironment, fsMap : Map<string, string>, inputModule : Module, outputModule : Module, fileName) {
  const newSource = inputModule.files[fileName]

  // ignore patch if source no longer exists
  // this can happen if a subsequent delete patch has deleted the file
  if (!newSource) {
    return
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
}



