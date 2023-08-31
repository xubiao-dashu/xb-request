import { info } from '../utils/dev/logger'

const TAG = '_def_interceptor_for_resp'

export function onFulfilled4Resp(response) {
  // 在发送请求之前做些什么
  info(TAG, 'onFulfilled4Resp', response)
  return response
}

export function onRejected4Resp(error) {
  // 对请求错误做些什么
  info(TAG, 'onRejected4Resp', error)
}
