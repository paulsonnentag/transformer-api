import { Patch } from "@automerge/automerge";

export interface TransformerTarget<Data> {
  patch(doc: Data, patches: Patch[])
  close()
}
