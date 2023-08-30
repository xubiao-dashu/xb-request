import axios from 'axios'
import qs from 'query-string'
import { isFunction, cloneDeep } from 'lodash-es'
import { onRejected4Req, onFulfilled4Req } from './_def_interceptor_for_req'
import { onFulfilled4Resp, onRejected4Resp } from './_def_interceptor_for_resp'
import resolveConfig from './_resolve-config'
import { HTTP_CONTENT_TYPE } from './_types'

class HttpclientModule {
  /**
   * @param injectOptions 整合到 axios 实例
   */
  constructor(injectOptions = {}) {
    // 不能删除传入的对象属性，一旦删除会导致源对象也相应变更;
    // 后面再初始化时，配置对象属性headers也不会丢失，要保证其单向流且配置项的不变性
    // 此处还是需要进行对象拷贝
    const options = cloneDeep(injectOptions)
    const defaultHeaders = { ...options.headers } || {}
    if (options.headers) {
      // eslint-disable-next-line no-param-reassign
      delete options.headers
    }
    // 公共模块内默认配置优先级最小
    const defaultOptions = {
      // baseURL: '',
      // 数组中最后一个函数必须返回一个字符串， 一个Buffer实例，ArrayBuffer，FormData，或 Stream
      transformRequest: [
        (data, headers) => {
          if (
            headers[HTTP_CONTENT_TYPE] === 'application/x-www-form-urlencoded'
          ) {
            // 针对application/x-www-form-urlencoded对data进行序列化
            return qs.stringify(data)
          }
          return data
        },
      ],
      // `validateStatus` 定义了对于给定的 HTTP状态码是 resolve 还是 reject promise。
      // 如果 `validateStatus` 返回 `true` (或者设置为 `null` 或 `undefined`)，
      // 则promise 将会 resolved，否则是 rejected。
      validateStatus(status) {
        // 默认值
        return status >= 200 && status < 300
      },
    }

    // 公共模块动态默认配置
    this.defaultReqConfig = {
      // 请求头非 axios 结构，后面会动态解析
      headers: {
        [HTTP_CONTENT_TYPE]: 'application/x-www-form-urlencoded',
        ...defaultHeaders,
      },
    }

    // https://axios-http.com/zh/docs/instance
    this.$http = axios.create({ ...defaultOptions, ...options })

    // 添加请求拦截器
    this.$http.interceptors.request.use(
      // 在发送请求之前做些什么
      (config) => {
        let configByReqModify = onFulfilled4Req(config)
        const customOnFulfilled4ReqFunc =
          options.interceptors?.request?.onFulfilled4Req ?? null
        if (isFunction(customOnFulfilled4ReqFunc)) {
          // ⚠️ 应用自定义函数可以控制请求处理流向
          // 1、比如针对 http 非 200 不需要交给请求发起页面处理等需求
          configByReqModify = customOnFulfilled4ReqFunc(configByReqModify)
        }
        return configByReqModify
      },
      (error) => {
        // 对请求错误做些什么
        onRejected4Req(error)
        const customOnFulfilled4ReqFunc =
          options.interceptors?.request?.onRejected4Req ?? null
        if (isFunction(customOnFulfilled4ReqFunc)) {
          // ⚠️ 应用自定义函数可以控制请求处理流向
          // 1、比如针对 http 非 200 不需要交给请求发起页面处理等需求
          return customOnFulfilled4ReqFunc(error)
        }
        // ⚠️ 以上只是通知，不应该修改 error 内容
        return Promise.reject(error)
      }
    )

    // 添加响应拦截器
    this.$http.interceptors.response.use(
      // 2xx 范围内的状态码都会触发该函数。
      // onFulfilled4Resp,
      (response) => {
        onFulfilled4Resp(response)
        const customOnFulfilled4RespFunc =
          options.interceptors?.response?.onFulfilled4Resp ?? null
        if (isFunction(customOnFulfilled4RespFunc)) {
          // ⚠️ 应用自定义函数可以控制请求处理流向
          // 1、比如针对 http 非 200 不需要交给请求发起页面处理等需求
          return customOnFulfilled4RespFunc(response)
        }
        return Promise.resolve(response)
      },
      // 超出 2xx 范围的状态码都会触发该函数。
      // 1. http 状态码非2开头（没有额外定义 validateStatus）的都会进来这里，如 404, 500 等，error 的数据结构如下：error-400、error-500
      // 2. 取消请求也会进入这里，可以用 axios.isCancel(error) 来判断是否是取消请求，error 的数据结构如下：cancel-error
      // 3. 请求运行有异常也会进入这里，如故意将 headers 写错：axios.defaults.headers = '123'
      // 4. 断网，error 的数据结构如下：network-error
      // 5. 如果在拦截器（包括自定义）抛出自定义异常之类，也会走到这里，比如在请求前置拦截器校验某种应用状态失败（比如 client-token 未设置）抛出异常，那么也会走到这里
      (error) => {
        onRejected4Resp(error)
        const customOnRejected4RespFunc =
          options.interceptors?.response?.onRejected4Resp ?? null
        if (isFunction(customOnRejected4RespFunc)) {
          // ⚠️ 应用自定义函数可以控制请求处理流向
          // 1、比如针对 http 非 200 不需要交给请求发起页面处理等需求
          return customOnRejected4RespFunc(error)
        }
        // ⚠️ 以上只是通知，不应该修改 error 内容
        return Promise.reject(error)
      }
    )
  }

  async get(url, config = {}) {
    return this.$http.get(
      url,
      resolveConfig('get', this.defaultReqConfig, config)
    )
  }

  async post(url, data = undefined, config = {}) {
    return this.$http.post(
      url,
      data,
      resolveConfig('post', this.defaultReqConfig, config)
    )
  }

  async put(url, data = undefined, config = {}) {
    return new Promise((resolve) => {
      resolve(
        this.$http.put(
          url,
          data,
          resolveConfig('put', this.defaultReqConfig, config)
        )
      )
    })
  }

  async delete(url, config = {}) {
    return new Promise((resolve) => {
      resolve(
        this.$http.delete(
          url,
          resolveConfig('delete', this.defaultReqConfig, config)
        )
      )
    })
  }
}

// /**
//  * 导出工厂方法
//  * @param options 在创建请求模块的时候进行整合，应用级别
//  * @returns {HttpclientModule}
//  */
// export function createHttpClient(options) {
//   return new HttpclientModule(options)
// }

// 默认导出模块对象
export default HttpclientModule
