import type {
    WindowWithBridge,
    NativeMessage,
    Platform,
    CallNativeOptions,
    CallbackFunction,
    ResponseTransformer
} from './types'

/**
 * JSBridge 核心类
 * 提供 JS 与原生应用之间通信能力
 */
export class TBridge {
    /** 回调函数映射表 */
    private callbacks = new Map<string, {
        resolve: (data: any) => void
        reject: (err: Error) => void
        timeout?: ReturnType<typeof setTimeout>
    }>()

    /** 回调 ID 计数器 */
    private callbackId = 0

    /** 当前平台 */
    private platform: Platform

    /** 原生调用处理器 */
    private nativeHandler?: (method: string, data: any) => void

    /** 响应转换函数，用于将原生响应转换为业务数据或错误 */
    private responseTransformer?: ResponseTransformer

    constructor(responseTransformer?: ResponseTransformer) {
        try {
            this.platform = this.detectPlatform()
            this.injectToWindow()
            this.responseTransformer = responseTransformer
        } catch (error) {
            console.error('[TBridge] initialization error:', error)
            this.platform = 'unknown'
        }
    }

    /** 注入 JSBridge 到 window 对象，供原生调用 */
    private injectToWindow(): void {
        if (typeof window === 'undefined') return
        const win = window as WindowWithBridge
        win.TBridge = {
            onNativeCallback: (msg: NativeMessage) => this.onNativeCallback(msg),
            onCallFromNative: (msg: string | NativeMessage) => this.onCallFromNative(msg)
        }
    }

    /** 检测当前平台 */
    private detectPlatform(): Platform {
        try {
            if (typeof window === 'undefined') return 'unknown'
            const win = window as WindowWithBridge
            if (win.AndroidBridge) return 'android'
            if (win.webkit?.messageHandlers?.iOSBridge) return 'ios'
            if (typeof navigator !== 'undefined' && navigator.userAgent) {
                const ua = navigator.userAgent
                if (/Android/i.test(ua)) return 'android'
                if (/iPhone|iPad|iPod/i.test(ua)) return 'ios'
                return 'web'
            }
            return 'unknown'
        } catch (error) {
            console.error('[TBridge] detectPlatform error:', error)
            return 'unknown'
        }
    }

    /** 获取当前平台 */
    public getPlatform(): Platform {
        return this.platform
    }

    /** 调用原生方法（支持 Promise 和回调两种方式） */
    public callNative<T = any>(
        method: string,
        params?: Record<string, any>,
        timeout?: number
    ): Promise<T>
    public callNative<T = any>(options: CallNativeOptions<T>): Promise<T>
    public callNative(
        method: string,
        params: Record<string, any> | undefined,
        callback: CallbackFunction
    ): void
    public callNative<T = any>(
        methodOrOptions: string | CallNativeOptions<T>,
        paramsOrCallback?: Record<string, any> | CallbackFunction | number,
        timeoutOrCallback?: number | CallbackFunction
    ): Promise<T> | void {
        // 支持选项对象形式
        if (typeof methodOrOptions === 'object') {
            const options = methodOrOptions
            const timeout = options.timeout ?? 5000
            if (options.callback) {
                this.callNativeWithCallback(options.method, options.params, options.callback)
                return
            }
            return this.callNativeWithPromise<T>(options.method, options.params, timeout)
        }

        const method = methodOrOptions

        // 第二个参数为函数，使用回调模式
        if (typeof paramsOrCallback === 'function') {
            this.callNativeWithCallback(method, undefined, paramsOrCallback as CallbackFunction)
            return
        }

        // 否则使用 Promise 模式
        const params = paramsOrCallback as Record<string, any> | undefined
        const timeout = typeof timeoutOrCallback === 'number' ? timeoutOrCallback : 5000
        return this.callNativeWithPromise<T>(method, params, timeout)
    }

