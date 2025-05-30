const { accountService } = require('../services');
const helper = require('../utils/helper');

/**
 * 账户控制器
 */
class AccountController {
    /**
     * 创建账户
     * @param {Object} ctx - Koa上下文
     */
    async createAccount(ctx) {
        try {
            // 创建新账户
            const account = await accountService.createAccount();

            ctx.status = 201;
            ctx.body = helper.formatResponse(
                'ACCOUNT.CREATE_SUCCESS',
                account,
                '账户创建成功',
                'Account created successfully',
                ctx.request.id
            );
        } catch (error) {
            ctx.status = 500;
            ctx.body = helper.formatResponse(
                'ACCOUNT.CREATE_FAILED',
                {},
                '账户创建失败: ' + error.message,
                'Failed to create account: ' + error.message,
                ctx.request.id
            );
        }
    }

    /**
     * 获取账户信息
     * @param {Object} ctx - Koa上下文
     */
    async getAccount(ctx) {
        try {
            const { account_id } = ctx.params;

            // 查询账户
            const account = await accountService.getAccount(account_id);

            if (!account) {
                ctx.status = 404;
                ctx.body = helper.formatResponse(
                    'ACCOUNT.NOT_FOUND',
                    {},
                    '账户不存在',
                    'Account not found',
                    ctx.request.id
                );
                return;
            }

            ctx.body = helper.formatResponse(
                'ACCOUNT.GET_SUCCESS',
                {
                    account_id: account.account_id,
                    balance: account.balance,
                    frozen_balance: account.frozen_balance,
                    create_time: account.create_time
                },
                '获取账户信息成功',
                'Account information retrieved successfully',
                ctx.request.id
            );
        } catch (error) {
            ctx.status = 500;
            ctx.body = helper.formatResponse(
                'ACCOUNT.GET_FAILED',
                {},
                '获取账户信息失败: ' + error.message,
                'Failed to get account information: ' + error.message,
                ctx.request.id
            );
        }
    }

    /**
     * 账户充值
     * @param {Object} ctx - Koa上下文
     */
    async rechargeAccount(ctx) {
        try {
            const { account_id, amount } = ctx.request.body;

            // 验证必要参数
            if (!account_id || !amount) {
                ctx.status = 400;
                ctx.body = helper.formatResponse(
                    'ACCOUNT.INVALID_PARAMS',
                    {},
                    '缺少必要参数',
                    'Missing required parameters',
                    ctx.request.id
                );
                return;
            }

            // 验证金额（必须为整数且大于0）
            const amountNum = Number(amount);
            if (!Number.isInteger(amountNum) || amountNum <= 0) {
                ctx.status = 400;
                ctx.body = helper.formatResponse(
                    'ACCOUNT.INVALID_AMOUNT',
                    {},
                    '无效的充值金额',
                    'Invalid recharge amount',
                    ctx.request.id
                );
                return;
            }

            // 查询账户是否存在
            const account = await accountService.getAccount(account_id);
            if (!account) {
                ctx.status = 404;
                ctx.body = helper.formatResponse(
                    'ACCOUNT.NOT_FOUND',
                    {},
                    '账户不存在',
                    'Account not found',
                    ctx.request.id
                );
                return;
            }

            // 执行充值
            const result = await accountService.recharge(account_id, amountNum);

            ctx.body = helper.formatResponse(
                'ACCOUNT.RECHARGE_SUCCESS',
                {
                    account_id: result.account_id,
                    transaction_id: result.transaction_id,
                    amount: result.amount,
                    balance: result.balance,
                    recharge_time: new Date().toISOString()
                },
                '账户充值成功',
                'Account recharged successfully',
                ctx.request.id
            );
        } catch (error) {
            ctx.status = 500;
            ctx.body = helper.formatResponse(
                'ACCOUNT.RECHARGE_FAILED',
                {},
                '账户充值失败: ' + error.message,
                'Failed to recharge account: ' + error.message,
                ctx.request.id
            );
        }
    }

    /**
     * 账户提现
     * @param {Object} ctx - Koa上下文
     */
    async withdrawAccount(ctx) {
        try {
            const { account_id, amount } = ctx.request.body;

            // 验证必要参数
            if (!account_id || !amount) {
                ctx.status = 400;
                ctx.body = helper.formatResponse(
                    'ACCOUNT.INVALID_PARAMS',
                    {},
                    '缺少必要参数',
                    'Missing required parameters',
                    ctx.request.id
                );
                return;
            }

            // 验证金额（必须为整数且大于0）
            const amountNum = Number(amount);
            if (!Number.isInteger(amountNum) || amountNum <= 0) {
                ctx.status = 400;
                ctx.body = helper.formatResponse(
                    'ACCOUNT.INVALID_AMOUNT',
                    {},
                    '无效的提现金额',
                    'Invalid withdraw amount',
                    ctx.request.id
                );
                return;
            }

            // 查询账户是否存在
            const account = await accountService.getAccount(account_id);
            if (!account) {
                ctx.status = 404;
                ctx.body = helper.formatResponse(
                    'ACCOUNT.NOT_FOUND',
                    {},
                    '账户不存在',
                    'Account not found',
                    ctx.request.id
                );
                return;
            }

            // 检查余额是否充足
            if (account.balance < amountNum) {
                ctx.status = 400;
                ctx.body = helper.formatResponse(
                    'ACCOUNT.INSUFFICIENT_BALANCE',
                    {},
                    '账户余额不足',
                    'Insufficient account balance',
                    ctx.request.id
                );
                return;
            }

            // 执行提现
            const result = await accountService.withdraw(account_id, amountNum);

            ctx.body = helper.formatResponse(
                'ACCOUNT.WITHDRAW_SUCCESS',
                {
                    account_id: result.account_id,
                    transaction_id: result.transaction_id,
                    amount: result.amount,
                    balance: result.balance,
                    withdraw_time: new Date().toISOString()
                },
                '账户提现成功',
                'Account withdrawal successful',
                ctx.request.id
            );
        } catch (error) {
            ctx.status = 500;
            ctx.body = helper.formatResponse(
                'ACCOUNT.WITHDRAW_FAILED',
                {},
                '账户提现失败: ' + error.message,
                'Failed to withdraw from account: ' + error.message,
                ctx.request.id
            );
        }
    }

