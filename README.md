# 【xb-request】是提供给Web 端 和Native 端双向通信的JSSDK，内置了IOS和安卓交互，调用简单，能快速整合进业务开发中。目前某银行大型项目中已深度使用，稳定可靠。
***原理小预热：***

***1.我们开发的 h5 页面运行在端上的 WebView 容器之中，很多业务场景下 h5 需要依赖端上提供的信息/能力，这时我们需要一个可以连接原生运行环境和 JS 运行环境的桥梁，这个桥梁就是 JSB，JSB 让 Web 端和 Native 端得以实现双向通信。***

***2.注入式的原理是通过 WebView 提供的接口向 JS 全局上下文对象（window）中注入对象或者方法，当 JS 调用时，可直接执行相应的 Native 代码逻辑，从而达到 Web 调用 Native 的目的。***

***注意：我们目前就是使用的是注入式。安卓4.2+ 和 iOS 7+以上可用，性能较好，参数长度无限制，是目前比较优的解决方案。***
***同时SDK也包含了对axios的二次封装，可注入自定义（request和response）拦截器，使用和axios一致，没有增加任何心智负担，方便业务使用。***


**1）使用npm安装  注：目前只支持npm源镜像仓库拉取**


```js
npm install xb-request
```

**2）项目中导入**

```js
import { createHttpClient, createJSBridgeClient } from 'xb-request'

// jsBridge初始化配置
const jsBridgeOptions = {
  // 是否运行在native环境 可选值：Y / N
  runInNative: 'Y',
  // native上下文名称
  nativeContextName: 'testName',
  // 调用成功回调 可进行数据处理和加工后返回promise
  cb: (res) => {
    console.log('cb-res:', res)
    return Promise.resolve(res)
  },
}
const jsBridgeClient = createJSBridgeClient(jsBridgeOptions)
console.log('jsBridgeClient init...', jsBridgeClient)

// 创建axios请求对象
// 参数对象直接参考axios配置即可
const axiosOptions = {}
const axiosRequest = createHttpClient(axiosOptions)
console.log('axiosRequest init...', axiosRequest)
```

