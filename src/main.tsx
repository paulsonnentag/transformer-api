import { Repo } from "@automerge/automerge-repo"
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb"
import { toJS } from "./utils";
import { getTypescriptCompiler, Module } from "./transformers/typescriptCompiler";
import { getAutomergeSink, getAutomergeSource } from "./transformers/automerge";
import { getStringDiffTransform } from "./transformers/stringDiffTransform";
import { getLogger } from "./transformers/logger";
import * as automerge from "@automerge/automerge"


export const repo = new Repo({
  network: [],
  storage: new IndexedDBStorageAdapter(),
})

const handle1 = repo.create<Module>()
const handle2 = repo.create<Module>()

/* sync docs with logger in between example * /
getAutomergeSource(handle1, getLogger("LOGGER", getAutomergeSink(handle2)))
/* */

/* compile files */
getAutomergeSource(handle1,
  getTypescriptCompiler({ compilerOptions: {} }, getLogger("FILES", getAutomergeSink<Module>(handle2))))
/* */

/* compile files with diff optimization * / WIP
getAutomergeSource(handle1,
  getTypescriptCompiler({ compilerOptions: {} },
    getStringDiffTransform(
      getLogger("FILES", getAutomergeSink<Module>(handle2)))))
/* */



handle2.on("change", ({ doc }) => {
  console.log("new doc", toJS(doc))
})

// todo: enable implict string conversion
handle1.change((doc: Module) => {
  doc.files = {
    "index.ts":`
      import { foo } from "./foo"     
      const sum : number = foo + 1     
      console.log(sum)   
    `,
    "foo.ts": "export const foo = 42",
    "readme.md":"readme"
  }
}, {
  patchCallback: () => {
    handle1.change((doc: Module) => {
      delete doc.files["readme.md"]
    }, {
      patchCallback: () => {
        handle1.change((doc) => {
          doc.files["foo.ts"] = `export const foo : number = 1`
          doc.files["styles.css"] = "body { margin: 0 }"
        })
      }
    })
  }
})



