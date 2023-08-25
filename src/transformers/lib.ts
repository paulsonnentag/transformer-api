import * as A from "@automerge/automerge";
import { Change, ChangeFn, Patch } from "@automerge/automerge";
import * as automerge from "@automerge/automerge";

export interface TransformerTarget<T> {
  patch(patches: A.Patch[])

  close()
}

export const nullSink: TransformerTarget<unknown> = {
  close: () => {
  },
  patch: () => {
  }
}


export interface MaterializedTransformerConfig<T> {
  patch(doc: T, patches: A.Patch[])

  close()
}

export function materialized<T>({ patch, close }: MaterializedTransformerConfig<T>): TransformerTarget<T> {
  let doc = A.init<T>()

  return {
    patch(patches) {
      doc = A.change(doc, (d) => {
        for (const patch of patches) {
          applyPatch(doc, patch)
        }
      })

      patch(doc, patches)
    },
    close
  }
}


interface WithOutputDocTransformerConfig<Input, Output> {
  target: TransformerTarget<Output>

  patch(inputDoc: Input, patches: A.Patch[], changeOutputDoc: (fn: ChangeFn<Output>) => void)

  close()
}

export function withOutputDoc<Input, Output>(
  { target, patch, close }: WithOutputDocTransformerConfig<Input, Output>
): TransformerTarget<Input> {
  let outputDoc = automerge.init<Output>()

  function changeOutputDoc(fn: ChangeFn<Output>) {
    let oldHeads = A.getHeads(outputDoc)
    outputDoc = A.change(outputDoc, fn)
    const patches = A.diff(outputDoc, oldHeads, A.getHeads(outputDoc))
    target.patch(patches)
  }

  return materialized({
    patch(doc: Input, patches: Patch[]) {
      patch(doc, patches, changeOutputDoc)
    },
    close
  })
}


// todo: currently only implements delete and put
export function applyPatch(doc, patch: Patch) {
  let target = getIn(doc, patch.path.slice(0, -1));
  const key = patch.path[patch.path.length - 1];

  if (patch.action === 'put') {
    target[key] = patch.value;
  } else if (patch.action === 'del') {
    delete target[key];
  }
}

export function getIn(obj: object, path: automerge.Prop[]): any {
  let current = obj
  for (const key of path) {
    if (!current) {
      return undefined
    }
    current = current[key]
  }
  return current
}

