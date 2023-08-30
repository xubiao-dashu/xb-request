import { isError } from 'lodash-es'

const NAME = 'JSBridgeError'

export const CODE_NOT_SUPPORT = 'NOT_SUPPORT'
export const CODE_CMD_ERR = 'CMD_ERR'
export const CODE_PARSE_RES_ERR = 'CODE_PARSE_RES_ERR'

class JSBridgeError extends Error {
  /**
   * @param code 错误码
   * @param params 一般为错误消息
   */
  constructor(code = 'NOT_SUPPORT', ...params) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(...params)

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, JSBridgeError)
    }

    this.name = NAME
    // Custom debugging information
    this.code = code
    this.date = new Date()
  }
}

export function isJSBridgeError(error) {
  return isError(error) && error.constructor.name === NAME
}

export default JSBridgeError
