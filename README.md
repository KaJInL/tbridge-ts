# TBridge - TypeScript/JavaScript

[![npm version](https://img.shields.io/npm/v/@kajin/tbridge)](https://www.npmjs.com/package/@kajin/tbridge)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)

TBridge 的 TypeScript/JavaScript 实现，为 Web 应用提供与 iOS/Android 原生应用的通信能力。

## 📦 安装

```bash
npm install @kajin/tbridge
```

## 🚀 快速开始

```typescript
import { TBridge } from '@kajin/tbridge'

const bridge = new TBridge()

// 调用原生方法
const result = await bridge.callNative('methodName', { key: 'value' })

// 接收原生调用
bridge.setNativeHandler((method, data) => {
  console.log('原生调用:', method, data)
})
```

## 📊 调用流程

```
① 调用原生：
   bridge.callNative('method', params) 
   ↓
   Promise.resolve(result)

② 接收原生调用：
   bridge.setNativeHandler((method, data) => {
     // 处理原生调用
   })
```

## 📖 核心 API

### 构造函数

```typescript
new TBridge(responseTransformer?: ResponseTransformer)
```

创建 TBridge 实例，可选的响应转换器用于统一处理原生返回数据。

### callNative()

```typescript
// Promise 方式
callNative<T>(method: string, params?: object, timeout?: number): Promise<T>

// Callback 方式
callNative(method: string, params: object, callback: Function): void

// 选项方式
callNative<T>(options: CallNativeOptions<T>): Promise<T>
```

调用原生方法，支持 Promise 和 Callback 两种方式。

**示例:**

```typescript
// Promise
const result = await bridge.callNative('getUserInfo', { userId: '123' })

// Callback
bridge.callNative('getUserInfo', { userId: '123' }, (data, error) => {
  if (error) console.error(error)
  else console.log(data)
})

// 自定义超时
await bridge.callNative('method', params, 10000)  // 10秒
```

### getPlatform()

```typescript
getPlatform(): 'ios' | 'android' | 'web' | 'unknown'
```

获取当前运行平台。

### setNativeHandler()

```typescript
setNativeHandler(handler: (method: string, data: any) => void): void
```

设置原生调用 JS 的处理器。

### removeNativeHandler()

```typescript
removeNativeHandler(): void
```

移除原生调用处理器。

### setResponseTransformer()

```typescript
setResponseTransformer(transformer: ResponseTransformer): void
```

设置响应转换函数。

### removeResponseTransformer()

```typescript
removeResponseTransformer(): void
```

移除响应转换函数。

## 📚 完整文档

详细的使用指南、示例代码和 API 文档请查看：

- [📖 主文档](https://github.com/KaJInL/tbridge)
- [🔧 集成指南](https://github.com/KaJInL/tbridge/blob/main/packages/tbridge/docs/INTEGRATION_GUIDE.md)
- [📘 API 参考](https://github.com/KaJInL/tbridge/blob/main/packages/tbridge/docs/API_REFERENCE.md)
- [💡 示例代码](https://github.com/KaJInL/tbridge/blob/main/packages/tbridge/docs/EXAMPLES.md)

## 🔗 相关链接

- **npm**: https://www.npmjs.com/package/@kajin/tbridge
- **GitHub**: https://github.com/KaJInL/tbridge-ts
- **主仓库**: https://github.com/KaJInL/tbridge

## 📄 许可证

MIT License
