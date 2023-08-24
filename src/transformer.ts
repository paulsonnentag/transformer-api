import * as automerge from "@automerge/automerge";
import { Patch, Heads, Doc } from "@automerge/automerge";
import { DocHandle } from "@automerge/automerge-repo";
import { DocHandleChangePayload } from "@automerge/automerge-repo/src/DocHandle";


interface TransformerTarget<Data> {
  onPatch(doc: Data, patches: Patch[])
  onClose()
}

export function getAutomergeSource<Data>(docHandle: DocHandle<Data>, target: TransformerTarget<Data>) {

  // emit initial patches
  docHandle.doc().then(async (doc) => {
    const patches = await getInitialPatches(doc)
    target.onPatch(doc, patches)
  })

  const onChange = async ({ doc, patches }: DocHandleChangePayload<unknown>) => {
    target.onPatch(doc, patches)
  }
  docHandle.on("change", onChange)

  return () => {
    docHandle.off("change", onChange)
    target.onClose()
  }
}


// todo: assumes that doc is an object
export function getAutomergeSink<Data>(docHandle: DocHandle<Data>) {

  // clear doc
  docHandle.change((doc) => {
    for (const key of Object.keys(doc)) {
      delete doc[key]
    }
  })

  return {
    onPatch(doc: Data, patches: Patch[]) {
      docHandle.change((doc) => {
        for (const patch of patches) {
          applyPatch(doc, patch)
        }
      })
    },
    onClose: () => {

    }
  }
}

export function getLogger<T>(name: string, target: TransformerTarget<T>): TransformerTarget<T> {
  return {
    onPatch: (doc, patches) => {
      for (const patch of patches) {

        if ("value" in patch) {
          console.log(`${name}:`, patch.action, patch.path, patch.value)
        } else {
          console.log(`${name}:`, patch.action, patch.path)
        }
      }

      if (target) {
        target.onPatch(doc, patches)
      }
    },
    onClose: () => {
    }
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
      patchCallback(patches) {
        console.log("patch")

        resolve(patches)
      }
    })
  })
}

// todo: currently only implements patch and put
function applyPatch(doc, patch: Patch) {
  let target = doc;
  for (let i = 0; i < patch.path.length - 1; i++) {
    target = target[patch.path[i]];
  }
  const key = patch.path[patch.path.length - 1];

  if (patch.action === 'put') {
    target[key] = patch.value;
  } else if (patch.action === 'del') {
    delete target[key];
  }
}