export type Id = string

export type SelectOption = {
  value: string
  label: string
}

export type AsyncState<T> = {
  data: T
  loading: boolean
  error: string | null
}
