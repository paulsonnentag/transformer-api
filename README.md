# Transformer API

The basic idea is that we have a single interface that transformer targets have to implement.

```typescript
interface TransformerTarget<T> {
  patch(patches: A.Patch[])

  close()
}
```

- patch: This method is called with incoming patches
- close: This method is called when the transform should be stopped. Any cleanup logic for the transformer should go here


A simple example of a transformer is the logger. It's just a function that takes some config and an optional target
and returns a Transformer target. The logger forwards any calls to patch or close to the next target.

```typescript
export function getLogger<T>(name: string, target?: TransformerTarget<T>): TransformerTarget<T> {
  return {
    patch(patches) {
      for (const patch of patches) {
        if ("value" in patch) {
          console.log(`${name}:`, patch.action, patch.path, patch.value)
        } else {
          console.log(`${name}:`, patch.action, patch.path)
        }
      }

      target?.patch(patches)
    },

    close() {
      target?.close()
    }
  }
}
```

Transforms can be chained together. Here is an example that pipes the changes from one Automerge document to another
and logs all changes

```typescript
const handle1 = repo.create<Module>()
const handle2 = repo.create<Module>()

getAutomergeSource(handle1,
  getTypescriptCompiler({ compilerOptions: {} }, getLogger("FILES", getAutomergeSink<Module>(handle2))))
```

The goal is to have a very minimal API that ideally never changes. As long as all transformers implement the TransformerTarget interface, they are compatible. Anything beyond that should be implemented as helper functions. Currently, there are two helper functions
that allow you to write transforms that operate on values instead of patches (see `src/transformers/lib.ts`)

- materialize
  - In the patch function, you receive both a materialized doc and the patches
- withOutputDoc
  - builds on materialize
  - Additionally, you get a changeOutputDoc function; instead of generating patches directly, you can mutate the output doc, and patches are generated automatically
