/**
 * 判断是否是外部链接
 * @param {string} path
 * @returns {boolean}
 */
export function isExternal(path) {
    return /^(https?:|mailto:|tel:)/.test(path)
}

/**
 * 判断是否是URL
 * @param {string} url
 * @returns {boolean}
 */
export function validURL(url) {
    const reg = /^(https?|ftp):\/\/([a-zA-Z0-9.-]+(:[a-zA-Z0-9.&%$-]+)*@)*((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}|([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.(com|edu|gov|int|mil|net|org|biz|arpa|info|name|pro|aero|coop|museum|[a-zA-Z]{2}))(:[0-9]+)*(\/($|[a-zA-Z0-9.,?'\\+&%$#=~_-]+))*$/
    return reg.test(url)
}

/**
 * 判断是否是小写字母
 * @param {string} str
 * @returns {boolean}
 */
export function validLowerCase(str) {
    const reg = /^[a-z]+$/
    return reg.test(str)
}

/**
 * 判断是否是大写字母
 * @param {string} str
 * @returns {boolean}
 */
export function validUpperCase(str) {
    const reg = /^[A-Z]+$/
    return reg.test(str)
}

/**
 * 判断是否是字母
 * @param {string} str
 * @returns {boolean}
 */
export function validAlphabets(str) {
    const reg = /^[A-Za-z]+$/
    return reg.test(str)
}

/**
 * 判断是否是有效邮箱
 * @param {string} email
 * @returns {boolean}
 */
export function validEmail(email) {
    const reg = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return reg.test(email)
}

/**
 * 判断是否是手机号码
 * @param {string} phone
 * @returns {boolean}
 */
export function validPhone(phone) {
    const reg = /^1[3456789]\d{9}$/
    return reg.test(phone)
} 