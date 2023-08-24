import { Patch } from "@automerge/automerge";
import * as automerge from "@automerge/automerge";

export function toJS (value: any) {
  return JSON.parse(JSON.stringify(value))
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

// todo: currently only implements patch and put
export function applyPatch(doc, patch: Patch) {
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

