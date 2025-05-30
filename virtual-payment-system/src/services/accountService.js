const { Account, Transaction, sequelize } = require('../models/modelIndex');
const helper = require('../utils/helper');
const { Op } = require('sequelize');

/**
 * 账户服务
 * 处理账户和资金相关的业务逻辑
 */
class AccountService {
    /**
     * 创建账户
     * @returns {Promise<Object>} - 创建的账户信息
     */
    async createAccount() {
        // 生成账户ID
        const account_id = helper.generateAccountId();

        // 创建账户记录
        const account = await Account.create({
            account_id,
            balance: 0,
            frozen_balance: 0
        });

        return {
            account_id: account.account_id,
            balance: account.balance,
            frozen_balance: account.frozen_balance,
            create_time: account.create_time
        };
    }

    /**
     * 获取账户信息
     * @param {string} accountId - 账户ID
     * @returns {Promise<Object|null>} - 账户信息
     */
    async getAccount(accountId) {
        const account = await Account.findOne({
            where: { account_id: accountId }
        });

        return account;
    }

    /**
     * 冻结资金
     * @param {string} accountId - 账户ID
     * @param {number} amount - 冻结金额
     * @returns {Promise<boolean>} - 是否成功
     */
    async freezeBalance(accountId, amount) {
        if (amount <= 0) {
            throw new Error('冻结金额必须大于0');
        }

        // 使用事务确保原子性
        const result = await sequelize.transaction(async (t) => {
            // 查询账户并锁定
            const account = await Account.findOne({
                where: { account_id: accountId },
                lock: t.LOCK.UPDATE,
                transaction: t
            });

            if (!account) {
                throw new Error('账户不存在');
            }

            if (account.balance < amount) {
                throw new Error('余额不足');
            }

            // 减少可用余额，增加冻结余额
            account.balance -= amount;
            account.frozen_balance += amount;
            await account.save({ transaction: t });

            return true;
        });

        return result;
    }

    /**
     * 解冻资金
     * @param {string} accountId - 账户ID
     * @param {number} amount - 解冻金额
     * @returns {Promise<boolean>} - 是否成功
     */
    async unfreezeBalance(accountId, amount) {
        if (amount <= 0) {
            throw new Error('解冻金额必须大于0');
        }

        // 使用事务确保原子性
        const result = await sequelize.transaction(async (t) => {
            // 查询账户并锁定
            const account = await Account.findOne({
                where: { account_id: accountId },
                lock: t.LOCK.UPDATE,
                transaction: t
            });

            if (!account) {
                throw new Error('账户不存在');
            }

            if (account.frozen_balance < amount) {
                throw new Error('冻结余额不足');
            }

            // 减少冻结余额，增加可用余额
            account.frozen_balance -= amount;
            account.balance += amount;
            await account.save({ transaction: t });

            return true;
        });

        return result;
    }

    /**
     * 充值
     * @param {string} accountId - 账户ID
     * @param {number} amount - 充值金额
     * @returns {Promise<Object>} - 充值结果
     */
    async recharge(accountId, amount) {
        if (amount <= 0) {
            throw new Error('充值金额必须大于0');
        }

        // 使用事务确保原子性
        const result = await sequelize.transaction(async (t) => {
            // 查询账户并锁定
            const account = await Account.findOne({
                where: { account_id: accountId },
                lock: t.LOCK.UPDATE,
                transaction: t
            });

            if (!account) {
                throw new Error('账户不存在');
            }

            // 增加余额
            account.balance += amount;
            await account.save({ transaction: t });

            // 创建充值交易记录
            const transaction = await Transaction.create({
                transaction_id: helper.generateTransactionId(),
                order_id: 'RECHARGE' + helper.generateOrderId(),  // 系统内部充值订单
                from_account: 'SYSTEM',  // 系统账户
                to_account: accountId,
                amount,
                type: 3,  // 充值
            }, { transaction: t });

            return {
                account,
                transaction
            };
        });

        return {
            account_id: result.account.account_id,
            balance: result.account.balance,
            transaction_id: result.transaction.transaction_id,
            amount: result.transaction.amount
        };
    }

