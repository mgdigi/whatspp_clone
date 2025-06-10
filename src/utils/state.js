let appState = {}

export const state = new Proxy(appState, {
  get(target, prop) {
    return target[prop]
  },
  set(target, prop, value) {
    target[prop] = value
    return true
  }
})

export const setState = (newState) => {
  Object.assign(appState, newState)
}

export const getState = () => ({ ...appState })