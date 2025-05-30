
# 虚拟支付系统API文档

## 目录

- [基础信息](#基础信息)
  - [接口基础URL](#接口基础url)
  - [公共请求参数](#公共请求参数)
  - [统一响应格式](#统一响应格式)
  - [签名算法说明](#签名算法说明)
- [商户相关API](#商户相关api)
  - [创建商户](#创建商户)
  - [获取商户信息](#获取商户信息)
  - [更新商户信息](#更新商户信息)
  - [重新生成商户密钥](#重新生成商户密钥)
  - [搜索商户](#搜索商户)
- [订单相关API](#订单相关api)
  - [创建订单](#创建订单)
  - [查询订单](#查询订单)
  - [关闭订单](#关闭订单)
  - [支付订单](#支付订单)
  - [获取订单列表](#获取订单列表)
- [账户相关API](#账户相关api)
  - [创建账户](#创建账户)
  - [获取账户信息](#获取账户信息)
  - [账户充值](#账户充值)
  - [账户提现](#账户提现)
  - [账户转账](#账户转账)
  - [获取账户交易记录](#获取账户交易记录)
- [错误码对照表](#错误码对照表)

## 基础信息

### 接口基础URL

开发环境：`http://localhost:3000/api/v1`

### 公共请求参数

| 参数名 | 类型 | 必须 | 说明 |
| --- | --- | --- | --- |
| app_id | String | 是 | 商户ID（merchant_id） |
| timestamp | String | 是 | 请求时间戳（YYYYMMDDHHMMSS，有效期5分钟） |
| nonce_str | String | 是 | 随机字符串（防重放，有效期300秒） |
| sign | String | 是 | HMAC-SHA256签名值 |
| sign_type | String | 否 | 签名类型（固定值：HMAC-SHA256） |

### 统一响应格式

```json
{
  "code": "PAYMENT.SUCCESS",          // 错误码（模块.状态）
  "localized_msg": {
    "zh_CN": "操作成功",
    "en_US": "Operation succeeded"
  },
  "data": {                           // 业务数据
    "order_id": "20250519153000001",
    "pay_url": "https://pay.example.com/qr/123"
  },
  "debug_id": "a1b2c3d4e5f6",         // 唯一请求标识（用于日志追踪）
  "timestamp": "2025-05-19T15:30:00+08:00" // ISO 8601时间格式
}
```

### 签名算法说明

1. 参数排序：按参数名ASCII码升序排列（忽略大小写）
2. 拼接字符串：`key1=value1&key2=value2&...&keyN=valueN`
3. 生成签名：使用商户私钥进行HMAC-SHA256计算，结果转十六进制大写

```javascript
// 签名算法示例代码
const crypto = require('crypto');
function generateSign(params, secretKey) {
  // 按照ASCII码升序排列参数名
  const sortedKeys = Object.keys(params).sort();
  
  // 过滤sign参数
  const filteredKeys = sortedKeys.filter(key => key !== 'sign');
  
  // 拼接参数字符串
  const signString = filteredKeys.map(key => `${key}=${params[key]}`).join('&');
  
  // 计算HMAC-SHA256签名
  const hmac = crypto.createHmac('sha256', secretKey);
  return hmac.update(signString).digest('hex').toUpperCase();
}
```

## 商户相关API

### 创建商户

> 创建新商户账号（仅开发环境可用）

**请求方式：** POST

**接口URL：** `/merchants`

**请求参数：**

| 参数名 | 类型 | 必须 | 说明 |
| --- | --- | --- | --- |
| merchant_name | String | 是 | 商户名称 |

**响应参数：**

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| merchant_id | String | 商户唯一标识 |
| merchant_name | String | 商户名称 |
| public_key | String | 商户公钥 |
| create_time | String | 创建时间 |

**请求示例：**

```json
{
  "merchant_name": "测试商户"
}
```

**响应示例：**

```json
{
  "code": "MERCHANT.CREATE_SUCCESS",
  "localized_msg": {
    "zh_CN": "商户创建成功",
    "en_US": "Merchant created successfully"
  },
  "data": {
    "merchant_id": "M9a8b7c6d5e4f3g2h1i",
    "merchant_name": "测试商户",
    "public_key": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----",
    "create_time": "2023-05-19T15:30:00.000Z"
  },
  "debug_id": "a1b2c3d4e5f6",
  "timestamp": "2023-05-19T15:30:00.000Z"
}
```

### 获取商户信息

> 获取商户的基本信息

**请求方式：** POST

**接口URL：** `/merchants/info`

**请求参数：**

| 参数名 | 类型 | 必须 | 说明 |
| --- | --- | --- | --- |
| app_id | String | 是 | 商户ID |
| timestamp | String | 是 | 请求时间戳 |
| nonce_str | String | 是 | 随机字符串 |
| sign | String | 是 | 签名 |

**响应参数：**

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| merchant_id | String | 商户唯一标识 |
| merchant_name | String | 商户名称 |
| public_key | String | 商户公钥 |
| create_time | String | 创建时间 |

### 更新商户信息

> 更新商户的基本信息

**请求方式：** POST

**接口URL：** `/merchants/update`

**请求参数：**

| 参数名 | 类型 | 必须 | 说明 |
| --- | --- | --- | --- |
| app_id | String | 是 | 商户ID |
| merchant_name | String | 是 | 商户名称 |
| timestamp | String | 是 | 请求时间戳 |
| nonce_str | String | 是 | 随机字符串 |
| sign | String | 是 | 签名 |

**响应参数：**

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| merchant_id | String | 商户唯一标识 |
| merchant_name | String | 商户名称 |

### 重新生成商户密钥

> 重新生成商户的密钥对

**请求方式：** POST

**接口URL：** `/merchants/regenerate-keys`

**请求参数：**

| 参数名 | 类型 | 必须 | 说明 |
| --- | --- | --- | --- |
| app_id | String | 是 | 商户ID |
| timestamp | String | 是 | 请求时间戳 |
| nonce_str | String | 是 | 随机字符串 |
| sign | String | 是 | 签名 |

**响应参数：**

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| merchant_id | String | 商户唯一标识 |
| public_key | String | 新生成的公钥 |

### 搜索商户

> 搜索商户列表（仅管理后台使用）

**请求方式：** GET

**接口URL：** `/merchants/search`

**请求参数：**

| 参数名 | 类型 | 必须 | 说明 |
| --- | --- | --- | --- |
| merchant_name | String | 否 | 商户名称关键词 |
| page | Number | 否 | 页码（默认1） |
| page_size | Number | 否 | 每页数量（默认10） |

**响应参数：**

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| total | Number | 总记录数 |
| current_page | Number | 当前页码 |
| page_size | Number | 每页数量 |
| total_pages | Number | 总页数 |
| data | Array | 商户列表 |

## 订单相关API

### 创建订单

> 创建支付订单

**请求方式：** POST

**接口URL：** `/orders/create`

**请求参数：**

| 参数名 | 类型 | 必须 | 说明 |
| --- | --- | --- | --- |
| app_id | String | 是 | 商户ID |
| merchant_order_id | String | 是 | 商户订单号 |
| amount | Number | 是 | 订单金额（单位：分） |
| currency | String | 否 | 货币类型（默认CNY） |
| channel | String | 是 | 支付渠道（QR_CODE/ALIPAY/WECHAT_PAY） |
| notify_url | String | 否 | 异步通知地址 |
| product_desc | String | 否 | 商品描述 |
| timestamp | String | 是 | 请求时间戳 |
| nonce_str | String | 是 | 随机字符串 |
| sign | String | 是 | 签名 |

**响应参数：**

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| order_id | String | 系统订单号 |
| merchant_order_id | String | 商户订单号 |
| amount | Number | 订单金额 |
| currency | String | 货币类型 |
| status | Number | 订单状态 |
| create_time | String | 创建时间 |
| pay_type | String | 支付类型 |
| pay_url | String | 支付链接 |

**响应示例：**

```json
{
  "code": "ORDER.CREATE_SUCCESS",
  "localized_msg": {
    "zh_CN": "订单创建成功",
    "en_US": "Order created successfully"
  },
  "data": {
    "order_id": "20230519153000001",
    "merchant_order_id": "M20230519001",
    "amount": 10000,
    "currency": "CNY",
    "status": 0,
    "create_time": "2023-05-19T15:30:00.000Z",
    "pay_type": "QR_CODE",
    "pay_url": "https://pay.example.com/generate-qr?order_id=20230519153000001"
  },
  "debug_id": "a1b2c3d4e5f6",
  "timestamp": "2023-05-19T15:30:00.000Z"
}
```

### 查询订单

> 查询订单状态和信息

**请求方式：** POST

**接口URL：** `/orders/query`

**请求参数：**

| 参数名 | 类型 | 必须 | 说明 |
| --- | --- | --- | --- |
| app_id | String | 是 | 商户ID |
| order_id | String | 否 | 系统订单号（与merchant_order_id二选一） |
| merchant_order_id | String | 否 | 商户订单号（与order_id二选一） |
| timestamp | String | 是 | 请求时间戳 |
| nonce_str | String | 是 | 随机字符串 |
| sign | String | 是 | 签名 |

**响应参数：**

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| order_id | String | 系统订单号 |
| merchant_order_id | String | 商户订单号 |
| merchant_id | String | 商户ID |
| amount | Number | 订单金额 |
| currency | String | 货币类型 |
| channel | String | 支付渠道 |
| status | Number | 订单状态（0=待支付，1=已支付，2=已关闭，3=部分退款，4=全额退款） |
| create_time | String | 创建时间 |

### 关闭订单

> 关闭未支付的订单

**请求方式：** POST

**接口URL：** `/orders/close`

**请求参数：**

| 参数名 | 类型 | 必须 | 说明 |
| --- | --- | --- | --- |
| app_id | String | 是 | 商户ID |
| order_id | String | 否 | 系统订单号（与merchant_order_id二选一） |
| merchant_order_id | String | 否 | 商户订单号（与order_id二选一） |
| timestamp | String | 是 | 请求时间戳 |
| nonce_str | String | 是 | 随机字符串 |
| sign | String | 是 | 签名 |

**响应参数：**

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| order_id | String | 系统订单号 |
| merchant_order_id | String | 商户订单号 |
| status | Number | 订单状态（2=已关闭） |

### 支付订单

> 模拟支付订单（仅开发测试环境使用）

**请求方式：** POST

**接口URL：** `/orders/pay`

**请求参数：**

| 参数名 | 类型 | 必须 | 说明 |
| --- | --- | --- | --- |
| order_id | String | 是 | 系统订单号 |
| from_account | String | 是 | 付款账户ID |
| to_account | String | 是 | 收款账户ID |

**响应参数：**

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| order_id | String | 系统订单号 |
| transaction_id | String | 交易ID |
| amount | Number | 支付金额 |
| currency | String | 货币类型 |
| status | Number | 订单状态（1=已支付） |
| pay_time | String | 支付时间 |

### 获取订单列表

> 获取商户的订单列表

**请求方式：** GET

**接口URL：** `/orders/list`

**请求参数：**

| 参数名 | 类型 | 必须 | 说明 |
| --- | --- | --- | --- |
| app_id | String | 是 | 商户ID |
| status | Number | 否 | 订单状态 |
| start_time | String | 否 | 开始时间 |
| end_time | String | 否 | 结束时间 |
| page | Number | 否 | 页码（默认1） |
| page_size | Number | 否 | 每页数量（默认10） |
| timestamp | String | 是 | 请求时间戳 |
| nonce_str | String | 是 | 随机字符串 |
| sign | String | 是 | 签名 |

**响应参数：**

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| total | Number | 总记录数 |
| current_page | Number | 当前页码 |
| page_size | Number | 每页数量 |
| total_pages | Number | 总页数 |
| data | Array | 订单列表 |

## 账户相关API

### 创建账户

> 创建虚拟账户

**请求方式：** POST

**接口URL：** `/accounts`

**请求参数：** 无

**响应参数：**

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| account_id | String | 账户ID |
| balance | Number | 账户余额 |
| frozen_balance | Number | 冻结余额 |
| create_time | String | 创建时间 |

### 获取账户信息

> 获取账户余额和信息

**请求方式：** GET

**接口URL：** `/accounts/:account_id`

**请求参数：**

| 参数名 | 类型 | 必须 | 说明 |
| --- | --- | --- | --- |
| account_id | String | 是 | 账户ID（路径参数） |

**响应参数：**

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| account_id | String | 账户ID |
| balance | Number | 账户余额 |
| frozen_balance | Number | 冻结余额 |
| create_time | String | 创建时间 |

### 账户充值

> 向账户充值金额

**请求方式：** POST

**接口URL：** `/accounts/recharge`

**请求参数：**

| 参数名 | 类型 | 必须 | 说明 |
| --- | --- | --- | --- |
| account_id | String | 是 | 账户ID |
| amount | Number | 是 | 充值金额（单位：分） |

**响应参数：**

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| account_id | String | 账户ID |
| transaction_id | String | 交易ID |
| amount | Number | 充值金额 |
| balance | Number | 充值后余额 |
| recharge_time | String | 充值时间 |

### 账户提现

> 从账户提取金额

**请求方式：** POST

**接口URL：** `/accounts/withdraw`

**请求参数：**

| 参数名 | 类型 | 必须 | 说明 |
| --- | --- | --- | --- |
| account_id | String | 是 | 账户ID |
| amount | Number | 是 | 提现金额（单位：分） |

**响应参数：**

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| account_id | String | 账户ID |
| transaction_id | String | 交易ID |
| amount | Number | 提现金额 |
| balance | Number | 提现后余额 |
| withdraw_time | String | 提现时间 |

### 账户转账

> 账户间资金转账

**请求方式：** POST

**接口URL：** `/accounts/transfer`

**请求参数：**

| 参数名 | 类型 | 必须 | 说明 |
| --- | --- | --- | --- |
| from_account | String | 是 | 转出账户ID |
| to_account | String | 是 | 转入账户ID |
| amount | Number | 是 | 转账金额（单位：分） |

**响应参数：**

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| from_account_id | String | 转出账户ID |
| to_account_id | String | 转入账户ID |
| transaction_id | String | 交易ID |
| amount | Number | 转账金额 |
| transfer_time | String | 转账时间 |

### 获取账户交易记录

> 查询账户的交易记录

**请求方式：** GET

**接口URL：** `/accounts/:account_id/transactions`

**请求参数：**

| 参数名 | 类型 | 必须 | 说明 |
| --- | --- | --- | --- |
| account_id | String | 是 | 账户ID（路径参数） |
| type | Number | 否 | 交易类型（1=支付，2=退款，3=充值，4=提现，5=分账） |
| start_time | String | 否 | 开始时间 |
| end_time | String | 否 | 结束时间 |
| page | Number | 否 | 页码（默认1） |
| page_size | Number | 否 | 每页数量（默认10） |

**响应参数：**

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| total | Number | 总记录数 |
| current_page | Number | 当前页码 |
| page_size | Number | 每页数量 |
| total_pages | Number | 总页数 |
| data | Array | 交易记录列表 |

**数据项说明：**

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| transaction_id | String | 交易ID |
| order_id | String | 关联订单号 |
| amount | Number | 交易金额 |
| type | Number | 交易类型 |
| is_income | Boolean | 是否收入 |
| amount_display | String | 显示金额（带正负号） |
| create_time | String | 交易时间 |

## 错误码对照表

| 错误码 | 中文描述 | 英文描述 | 处理建议 |
| --- | --- | --- | --- |
| SYSTEM.ERROR | 系统内部错误 | Internal server error | 请联系技术支持 |
| SYSTEM.NOT_FOUND | 请求的资源不存在 | Requested resource not found | 检查请求URL是否正确 |
| PAYMENT.MISSING_PARAM | 缺少必要参数 | Missing required parameters | 检查请求参数是否完整 |
| PAYMENT.INVALID_SIGN | 签名验证失败 | Invalid signature | 检查签名算法和私钥是否正确 |
| PAYMENT.EXPIRED_TIMESTAMP | 请求已过期 | Request expired | 检查服务器时间是否同步 |
| PAYMENT.DUPLICATE_REQUEST | 重复请求 | Duplicate request | 使用新的nonce_str重试 |
| PAYMENT.RATE_LIMIT_EXCEEDED | 请求频率超出限制 | Rate limit exceeded | 降低请求频率 |
| MERCHANT.INVALID_PARAMS | 商户参数无效 | Invalid merchant parameters | 检查参数格式是否正确 |
| MERCHANT.NOT_FOUND | 商户不存在 | Merchant not found | 检查商户ID是否正确 |
| ORDER.INVALID_PARAMS | 订单参数无效 | Invalid order parameters | 检查订单参数是否符合要求 |
| ORDER.INVALID_AMOUNT | 无效的订单金额 | Invalid order amount | 金额必须为正整数（单位：分） |
| ORDER.NOT_FOUND | 订单不存在 | Order not found | 检查订单号是否正确 |
| ORDER.ACCESS_DENIED | 无权访问订单 | Access denied | 订单不属于当前商户 |
| ORDER.INVALID_STATUS | 订单状态不允许操作 | Invalid order status | 检查订单当前状态 |
| ORDER.CLOSE_CONFLICT | 订单状态已变更 | Order status changed | 重新查询订单状态 |
| ACCOUNT.NOT_FOUND | 账户不存在 | Account not found | 检查账户ID是否正确 |
| ACCOUNT.INSUFFICIENT_BALANCE | 账户余额不足 | Insufficient balance | 请先充值 |
