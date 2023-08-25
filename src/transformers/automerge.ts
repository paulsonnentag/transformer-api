import * as automerge from "@automerge/automerge";
import { Patch, Heads, Doc } from "@automerge/automerge";
import { DocHandle } from "@automerge/automerge-repo";
import { DocHandleChangePayload } from "@automerge/automerge-repo/src/DocHandle";
import { applyPatch, TransformerTarget } from "./lib";

export function getAutomergeSource<Data>(docHandle: DocHandle<Data>, target: TransformerTarget<Data>) {
  // emit initial patches
  docHandle.doc().then(async (doc) => {
    const patches = await getInitialPatches(doc)
    target.patch(patches)
  })

  const onChange = async ({ doc, patches }: DocHandleChangePayload<unknown>) => {
    target.patch(patches)
  }
  docHandle.on("change", onChange)

  return () => {
    docHandle.off("change", onChange)
    target.close()
  }
}

export function getAutomergeSink<Data>(docHandle: DocHandle<Data>) : TransformerTarget<Data> {
  // clear doc
  docHandle.change((doc) => {
    for (const key of Object.keys(doc)) {
      delete doc[key]
    }
  })

  return {
    patch(patches: Patch[]) {
      docHandle.change((doc) => {
        for (const patch of patches) {
          applyPatch(doc, patch)
        }
      })
    },
    close: () => {}
  }
}

// todo: not sure if this is the right way to do this
export function getInitialPatches(doc): Promise<Patch[]> {
  return new Promise((resolve) => {
    const changes = automerge.getAllChanges(doc)
    const initialDoc = automerge.clone(automerge.view(doc, []))

    if (changes.length === 0) {
      resolve([])
      return
    }

    automerge.applyChanges(initialDoc, changes, {
      patchCallback(patches) {
        console.log("patch")

        resolve(patches)
      }
    })
  })
}


