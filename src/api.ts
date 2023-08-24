import * as automerge from "@automerge/automerge";
import { Patch, Heads, Doc } from "@automerge/automerge";
import { DocHandle } from "@automerge/automerge-repo";
import { DocHandleChangePayload } from "@automerge/automerge-repo/src/DocHandle";


interface TransformerTarget<Data> {
  onPatch (doc: Data, patches: Patch[])
  onClose ()
}

export function getAutomergeSource<Data>(docHandle: DocHandle<Data>, target: TransformerTarget<Data>) {

  // emit initial patches
  docHandle.doc().then(async (doc) => {
    const patches = await getInitialPatches(doc)
    target.onPatch(doc, patches)
  })


  const onChange = async ({ doc, patches}: DocHandleChangePayload<unknown>) => {
    target.onPatch(doc, patches)
  }
  docHandle.on("change", onChange)

  return () => {
    docHandle.off("change", onChange)
    target.onClose()
  }
}



export function getLogSink(): TransformerTarget<unknown> {
  return {
    onPatch: (doc, patches)  => {
      for (const patch of patches) {
        console.log(patch.action, patch.path, "value" in patch ? patch.value : "")
      }
    },
    onClose: () => {}
  }
}


// todo: not sure if this is the right way to do this
function getInitialPatches(doc): Promise<Patch[]> {
  return new Promise((resolve) => {
    const changes = automerge.getAllChanges(doc)
    const initialDoc = automerge.clone(automerge.view(doc, []))

    if (changes.length === 0) {
      resolve([])
      return
    }

    automerge.applyChanges(initialDoc, changes, {
      patchCallback (patches) {
        console.log("patch")

        resolve(patches)
      }
    })
  })
}