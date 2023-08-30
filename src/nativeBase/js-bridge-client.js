import {
  hasIn,
  isFunction,
  isNull,
  isObject,
  isString,
  isUndefined,
} from 'lodash-es'
import { infos, warns } from '@/utils/dev/logger'
import jsMobileDetect from './js-mobile-detect'
import JSBridgeError, {
  CODE_CMD_ERR,
  CODE_NOT_SUPPORT,
  CODE_PARSE_RES_ERR,
} from './js-bridge-error'

const TAG = 'js-bridge-client'

class JSBridgeClient {
  #nativeContext

  onFulfilled4Resp

  /**
   * @param runInNative Y 或 N  是否在native环境运行
   * @param nativeContextName native上下文名称 需和客户端定义的一致
   * @param onFulfilled4Resp 客户端桥接响应全局处理函数，可以针对客户端全局响应进行自定义处理
   *                         1、如果应用配置全局响应处理器，那么桥接处理将交给应用自己决策
   *                         2、应用接受到的是初步将客户端返回 json-string 解析完成 json-obj 之后的对象
   *                         3、给业务应用一个全局处理回调的机会，⚠️ 必须返回 Promise.reject | resolve
   */
  constructor({
    runInNative = 'Y',
    nativeContextName = 'NativeContextName',
    onFulfilled4Resp = (response) => Promise.resolve(response),
  } = {}) {
    this.runInNative = runInNative
    this.nativeContextName = nativeContextName
    // 给业务应用一个全局处理回调的机会，⚠️ 必须返回 Promise.reject | resolve
    this.onFulfilled4Resp = onFulfilled4Resp
    try {
      this.doRunNativeConfigAndRuntimeENVCheck()
      this.#nativeContext = JSBridgeClient.parseNativeContext(nativeContextName)
    } catch (e) {
      warns(TAG, '初始化桥接客户端失败', e)
    }
  }

  static checkCMD({ event, action, params } = {}) {
    if (isNull(event) || isUndefined(event)) {
      throw new JSBridgeError(CODE_CMD_ERR, 'event 参数为空')
    }
    if (isNull(action) || isUndefined(action)) {
      throw new JSBridgeError(CODE_CMD_ERR, 'action 参数为空')
    }
    if (isNull(params) || isUndefined(params)) {
      warns(TAG, 'checkCMD', 'params 参数为空')
    }
  }

  static parseNativeContext(nativeContextName) {
    let ctx = null
    if (jsMobileDetect.isIos()) {
      if (!hasIn(window, 'webkit')) {
        throw new JSBridgeError(
          CODE_NOT_SUPPORT,
          'IOS客户端没有配置上下文执行环境'
        )
      }
      ctx = window.webkit?.messageHandlers[nativeContextName] ?? null
    }

    if (jsMobileDetect.isAndroid()) {
      ctx = window[nativeContextName]
    }

    if (!isObject(ctx)) {
      throw new JSBridgeError(
        CODE_NOT_SUPPORT,
        `客户端没有配置上下文: ${nativeContextName}`
      )
    }
    return ctx
  }

