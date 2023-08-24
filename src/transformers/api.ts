import { Patch } from "@automerge/automerge";

export interface TransformerTarget<Data> {
  onPatch(doc: Data, patches: Patch[])
  onClose()
}
