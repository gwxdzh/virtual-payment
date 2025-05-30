const { Order, Transaction, sequelize } = require('../models/modelIndex');
const helper = require('../utils/helper');
const { Op } = require('sequelize');

/**
 * 订单服务
 * 处理订单相关的业务逻辑
 */
class OrderService {
    /**
     * 创建订单
     * @param {Object} orderData - 订单数据
     * @returns {Promise<Object>} - 创建的订单
     */
    async createOrder(orderData) {
        const {
            merchant_id,
            merchant_order_id,
            amount,
            currency = 'CNY',
            channel,
            notify_url,
            product_desc
        } = orderData;

        // 生成系统订单号
        const order_id = helper.generateOrderId();

        // 使用事务确保订单创建的原子性
        const result = await sequelize.transaction(async (t) => {
            // 创建订单记录
            const order = await Order.create({
                order_id,
                merchant_order_id,
                merchant_id,
                amount,
                currency,
                channel,
                status: 0,  // 初始状态：待支付
                version: 0,
                notify_url
            }, { transaction: t });

            return order;
        });

        // 返回订单基本信息
        return {
            order_id: result.order_id,
            merchant_order_id: result.merchant_order_id,
            amount: result.amount,
            currency: result.currency,
            status: result.status,
            create_time: result.create_time
        };
    }

    /**
     * 根据订单号查询订单
     * @param {string} orderId - 系统订单号
     * @returns {Promise<Object|null>} - 订单信息
     */
    async getOrderById(orderId) {
        const order = await Order.findOne({
            where: { order_id: orderId },
            include: ['merchant']
        });

        return order;
    }

    /**
     * 根据商户订单号查询订单
     * @param {string} merchantOrderId - 商户订单号
     * @param {string} merchantId - 商户ID
     * @returns {Promise<Object|null>} - 订单信息
     */
    async getOrderByMerchantOrderId(merchantOrderId, merchantId) {
        const order = await Order.findOne({
            where: {
                merchant_order_id: merchantOrderId,
                merchant_id: merchantId
            }
        });

        return order;
    }

    /**
     * 更新订单状态
     * @param {string} orderId - 系统订单号
     * @param {number} status - 新状态
     * @param {number} currentVersion - 当前版本号（乐观锁）
     * @returns {Promise<boolean>} - 是否更新成功
     */
    async updateOrderStatus(orderId, status, currentVersion) {
        const [updatedRows] = await Order.update(
            {
                status,
                version: currentVersion + 1
            },
            {
                where: {
                    order_id: orderId,
                    version: currentVersion
                }
            }
        );

        return updatedRows > 0;
    }

    /**
     * 关闭订单
     * @param {string} orderId - 系统订单号
     * @param {number} currentVersion - 当前版本号
     * @returns {Promise<boolean>} - 是否关闭成功
     */
    async closeOrder(orderId, currentVersion) {
        // 只有待支付的订单才能关闭
        const [updatedRows] = await Order.update(
            {
                status: 2,  // 已关闭
                version: currentVersion + 1
            },
            {
                where: {
                    order_id: orderId,
                    status: 0,  // 待支付
                    version: currentVersion
                }
            }
        );

        return updatedRows > 0;
    }

    /**
     * 查询商户的订单列表
     * @param {string} merchantId - 商户ID
     * @param {Object} params - 查询参数
     * @param {number} page - 页码
     * @param {number} pageSize - 每页数量
     * @returns {Promise<Object>} - 分页订单列表
     */
    async getOrdersByMerchant(merchantId, params = {}, page = 1, pageSize = 10) {
        const { status, start_time, end_time } = params;

        const whereClause = { merchant_id: merchantId };

        // 根据状态过滤
        if (status !== undefined && status !== null) {
            whereClause.status = status;
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

        const { count, rows } = await Order.findAndCountAll({
            where: whereClause,
            limit: pageSize,
            offset,
            order: [['create_time', 'DESC']]
        });

        return {
            total: count,
            current_page: page,
            page_size: pageSize,
            total_pages: Math.ceil(count / pageSize),
            data: rows
        };
    }

    /**
     * 获取订单的交易记录
     * @param {string} orderId - 系统订单号
     * @returns {Promise<Array>} - 交易记录列表
     */
    async getOrderTransactions(orderId) {
        const transactions = await Transaction.findAll({
            where: { order_id: orderId },
            order: [['create_time', 'DESC']]
        });

        return transactions;
    }

    /**
     * 处理订单支付
     * @param {string} orderId - 系统订单号
     * @param {string} fromAccount - 支付方账户
     * @param {string} toAccount - 收款方账户
     * @returns {Promise<Object>} - 支付结果
     */
    async processPayment(orderId, fromAccount, toAccount) {
        // 使用事务确保支付过程的原子性
        const result = await sequelize.transaction(async (t) => {
            // 1. 查询订单信息
            const order = await Order.findOne({
                where: { order_id: orderId },
                lock: t.LOCK.UPDATE,
                transaction: t
            });

            if (!order) {
                throw new Error('订单不存在');
            }

            if (order.status !== 0) {
                throw new Error('订单状态不正确，无法支付');
            }

            // 2. 更新订单状态为已支付
            order.status = 1;
            order.version += 1;
            await order.save({ transaction: t });

            // 3. 创建交易记录
            const transaction = await Transaction.create({
                transaction_id: helper.generateTransactionId(),
                order_id: orderId,
                from_account: fromAccount,
                to_account: toAccount,
                amount: order.amount,
                type: 1,  // 支付
            }, { transaction: t });

            return {
                order,
                transaction
            };
        });

        return {
            order_id: result.order.order_id,
            status: result.order.status,
            transaction_id: result.transaction.transaction_id,
            amount: result.transaction.amount,
            pay_time: result.transaction.create_time
        };
    }
}

module.exports = new OrderService(); 