  // https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
  static makeCallBackRandomStr(length) {
    let result = ''
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const charactersLength = characters.length
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength))
    }
    return result
  }

  static #checkIsJSON(response, command) {
    if (isString(response)) {
      try {
        // https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse
        const tmp = JSON.parse(response)
        if (isObject(tmp)) {
          return tmp
        }
      } catch (e) {
        throw new JSBridgeError(
          CODE_PARSE_RES_ERR,
          `解析客户端桥接【${command.event}#${command.action}】返回的字符串响应数据出错，一般为数据格式不正确，不是一个标准JSON字面量`,
          e
        )
      }
    }
    throw new JSBridgeError(
      CODE_PARSE_RES_ERR,
      `客户端桥接【${command.event}#${command.action}】返回的数据格式不正确，不是一个标准JSON字面量`
    )
  }

  static async #parseRespData(response, command) {
    return new Promise((resolve, reject) => {
      let data
      try {
        data = JSBridgeClient.#checkIsJSON(response, command)
      } catch (e) {
        reject(e)
        return
      }
      if (isFunction(this.onFulfilled4Resp)) {
        // step2 如果应用配置全局响应处理器，那么桥接处理将交给应用自己决策
        // consistent-return http://nodejs.cn/eslint/rules/consistent-return/
        this.onFulfilled4Resp(data)
          .then((res) => {
            data = res
            infos(
              TAG,
              // ⚠️ 方便客户端日志查看，调试的时候开启
              // eslint-disable-next-line prettier/prettier
              `${command.event}#${command.action} bridge onFulfilled4Resp return is:\n ${JSON.stringify(data)}`
            )
            resolve(data)
          })
          .catch(reject)
        return
      }
      // step1 未配置自定义处理器，直接响应成功
      infos(
        TAG,
        // eslint-disable-next-line prettier/prettier
        `${command.event}#${command.action} bridge parseRespData return is:\n ${JSON.stringify(data)}`
      )
      resolve(data)
    })
  }

  /**
   * 协议方式请求客户端
   * command的格式：
   *  const command = {
   *    event: 'test',
   *    action: 'TestCallBack',
   *    params: {
   *      ...
   *    }
   *  }
   *  @param  {Object} [command=null] 客户端所需的调用消息
   */
  async bridge(command = null) {
    try {
      this.doRunNativeConfigAndRuntimeENVCheck()
      this.doCxtCheck()
      JSBridgeClient.checkCMD(command)
    } catch (e) {
      return Promise.reject(e)
    }
    return new Promise((resolve, reject) => {
      // ⚠️ 使用 JSON.stringify 方便在客户端 logger 查看
      infos(
        TAG,
        `发送到客户端指令 command 参数是:\n ${JSON.stringify(command)}`
      )
      let response = null
      if (jsMobileDetect.isAndroid()) {
        // event 是硬编码, android 参考webView.evaluateJavascript方法
        // 参考客户端：@JavascriptInterface public String event(String params)
        try {
          // step1 起
          // ⚠️ 发送到客户端的是字符串类型的json 字面量
          // ⚠️ 客户端返回的是字符串类型的json 字面量
          response = this.#nativeContext.event(JSON.stringify(command))
        } catch (e) {
          reject(e)
          // ⚠️ 如何处理 promise的返回 http://nodejs.cn/eslint/rules/no-promise-executor-return/
          return
        }
        infos(
          TAG,
          `${command.event}#${command.action} bridge callback, android origin return is:\n ${response}`
        )
        // step2 终
        JSBridgeClient.#parseRespData(response, command)
          .then(resolve)
          .catch(reject)
        // ⚠️ 处理完毕
        return
      }

      if (jsMobileDetect.isIos()) {
        const callBackName = `__callback__${JSBridgeClient.makeCallBackRandomStr(
          5
        )}`

        window[callBackName] = (iosResponse) => {
          window[callBackName] = undefined
          response = iosResponse
          infos(
            TAG,
            `${command.event}#${command.action} bridge callback, ios origin return is:\n ${response}`
          )
          // step2 终
          JSBridgeClient.#parseRespData(response, command)
            .then(resolve)
            .catch(reject)
          // ⚠️ 处理完毕
          // ⚠️ 这里就直接return了
          // noinspection UnnecessaryReturnStatementJS
          // eslint-disable-next-line no-useless-return
          return
        }

        const p = { callback: callBackName, ...command }
        try {
          // postMessage 是硬编码
          // step1 起
          this.#nativeContext.postMessage(JSON.stringify(p))
        } catch (e) {
          reject(e)
          // eslint-disable-next-line no-useless-return
          return
        }
      }
    })
  }

  doRunNativeConfigAndRuntimeENVCheck() {
    if (this.runInNative === 'N') {
      throw new JSBridgeError(
        CODE_NOT_SUPPORT,
        '全局配置，未运行在 native 模式下，无法发起调用'
      )
    }
    if (!jsMobileDetect.isMobilePhone()) {
      throw new JSBridgeError(CODE_NOT_SUPPORT, '不支持的客户端环境')
    }
  }

  doCxtCheck() {
    if (!isObject(this.#nativeContext)) {
      throw new JSBridgeError(
        CODE_NOT_SUPPORT,
        `请检查运行环境是否通过Native注入了【${this.nativeContextName}】上下文`
      )
    }
  }
}

// /**
//  * 导出工厂方法
//  * @param options 在创建请求模块的时候进行整合，应用级别
//  * @returns {HttpclientModule}
//  */
// export function createJSBridgeClient(options) {
//   return new JSBridgeClient(options)
// }

export default JSBridgeClient
