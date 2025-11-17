import type { Platform, WindowWithBridge } from './types'

/**
 * 检测当前运行平台
 * @returns 平台类型
 */
export function detectPlatform(): Platform {
    if (typeof window === 'undefined') return 'unknown'

    const win = window as WindowWithBridge

    if (win.AndroidBridge) return 'android'
    if (win.webkit?.messageHandlers?.iOSBridge) return 'ios'

    const ua = navigator.userAgent
    if (/Android/i.test(ua)) return 'android'
    if (/iPhone|iPad/i.test(ua)) return 'ios'

    return 'web'
}
