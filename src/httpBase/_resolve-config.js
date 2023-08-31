// https://medium.com/starbugs/the-correct-way-to-import-lodash-libraries-bdf613235927
import { isEmpty } from 'lodash-es'
import { info } from '../utils/dev/logger'
import resolveHeaders from './_resolve-headers'

const TAG = 'resolveConfig'

/**
 * 组合请求方法的config
 *
 * config = default <= extra
 *
 * @param method 请求方法 get/post
 * @param defaults 请求公共模块内默认配置 优先级最小
 * @param extras
 * @returns {{[p: string]: *}|{}}
 */
export default function resolveConfig(method, defaults = {}, extras = {}) {
  if (isEmpty(defaults) && isEmpty(extras)) {
    return {}
  }

  const config = {
    ...defaults,
    ...extras,
    headers: { ...resolveHeaders(method, defaults.headers, extras.headers) },
  }

  info(TAG, 'resolveConfig config is', config)
  return config
}
