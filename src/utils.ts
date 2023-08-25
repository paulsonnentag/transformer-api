export function toJS (value: any) {
  return JSON.parse(JSON.stringify(value))
}
