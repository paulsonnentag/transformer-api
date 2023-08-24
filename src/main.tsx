import { Repo } from "@automerge/automerge-repo"
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb"
import { toJS } from "./utils";
import { Module } from "./transformers/typescriptCompiler";
import { getAutomergeSink, getAutomergeSource } from "./transformers/automerge";
import { getLogger } from "./transformers/logger";

export const repo = new Repo({
  network: [],
  storage: new IndexedDBStorageAdapter(),
})


const handle1 = repo.create<Module>()
const handle2 = repo.create<Module>()

handle1.change((doc: Module) => {
  doc.files = {
    "index.ts": `
      import { foo } from "./foo"     
      const sum : number = foo + 1     
      console.log(sum)   
    `,
    "foo.ts": "export const foo = 42",
    "readme.md": "readme"
  }
}, {
  patchCallback: () => {
    handle1.change((doc: Module) => {
      delete doc.files["readme.md"]
    })
  }
})

getAutomergeSource(handle1, getLogger("LOGGER", getAutomergeSink(handle2)))

console.log("output doc", toJS(await handle2.doc()).files)
console.log("input doc", toJS(await handle1.doc()).files)



