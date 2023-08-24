import { TransformerTarget } from "./api";

export function getLogger<T>(name: string, target: TransformerTarget<T>): TransformerTarget<T> {
  return {
    patch: (doc, patches) => {
      for (const patch of patches) {

        if ("value" in patch) {
          console.log(`${name}:`, patch.action, patch.path, patch.value)
        } else {
          console.log(`${name}:`, patch.action, patch.path)
        }
      }

      if (target) {
        target.patch(doc, patches)
      }
    },
    close: () => {
    }
  }
}
