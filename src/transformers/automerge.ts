import * as automerge from "@automerge/automerge";
import { Patch, Heads, Doc } from "@automerge/automerge";
import { DocHandle } from "@automerge/automerge-repo";
import { DocHandleChangePayload } from "@automerge/automerge-repo/src/DocHandle";
import { applyPatch, getInitialPatches } from "../utils";
import { TransformerTarget } from "./api";

export function getAutomergeSource<Data>(docHandle: DocHandle<Data>, target: TransformerTarget<Data>) {

  // emit initial patches
  docHandle.doc().then(async (doc) => {
    const patches = await getInitialPatches(doc)
    target.patch(doc, patches)
  })

  const onChange = async ({ doc, patches }: DocHandleChangePayload<unknown>) => {
    target.patch(doc, patches)
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
    patch(doc: Data, patches: Patch[]) {
      docHandle.change((doc) => {
        for (const patch of patches) {
          applyPatch(doc, patch)
        }
      })
    },
    close: () => {}
  }
}


