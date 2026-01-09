const store = new Map<string, string>();

export function setTempToken(token: string, secret: string) {
  store.set(token, secret);
  setTimeout(() => store.delete(token), 5 * 60 * 1000);
}

export function getTempToken(token: string) {
  return store.get(token);
}

export function deleteTempToken(token: string) {
  store.delete(token);
}
