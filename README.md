# 虚拟支付系统后台管理

基于 Vue3 + Element Plus + Axios 开发的虚拟支付系统后台管理界面，实现对商户、订单、账户、交易记录的可视化管理。

## 功能特性

- 权限管理：角色权限控制，动态加载菜单，权限验证
- 商户管理：商户信息展示、搜索、创建和编辑
- 订单管理：订单查询、状态变更、退款操作
- 账户管理：账户余额查询、资金冻结/解冻
- 交易管理：交易报表、明细查询、数据导出
- 数据可视化：交易趋势图、渠道分布图
- 系统监控：实时指标、日志审计

## 技术栈

- 前端框架：Vue 3.x（组合式 API）
- 状态管理：Pinia
- 路由管理：Vue Router
- UI 组件库：Element Plus
- HTTP 请求：Axios
- 构建工具：Vite
- 数据可视化：ECharts

## 项目启动

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产环境
npm run build

# 代码检查
npm run lint
```

## 目录结构

```
virtual-payment-admin/
├── public/             # 静态资源
├── src/                # 源代码
│   ├── api/            # 接口请求
│   ├── assets/         # 静态资源
│   ├── components/     # 公共组件
│   ├── layout/         # 页面布局组件
│   ├── router/         # 路由配置
│   ├── stores/         # 状态管理
│   ├── utils/          # 工具函数
│   ├── views/          # 页面视图
│   ├── App.vue         # 根组件
│   └── main.js         # 入口文件
├── .eslintrc.js        # ESLint 配置
├── index.html          # HTML 模板
├── package.json        # 项目依赖
├── README.md           # 项目说明
└── vite.config.js      # Vite 配置
```

## 开发规范

- 组件命名采用大驼峰方式
- 文件夹和文件采用小写+连字符方式
- API 请求统一在 api 目录下管理
- 公共组件在 components 目录下开发
- 工具函数在 utils 目录下管理

## 环境配置

- 开发环境：`.env.development`
- 测试环境：`.env.staging`
- 生产环境：`.env.production`

## 作者

- gwx
