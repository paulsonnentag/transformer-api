import { Repo } from "@automerge/automerge-repo"
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb"
import { getAutomergeSink, getAutomergeSource, getLogger } from "./transformer";
import { toJS } from "./utils";


export const repo = new Repo({
  network: [],
  storage: new IndexedDBStorageAdapter(),
})



interface ModuleDoc {
  files: Record<string, string>
}

const handle1 = repo.create<ModuleDoc>()
const handle2 = repo.create<ModuleDoc>()

handle1.change((doc: ModuleDoc) => {
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
    handle1.change((doc: ModuleDoc) => {
      delete doc.files["readme.md"]
    })
  }
})

getAutomergeSource(handle1, getLogger("LOGGER", getAutomergeSink(handle2)))

console.log("output doc", toJS(await handle2.doc()).files)
console.log("input doc", toJS(await handle1.doc()).files)



