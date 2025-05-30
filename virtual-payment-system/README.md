# 虚拟支付系统

基于 Node.js 和 MySQL 实现的虚拟支付系统，提供支付接口、订单管理、账户操作等功能。

## 功能特性

- 多渠道支付接口集成
- 完整的订单生命周期管理
- 安全的账户余额操作
- 商户管理与认证
- 交易记录查询与统计
- 完善的日志记录与管理系统

## 技术栈

- 后端框架：Koa 2
- 数据库：MySQL + Sequelize ORM
- 缓存：Redis
- 安全：签名验证、防重放攻击、限流控制
- 工具：JWT、加密算法
- 日志：Winston、按日期分割日志文件

## 环境要求

- Node.js >= 14.0.0
- MySQL >= 5.7
- Redis >= 6.0
- npm 或 yarn

## 快速开始

### 安装依赖

```bash
npm install
```

### 配置环境变量

```bash
cp .env.example .env
# 编辑.env文件，填入正确的数据库配置等信息
```

### 初始化数据库

```bash
# 导入初始化SQL脚本
mysql -u username -p < db/init.sql

# 或使用内置脚本初始化数据库
npm run initdb
```

### 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

## 日志系统

系统集成了完善的日志记录功能，支持按日期分割日志文件、日志级别分类存储等特性。

### 日志分类

- 信息日志：记录系统正常运行的信息性日志
- 错误日志：记录系统错误和异常情况
- 请求日志：记录所有 HTTP 请求的详细信息
- 安全日志：记录与系统安全相关的事件
- 数据库日志：记录数据库操作相关信息
- 支付日志：记录支付相关的操作信息

### 日志管理命令

```bash
# 查看日志统计信息
npm run logs:stats

# 归档旧日志文件（默认7天前）
npm run logs:archive

# 删除旧日志文件（默认30天前）
npm run logs:delete
```

## API 文档

系统 API 主要分为三大类：

### 商户相关 API

- `POST /api/v1/merchants` - 创建商户
- `POST /api/v1/merchants/info` - 获取商户信息
- `POST /api/v1/merchants/update` - 更新商户信息
- `POST /api/v1/merchants/regenerate-keys` - 重新生成商户密钥

### 订单相关 API

- `POST /api/v1/orders/create` - 创建订单
- `POST /api/v1/orders/query` - 查询订单
- `POST /api/v1/orders/close` - 关闭订单
- `POST /api/v1/orders/pay` - 支付订单（测试用）
- `GET /api/v1/orders/list` - 获取订单列表

### 账户相关 API

- `POST /api/v1/accounts` - 创建账户
- `GET /api/v1/accounts/:account_id` - 获取账户信息
- `POST /api/v1/accounts/recharge` - 账户充值
- `POST /api/v1/accounts/withdraw` - 账户提现
- `POST /api/v1/accounts/transfer` - 账户转账
- `GET /api/v1/accounts/:account_id/transactions` - 获取账户交易记录

## 请求签名说明

商户接口调用需要进行签名验证，签名算法如下：

1. 按参数名 ASCII 码升序排列所有请求参数（除 sign 外）
2. 使用键值对格式拼接参数字符串：key1=value1&key2=value2&...
3. 使用商户私钥对字符串进行 HMAC-SHA256 签名
4. 将签名结果以 sign 参数传递

## 项目结构

```
virtual-payment-system/
├── db/                  # 数据库脚本
│   └── init.sql         # 数据库初始化脚本
├── logs/                # 日志文件目录
├── scripts/             # 脚本工具
│   ├── initdb.js        # 数据库初始化脚本
│   └── logManager.js    # 日志管理工具
├── src/
│   ├── controllers/     # 控制器层
│   ├── middleware/      # 中间件
│   ├── models/          # 数据模型
│   ├── routes/          # 路由定义
│   ├── services/        # 业务逻辑服务
│   ├── utils/           # 工具类
│   │   └── logger.js    # 日志工具模块
│   └── app.js           # 应用入口
├── .env.example         # 环境变量示例
├── .gitignore           # Git忽略配置
├── package.json         # 项目依赖
└── README.md            # 项目说明
```

## 部署说明

生产环境部署建议：

1. 使用 PM2 进行进程管理
2. 配置 Nginx 作为反向代理
3. 开启 HTTPS
4. 配置 MySQL 主从复制
5. 配置 Redis 集群
6. 配置日志轮转和归档策略

## 开发团队

- 虚拟支付系统开发团队

## 许可证

ISC
