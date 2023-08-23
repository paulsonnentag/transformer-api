import { Repo } from "@automerge/automerge-repo"
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb"
import { automergeSource, getLogSink } from "./api";


export const repo = new Repo({
  network: [],
  storage: new IndexedDBStorageAdapter(),
})

interface ModuleDoc {
  files: Record<string, string>
}

const doc1 = repo.create<ModuleDoc>()

doc1.change((doc: ModuleDoc) => {
  doc.files = {
    "index.ts": `
      import { foo } from "./foo"     
      const sum : number = foo + 1     
      console.log(sum)   
    `,
    "foo.ts": "export const foo = 42",
    "readme.md": "readme"
  }
})


automergeSource(doc1, getLogSink())


doc1.change((doc: ModuleDoc) => {
  delete doc.files["readme.md"]
})




