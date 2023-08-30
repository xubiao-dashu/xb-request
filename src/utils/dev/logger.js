/* eslint-disable no-console */
const prod = import.meta.env.PROD
export function log(tag, msg) {
  if (!prod) {
    const TAG = `--- ${tag} ---`
    console.log(
      `%c ${TAG} %c ${typeof msg === 'string' ? msg : ''} `,
      'color:white;background:#00cc76;font-weight: bolder;padding: 2px;',
      'color:white;background:#16b6fc;font-weight: bolder;padding: 2px;',
      typeof msg === 'string' ? '' : msg
    )
  }
}

export function info(tag, msg, content) {
  if (!prod) {
    const TAG = `--- ${tag} ---`
    console.log(
      `%c ${TAG} %c ${msg}`,
      'color:white;background:#7590C2FF;font-weight: bolder;padding: 2px;',
      'color:white;background:grey;font-weight: bolder;padding: 2px;',
      content
    )
  }
}

export function infos(tag, msg, ...params) {
  if (!prod) {
    const TAG = `--- ${tag} ---`
    console.log(
      `%c ${TAG} %c ${msg}`,
      'color:white;background:#7590C2FF;font-weight: bolder;padding: 2px;',
      'color:white;background:gray;font-weight: bolder;padding: 2px;',
      ...params
    )
  }
}

export function warns(tag, msg, ...params) {
  if (!prod) {
    const TAG = `--- ${tag} ---`
    console.warn(
      `%c ${TAG} %c ${msg}`,
      'color:white;background:#ee8012;font-weight: bolder;padding: 2px;',
      'color:white;background:#ee12ea;font-weight: bolder;padding: 2px;',
      ...params
    )
  }
}

window.customLog = log
