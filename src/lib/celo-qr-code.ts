import { isValidAddress } from 'ethereumjs-util'

const URL_BASE = 'celo://wallet/pay'

export function encodeDataForQr(opts: {
  address: string
  displayName?: string
  e164PhoneNumber?: string
  currencyCode?: string
  amount?: string
  comment?: string
  token?: string
}): string {
  if (!isValidAddress(opts.address)) {
    throw new Error('Invalid address')
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serialized = new URLSearchParams(opts as any).toString()
  return `${URL_BASE}?${serialized}`
}