    /**
     * 提现
     * @param {string} accountId - 账户ID
     * @param {number} amount - 提现金额
     * @returns {Promise<Object>} - 提现结果
     */
    async withdraw(accountId, amount) {
        if (amount <= 0) {
            throw new Error('提现金额必须大于0');
        }

        // 使用事务确保原子性
        const result = await sequelize.transaction(async (t) => {
            // 查询账户并锁定
            const account = await Account.findOne({
                where: { account_id: accountId },
                lock: t.LOCK.UPDATE,
                transaction: t
            });

            if (!account) {
                throw new Error('账户不存在');
            }

            if (account.balance < amount) {
                throw new Error('余额不足');
            }

            // 减少余额
            account.balance -= amount;
            await account.save({ transaction: t });

            // 创建提现交易记录
            const transaction = await Transaction.create({
                transaction_id: helper.generateTransactionId(),
                order_id: 'WITHDRAW' + helper.generateOrderId(),  // 系统内部提现订单
                from_account: accountId,
                to_account: 'SYSTEM',  // 系统账户
                amount,
                type: 4,  // 提现
            }, { transaction: t });

            return {
                account,
                transaction
            };
        });

        return {
            account_id: result.account.account_id,
            balance: result.account.balance,
            transaction_id: result.transaction.transaction_id,
            amount: result.transaction.amount
        };
    }

    /**
     * 转账
     * @param {string} fromAccountId - 转出账户ID
     * @param {string} toAccountId - 转入账户ID
     * @param {number} amount - 转账金额
     * @param {string} orderId - 关联订单ID
     * @returns {Promise<Object>} - 转账结果
     */
    async transfer(fromAccountId, toAccountId, amount, orderId) {
        if (amount <= 0) {
            throw new Error('转账金额必须大于0');
        }

        if (fromAccountId === toAccountId) {
            throw new Error('不能转账给自己');
        }

        // 使用事务确保原子性
        const result = await sequelize.transaction(async (t) => {
            // 查询转出账户并锁定
            const fromAccount = await Account.findOne({
                where: { account_id: fromAccountId },
                lock: t.LOCK.UPDATE,
                transaction: t
            });

            if (!fromAccount) {
                throw new Error('转出账户不存在');
            }

            if (fromAccount.balance < amount) {
                throw new Error('转出账户余额不足');
            }

            // 查询转入账户并锁定
            const toAccount = await Account.findOne({
                where: { account_id: toAccountId },
                lock: t.LOCK.UPDATE,
                transaction: t
            });

            if (!toAccount) {
                throw new Error('转入账户不存在');
            }

            // 减少转出账户余额
            fromAccount.balance -= amount;
            await fromAccount.save({ transaction: t });

            // 增加转入账户余额
            toAccount.balance += amount;
            await toAccount.save({ transaction: t });

            // 创建转账交易记录
            const transaction = await Transaction.create({
                transaction_id: helper.generateTransactionId(),
                order_id: orderId || 'TRANSFER' + helper.generateOrderId(),
                from_account: fromAccountId,
                to_account: toAccountId,
                amount,
                type: 1,  // 支付/转账
            }, { transaction: t });

            return {
                fromAccount,
                toAccount,
                transaction
            };
        });

        return {
            from_account_id: result.fromAccount.account_id,
            to_account_id: result.toAccount.account_id,
            transaction_id: result.transaction.transaction_id,
            amount: result.transaction.amount
        };
    }

    /**
     * 获取账户交易记录
     * @param {string} accountId - 账户ID
     * @param {Object} params - 查询参数
     * @param {number} page - 页码
     * @param {number} pageSize - 每页数量
     * @returns {Promise<Object>} - 分页交易记录
     */
    async getAccountTransactions(accountId, params = {}, page = 1, pageSize = 10) {
        const { type, start_time, end_time } = params;

        const whereClause = {
            [Op.or]: [
                { from_account: accountId },
                { to_account: accountId }
            ]
        };

        // 根据交易类型过滤
        if (type !== undefined && type !== null) {
            whereClause.type = type;
        }

        // 根据时间范围过滤
        if (start_time && end_time) {
            whereClause.create_time = {
                [Op.between]: [new Date(start_time), new Date(end_time)]
            };
        } else if (start_time) {
            whereClause.create_time = { [Op.gte]: new Date(start_time) };
        } else if (end_time) {
            whereClause.create_time = { [Op.lte]: new Date(end_time) };
        }

        const offset = (page - 1) * pageSize;

        const { count, rows } = await Transaction.findAndCountAll({
            where: whereClause,
            limit: pageSize,
            offset,
            order: [['create_time', 'DESC']]
        });

        // 标记收入和支出
        const transactions = rows.map(transaction => {
            const isIncome = transaction.to_account === accountId;
            return {
                ...transaction.toJSON(),
                is_income: isIncome,
                amount_display: isIncome ? `+${transaction.amount}` : `-${transaction.amount}`
            };
        });

        return {
            total: count,
            current_page: page,
            page_size: pageSize,
            total_pages: Math.ceil(count / pageSize),
            data: transactions
        };
    }
}

module.exports = new AccountService(); 