    /** 使用 Promise 调用原生方法 */
    private callNativeWithPromise<T = any>(
        method: string,
        params?: Record<string, any>,
        timeout: number = 5000
    ): Promise<T> {
        return new Promise((resolve, reject) => {
            const callbackId = this.generateCallbackId()
            const timeoutId = setTimeout(() => {
                this.callbacks.delete(callbackId)
                reject(new Error(`JSBridge callNative timeout: ${method}`))
            }, timeout)

            this.callbacks.set(callbackId, {
                resolve: (data) => { clearTimeout(timeoutId); resolve(data) },
                reject: (err) => { clearTimeout(timeoutId); reject(err) },
                timeout: timeoutId
            })

            this.sendMessage(method, params, callbackId)
        })
    }

    /** 使用回调函数调用原生方法 */
    private callNativeWithCallback(
        method: string,
        params: Record<string, any> | undefined,
        callback: CallbackFunction
    ): void {
        const callbackId = this.generateCallbackId()
        this.callbacks.set(callbackId, {
            resolve: (data) => callback(data),
            reject: (err) => callback(undefined, err)
        })
        this.sendMessage(method, params, callbackId)
    }

    /** 生成唯一回调 ID */
    private generateCallbackId(): string {
        return `callback_${Date.now()}_${++this.callbackId}`
    }

    private sendMessage(
        method: string,
        params: Record<string, any> | undefined,
        callbackId: string
    ): void {
        if (typeof window === 'undefined') return
        this.platform = this.detectPlatform()
        const win = window as WindowWithBridge
        const message: NativeMessage = { method, params, callbackId }

        try {
            switch (this.platform) {
                case 'android':
                    win.AndroidBridge?.callNative(method, JSON.stringify(params || {}), callbackId)
                    console.log(`[TBridge] Sent to Android: ${method}`, params)
                    return
                case 'ios':
                    win.webkit?.messageHandlers?.iOSBridge?.postMessage(message)
                    console.log(`[TBridge] Sent to iOS: ${method}`, params)
                    return
                case 'web':
                case 'unknown':
                    console.warn(`[TBridge] ${method} called in ${this.platform}, ignored`)
                    setTimeout(() => this.onNativeCallback({
                        callbackId,
                        params: { data: { message: 'mock' } }
                    }), 100)
                    return
            }
        } catch (error) {
            console.error(`[TBridge] sendMessage error for ${method}:`, error)
            const cb = this.callbacks.get(callbackId)
            if (cb) {
                this.callbacks.delete(callbackId)
                cb.reject(error instanceof Error ? error : new Error(String(error)))
            }
        }
    }


    /** 处理原生回调 */
    private onNativeCallback(msg: NativeMessage): void {
        if (!msg.callbackId) return
        const cb = this.callbacks.get(msg.callbackId)
        if (!cb) return
        this.callbacks.delete(msg.callbackId)

        let result: any = msg.params
        if (this.responseTransformer) {
            try {
                if (msg.params) {
                    result = this.responseTransformer(msg.params)
                }
                if (result instanceof Error) return cb.reject(result)
            } catch (e) {
                return cb.reject(e instanceof Error ? e : new Error(String(e)))
            }
        }

        // 自动解析 JSON 字符串
        if (typeof result === 'string') {
            try {
                const parsed = JSON.parse(result)
                if (parsed && typeof parsed === 'object') return cb.resolve(parsed)
            } catch {}
        }

        cb.resolve(result)
    }

    /** 处理原生调用 JS */
    private onCallFromNative(msg: string | NativeMessage): void {
        let message: NativeMessage
        if (typeof msg === 'string') {
            try { message = JSON.parse(msg) as NativeMessage }
            catch { return }
        } else { message = msg }

        if (this.nativeHandler && message.method) {
            this.nativeHandler(message.method, message.params)
        }
    }

    /** 设置原生调用处理器 */
    public setNativeHandler(handler: (method: string, data: any) => void): void {
        this.nativeHandler = handler
    }

    /** 移除原生调用处理器 */
    public removeNativeHandler(): void {
        this.nativeHandler = undefined
    }

    /** 设置响应转换函数 */
    public setResponseTransformer(transformer: ResponseTransformer): void {
        this.responseTransformer = transformer
    }

    /** 移除响应转换函数 */
    public removeResponseTransformer(): void {
        this.responseTransformer = undefined
    }
}
