// requireNetworkMember returns 403 on every network route when the dealer has
// switched himself out. That is not an error — it is a state with its own message.
export const isForbidden = (error: unknown): boolean =>
  (error as any)?.response?.status === 403;
