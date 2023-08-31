import { warns } from '../utils/dev/logger'
import { isJSBridgeError } from './js-bridge-error'
// import { createJSBridgeClient } from './js-bridge-client'

class BaseModule {
  #eventName
  $client

  constructor(createJSBridgeClientObj, eventName) {
    if(typeof createJSBridgeClientObj === 'object') {
      this.$client = createJSBridgeClientObj
      this.#eventName = eventName
      return
    }
    warns('未能注入JSBridgeClient实例对象，请检查入参')
  }

  // eslint-disable-next-line no-unused-vars
  static #beforeHandler(action, params) {
    return Promise.resolve()
  }

  static #finallyDestroy() {
    warns('fireEvent destroy')
  }

  fireEvent(action, params = {}) {
    return BaseModule.#beforeHandler(action, params)
      .then(() => {
        return this.$client.bridge({
          event: this.#eventName,
          action,
          params,
        })
      })
      .catch((error) => {
        BaseModule.#handlerBaseErr(error)
        return Promise.reject(error)
      })
      .finally(() => {
        BaseModule.#finallyDestroy()
      })
  }

  /**
   * 通过listener监听客户端回调
   * @param action
   * @param params
   * @returns {Promise<object>}
   */
  fireEventForAsync(action, params = {}) {
    return BaseModule.#beforeHandler(action, params)
      .then(() => {
        const listener = `${action}Listener${Date.now()}`
        return new Promise((resolve, reject) => {
          this.$client
            .bridge({
              event: this.#eventName,
              action,
              listener,
              params,
            })
            .then(() => {
              // eslint-disable-next-line consistent-return
              window[listener] = (result) => {
                window[listener] = null
                let response = result
                if (typeof response === 'string') {
                  response = JSON.parse(response)
                }
                return resolve(response)
              }
            })
            .finally(() => {
              BaseModule.#finallyDestroy()
            })
        })
      })
      .catch((error) => {
        BaseModule.#handlerBaseErr(error)
        return Promise.reject(error)
      })
      .finally(() => {
        BaseModule.#finallyDestroy()
      })
  }

  /**
   * 处理基础类型的错误
   *
   * 1、针对发起调用前的检查
   * @param error
   */
  static #handlerBaseErr(error) {r
    if (isJSBridgeError(error)) {
      warns('客户端桥接错误', error)
    }
  }
}

export default BaseModule
