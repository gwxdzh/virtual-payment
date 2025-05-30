const Router = require('koa-router');
const { merchantController } = require('../controllers');
const { signVerify, rateLimiter } = require('../middleware');

const router = new Router({ prefix: '/api/v1/merchants' });

// 创建商户（不需要签名验证，仅在开发阶段使用）
router.post('/', merchantController.createMerchant);

// 获取商户信息（需要签名验证）
router.post('/info', signVerify, rateLimiter(), merchantController.getMerchant);

// 更新商户信息（需要签名验证）
router.post('/update', signVerify, rateLimiter(), merchantController.updateMerchant);

// 重新生成商户密钥（需要签名验证）
router.post('/regenerate-keys', signVerify, rateLimiter(), merchantController.regenerateKeys);

// 搜索商户（不需要签名验证，仅供管理后台使用）
router.get('/search', merchantController.searchMerchants);

module.exports = router; 