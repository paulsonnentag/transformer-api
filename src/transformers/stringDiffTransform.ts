import { TransformerTarget } from "./lib";
import * as automerge from "@automerge/automerge"
import diff from "fast-diff"
import { applyPatch, getIn } from "../utils";

// optimizes put patches for string values
// if there is a previous value the new value is diffed against the old value and instead of
// replacing the whole string more efficient patches are generated that change only the parts of the text that actually changed
export function getStringDiffTransform<T>(target: TransformerTarget<T>): TransformerTarget<T> {
  let outputDoc = automerge.init()
  let oldInputHeads: automerge.Heads
  let oldOutputHeads = automerge.getHeads(outputDoc)

  return {
    patch<T>(doc: T, patches: automerge.Patch[]) {
      if (!oldInputHeads) {
        oldInputHeads = automerge.getHeads(doc)
        target.patch(doc, patches)
        return
      }

      const oldDoc = automerge.view(doc, oldInputHeads)

      for (const patch of patches) {
        if (patch.action === "put" && patch.value) {
          const oldValue = getIn(oldDoc, patch.path)

          if (typeof oldValue instanceof "string" && patch.value instanceof "string") {
            let index = 0;
            for(const [type, change] of diff(oldValue, patch.value)) {
              switch (type) {
                case diff.DELETE:
                  getIn(oldDoc, patch.path.slice(0, -1)).splice(index, change.length)
                  break;

                case diff.INSERT:
                  getIn(oldDoc, patch.path.slice(0, -1)).splice(index, 0, change)
                  break;
              }
              index += change.length
            }
            continue
          }
        }

        applyPatch(outputDoc, patch)
      }

      const outputPatches = automerge.diff(outputDoc, oldOutputHeads, automerge.getHeads(outputDoc))
      target.patch(doc, outputPatches)
    },
    close() {
    }
  }
}

