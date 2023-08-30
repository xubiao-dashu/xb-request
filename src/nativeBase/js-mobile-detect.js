import MobileDetect from 'mobile-detect'

class JSMobileDetect {
  #md

  #osAliasName

  constructor() {
    // https://hgoebl.github.io/mobile-detect.js/doc/MobileDetect.html
    this.#md = new MobileDetect(window.navigator.userAgent)
    this.#osAliasName = this.#md.os()
  }

  isMobilePhone() {
    return this.isAndroid() || this.isIos()
  }

  isIos() {
    return this.#osAliasName === 'iOS'
  }

  isAndroid() {
    return this.#osAliasName === 'AndroidOS'
  }
}

export default new JSMobileDetect()
