import { info } from '@/utils/dev/logger'
import _clearUpHeaders from './_clear-up-headers'

const TAG = 'resolveHeaders'

/**
 *
 * 组合请求方法的headers
 *
 * 覆盖：headers = default <= common <= method <= extra
 *
 * @param method
 * @param defaults 默认头
 * @param extras 手动扩展头
 * @returns {*}
 */
export default function resolveHeaders(method, defaults = {}, extras = {}) {
  const _m = method && method.toLowerCase()
  // check method参数的合法性
  // !/^(get|post|put|delete|patch|options|head)$/ 目前仅仅支持 GET\POST
  if (!/^(get|post)$/.test(_m)) {
    throw new Error(`method:${_m}不是合法的请求方法`)
  }

  // step1
  const headers = { ...defaults }

  // step2 公共头
  const commonHeaders = headers.common || {}
  
  // step3 针对不同请求类型的方法类型公共头
  const headersForMethod = headers[_m] || {}

  const clearUpHeaders = _clearUpHeaders({
    ...headers,
    ...commonHeaders,
    ...headersForMethod,
    // step4 手动扩展头
    ...extras,
  })

  info(TAG, 'debug', clearUpHeaders)

  return clearUpHeaders
}
