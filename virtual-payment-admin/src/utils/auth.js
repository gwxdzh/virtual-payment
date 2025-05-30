const TOKEN_KEY = 'virtual_payment_token'

export function getToken() {
    return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
    return localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken() {
    return localStorage.removeItem(TOKEN_KEY)
} 