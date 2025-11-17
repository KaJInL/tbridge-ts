/**
 * 支持的平台类型
 */
export type Platform = 'android' | 'ios' | 'web' | 'unknown'

/**
 * 原生消息参数（核心层，不包含业务字段）
 * 核心层只关心数据结构，不关心业务含义
 */
export interface NativeMessageParams {
    [key: string]: any
}

/**
 * 原生消息接口
 */
export interface NativeMessage {
    method?: string
    params?: NativeMessageParams
    callbackId?: string
    [key: string]: any
}

/**
 * Android 桥接接口
 */
export interface AndroidBridge {
    callNative(method: string, params: string, callbackId: string): void
}

/**
 * 回调函数类型
 */
export type CallbackFunction = (data?: any, error?: Error) => void

/**
 * 原生回调处理器类型
 */
export type NativeCallbackHandler = (msg: NativeMessage) => void

/**
 * 原生调用处理器类型
 */
export type NativeCallHandler = (msg: string | NativeMessage) => void

/**
 * JSBridge 窗口接口
 */
export interface TBridgeWindow {
    onNativeCallback: NativeCallbackHandler
    onCallFromNative: NativeCallHandler
}

/**
 * 扩展的 Window 接口，包含平台特定的桥接对象
 */
export interface WindowWithBridge extends Window {
    TBridge?: TBridgeWindow
    AndroidBridge?: AndroidBridge
    webkit?: {
        messageHandlers?: {
            iOSBridge?: {
                postMessage(msg: any): void
            }
        }
    }
}

/**
 * callNative 方法的参数选项
 */
export interface CallNativeOptions<T = any> {
    /** 方法名 */
    method: string
    /** 参数对象 */
    params?: Record<string, any>
    /** 超时时间（毫秒），默认 5000 */
    timeout?: number
    /** 回调函数 */
    callback?: CallbackFunction
    /** 返回类型（用于类型推断和自动 JSON 解析） */
    returnType?: new () => T
}

/**
 * 响应转换函数类型
 * 用于将原生返回的消息转换为业务数据或错误
 * @param params 原生返回的参数对象
 * @returns 如果返回 Error，则会被 reject；否则会被 resolve
 */
export type ResponseTransformer = (params: NativeMessageParams) => any | Error
