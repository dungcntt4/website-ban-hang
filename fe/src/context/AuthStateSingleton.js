let state = { accessToken: null }
export function setAuthState(next) { state = { ...state, ...next } }
export function getAuthState() { return state }