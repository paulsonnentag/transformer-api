import { TransformerTarget } from "./lib";

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
