const Router = require('koa-router');
const { orderController } = require('../controllers');
const { signVerify, rateLimiter } = require('../middleware');

const router = new Router({ prefix: '/api/v1/orders' });

// 创建订单（需要签名验证）
router.post('/create', signVerify, rateLimiter(), orderController.createOrder);

// 查询订单（需要签名验证）
router.post('/query', signVerify, rateLimiter(), orderController.queryOrder);

// 关闭订单（需要签名验证）
router.post('/close', signVerify, rateLimiter(), orderController.closeOrder);

// 模拟支付订单（开发测试用）
router.post('/pay', orderController.payOrder);

// 获取订单列表（需要签名验证）
router.get('/list', signVerify, rateLimiter(), orderController.getOrderList);

module.exports = router; 