    /**
     * 账户转账
     * @param {Object} ctx - Koa上下文
     */
    async transferFunds(ctx) {
        try {
            const { from_account, to_account, amount } = ctx.request.body;

            // 验证必要参数
            if (!from_account || !to_account || !amount) {
                ctx.status = 400;
                ctx.body = helper.formatResponse(
                    'ACCOUNT.INVALID_PARAMS',
                    {},
                    '缺少必要参数',
                    'Missing required parameters',
                    ctx.request.id
                );
                return;
            }

            // 验证金额（必须为整数且大于0）
            const amountNum = Number(amount);
            if (!Number.isInteger(amountNum) || amountNum <= 0) {
                ctx.status = 400;
                ctx.body = helper.formatResponse(
                    'ACCOUNT.INVALID_AMOUNT',
                    {},
                    '无效的转账金额',
                    'Invalid transfer amount',
                    ctx.request.id
                );
                return;
            }

            // 检查转出账户
            const fromAccount = await accountService.getAccount(from_account);
            if (!fromAccount) {
                ctx.status = 404;
                ctx.body = helper.formatResponse(
                    'ACCOUNT.FROM_NOT_FOUND',
                    {},
                    '转出账户不存在',
                    'Source account not found',
                    ctx.request.id
                );
                return;
            }

            // 检查转入账户
            const toAccount = await accountService.getAccount(to_account);
            if (!toAccount) {
                ctx.status = 404;
                ctx.body = helper.formatResponse(
                    'ACCOUNT.TO_NOT_FOUND',
                    {},
                    '转入账户不存在',
                    'Destination account not found',
                    ctx.request.id
                );
                return;
            }

            // 检查余额是否充足
            if (fromAccount.balance < amountNum) {
                ctx.status = 400;
                ctx.body = helper.formatResponse(
                    'ACCOUNT.INSUFFICIENT_BALANCE',
                    {},
                    '转出账户余额不足',
                    'Insufficient source account balance',
                    ctx.request.id
                );
                return;
            }

            // 执行转账
            const result = await accountService.transfer(from_account, to_account, amountNum);

            ctx.body = helper.formatResponse(
                'ACCOUNT.TRANSFER_SUCCESS',
                {
                    from_account_id: result.from_account_id,
                    to_account_id: result.to_account_id,
                    transaction_id: result.transaction_id,
                    amount: result.amount,
                    transfer_time: new Date().toISOString()
                },
                '转账成功',
                'Transfer successful',
                ctx.request.id
            );
        } catch (error) {
            ctx.status = 500;
            ctx.body = helper.formatResponse(
                'ACCOUNT.TRANSFER_FAILED',
                {},
                '转账失败: ' + error.message,
                'Failed to transfer funds: ' + error.message,
                ctx.request.id
            );
        }
    }

    /**
     * 获取账户交易记录
     * @param {Object} ctx - Koa上下文
     */
    async getTransactions(ctx) {
        try {
            const { account_id } = ctx.params;
            const { type, start_time, end_time, page = 1, page_size = 10 } = ctx.query;

            // 转换分页参数为数字
            const pageNum = parseInt(page, 10);
            const pageSizeNum = parseInt(page_size, 10);

            // 验证账户是否存在
            const account = await accountService.getAccount(account_id);
            if (!account) {
                ctx.status = 404;
                ctx.body = helper.formatResponse(
                    'ACCOUNT.NOT_FOUND',
                    {},
                    '账户不存在',
                    'Account not found',
                    ctx.request.id
                );
                return;
            }

            // 查询交易记录
            const result = await accountService.getAccountTransactions(
                account_id,
                { type, start_time, end_time },
                pageNum,
                pageSizeNum
            );

            ctx.body = helper.formatResponse(
                'ACCOUNT.TRANSACTIONS_SUCCESS',
                result,
                '交易记录查询成功',
                'Transaction records retrieved successfully',
                ctx.request.id
            );
        } catch (error) {
            ctx.status = 500;
            ctx.body = helper.formatResponse(
                'ACCOUNT.TRANSACTIONS_FAILED',
                {},
                '交易记录查询失败: ' + error.message,
                'Failed to retrieve transaction records: ' + error.message,
                ctx.request.id
            );
        }
    }
}

module.exports = new AccountController(); 