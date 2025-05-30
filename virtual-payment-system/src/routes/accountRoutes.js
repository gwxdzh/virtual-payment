const Router = require('koa-router');
const { accountController } = require('../controllers');
const { signVerify, rateLimiter } = require('../middleware');

const router = new Router({ prefix: '/api/v1/accounts' });

// 创建账户
router.post('/', accountController.createAccount);

// 获取账户信息
router.get('/:account_id', accountController.getAccount);

// 账户充值
router.post('/recharge', accountController.rechargeAccount);

// 账户提现
router.post('/withdraw', accountController.withdrawAccount);

// 账户转账
router.post('/transfer', accountController.transferFunds);

// 获取账户交易记录
router.get('/:account_id/transactions', accountController.getTransactions);

module.exports = router; 