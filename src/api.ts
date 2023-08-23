import * as automerge from "@automerge/automerge";
import { Patch } from "@automerge/automerge";
import { DocHandle } from "@automerge/automerge-repo";

export function automergeSource<Data>(docHandle: DocHandle<Data>, transform: Sink<Data>) {

  docHandle.value().then((doc) => {
      const changes = automerge.getAllChanges(doc)
      const initialDoc = automerge.clone(automerge.view(doc, []))

      automerge.applyChanges(initialDoc, changes, {patchCallback: (patches) => {
        for (const patch of patches) {
          transform(doc, patch)
        }
      }})
  })


  // todo: handle change
}

type Sink<Data> = (value: Data, patch: Patch) => void


export function getLogSink () : Sink<unknown> {
  return (doc, patch) => {
    console.log(patch.action, patch.path, "value" in patch ? patch.value : "")
  }
}