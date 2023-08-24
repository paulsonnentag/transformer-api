import { TransformerTarget } from "./api";

export const nullSink : TransformerTarget<unknown> = {
  close: () => {},
  patch: () => {}
}