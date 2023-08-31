import { info } from '../utils/dev/logger'

const TAG = '_def_interceptor_for_req'

export function onFulfilled4Req(config) {
  // 在发送请求之前做些什么
  info(TAG, 'onFulfilled4Req', config)
  return config
}

export function onRejected4Req(error) {
  // 对请求错误做些什么
  info(TAG, 'onRejected4Req TODO', error)
  return Promise.reject(error)
}
