import HttpclientModule from "./src/httpBase/httpclient-module";
import JSBridgeClient from "./src/nativeBase/js-bridge-client";
import ClientNative from "./src/nativeBase/base-module"

/**
 * 导出HttpclientModule工厂方法
 * @param options 在创建网页请求模块的时候进行整合，应用级别，和axios传参保持一致即可
 * @returns {HttpclientModule}
 */
export function createHttpClient(options) {
  return new HttpclientModule(options);
}

/**
 * 导出JSBridgeClient工厂方法
 * @param options 在创建native请求模块的时候进行整合，应用级别
 * @returns {JSBridgeClient}
 */
export function createJSBridgeClient({
  runInNative = "Y", 
  nativeContextName = "NativeContextName",
  onFulfilled4Resp = (response) => Promise.resolve(response),
} = {}) {
  return new JSBridgeClient({
    runInNative,
    nativeContextName,
    onFulfilled4Resp,
  });
}

/**
 * 简化JSBridgeClient调用 注入createJSBridgeClientObj即可 内部已提供方法直接调用
 * @param {*} createJSBridgeClientObj 实例对象
 * @param {*} eventName 事件名
 * @returns 
 */
export function createClientNative(createJSBridgeClientObj, eventName) {
  return new ClientNative(createJSBridgeClientObj, eventName);
}