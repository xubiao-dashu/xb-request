// 清理headers中不需要的属性
export default function _clearUpHeaders(headers) {
  ;[
    // 自定义公共头
    'common',
    'get',
    'post',
    'put',
    'delete',
    'patch',
    'options',
    'head'
  ].forEach((prop) => headers[prop] && delete headers[prop])
  return headers
}
