const { orderService, accountService } = require('../services');
const helper = require('../utils/helper');

/**
 * 订单控制器
 */
class OrderController {
    /**
     * 创建订单
     * @param {Object} ctx - Koa上下文
     */
    async createOrder(ctx) {
        try {
            // 获取商户信息（通过签名验证中间件添加）
            const merchant = ctx.merchant;

            const {
                merchant_order_id,
                amount,
                currency = 'CNY',
                channel,
                notify_url,
                product_desc
            } = ctx.request.body;

            // 验证必要参数
            if (!merchant_order_id || !amount || !channel) {
                ctx.status = 400;
                ctx.body = helper.formatResponse(
                    'ORDER.INVALID_PARAMS',
                    {},
                    '缺少必要参数',
                    'Missing required parameters',
                    ctx.request.id
                );
                return;
            }

            // 验证金额（必须为整数且大于0）
            if (!Number.isInteger(Number(amount)) || Number(amount) <= 0) {
                ctx.status = 400;
                ctx.body = helper.formatResponse(
                    'ORDER.INVALID_AMOUNT',
                    {},
                    '无效的订单金额',
                    'Invalid order amount',
                    ctx.request.id
                );
                return;
            }

            // 创建订单
            const orderData = {
                merchant_id: merchant.merchant_id,
                merchant_order_id,
                amount: Number(amount),
                currency,
                channel,
                notify_url,
                product_desc
            };

            const order = await orderService.createOrder(orderData);

            // 根据不同支付渠道，生成不同的支付参数
            let paymentInfo = {};

            switch (channel) {
                case 'QR_CODE':
                    paymentInfo = {
                        pay_type: 'QR_CODE',
                        pay_url: `https://pay.example.com/generate-qr?order_id=${order.order_id}`
                    };
                    break;
                case 'ALIPAY':
                    paymentInfo = {
                        pay_type: 'ALIPAY',
                        pay_url: `https://pay.example.com/alipay?order_id=${order.order_id}`
                    };
                    break;
                case 'WECHAT_PAY':
                    paymentInfo = {
                        pay_type: 'WECHAT_PAY',
                        pay_url: `https://pay.example.com/wechat?order_id=${order.order_id}`
                    };
                    break;
                default:
                    paymentInfo = {
                        pay_type: channel,
                        pay_url: `https://pay.example.com/pay?order_id=${order.order_id}&channel=${channel}`
                    };
            }

            ctx.status = 201;
            ctx.body = helper.formatResponse(
                'ORDER.CREATE_SUCCESS',
                {
                    ...order,
                    ...paymentInfo
                },
                '订单创建成功',
                'Order created successfully',
                ctx.request.id
            );
        } catch (error) {
            ctx.status = 500;
            ctx.body = helper.formatResponse(
                'ORDER.CREATE_FAILED',
                {},
                '订单创建失败: ' + error.message,
                'Failed to create order: ' + error.message,
                ctx.request.id
            );
        }
    }

    /**
     * 查询订单
     * @param {Object} ctx - Koa上下文
     */
    async queryOrder(ctx) {
        try {
            // 获取商户信息（通过签名验证中间件添加）
            const merchant = ctx.merchant;

            const { order_id, merchant_order_id } = ctx.request.body;

            // 需要提供订单号或商户订单号其中之一
            if (!order_id && !merchant_order_id) {
                ctx.status = 400;
                ctx.body = helper.formatResponse(
                    'ORDER.INVALID_PARAMS',
                    {},
                    '缺少订单号',
                    'Missing order ID',
                    ctx.request.id
                );
                return;
            }

            let order;

            // 优先使用系统订单号查询
            if (order_id) {
                order = await orderService.getOrderById(order_id);
            } else {
                // 使用商户订单号查询
                order = await orderService.getOrderByMerchantOrderId(merchant_order_id, merchant.merchant_id);
            }

            if (!order) {
                ctx.status = 404;
                ctx.body = helper.formatResponse(
                    'ORDER.NOT_FOUND',
                    {},
                    '订单不存在',
                    'Order not found',
                    ctx.request.id
                );
                return;
            }

            // 检查订单是否属于该商户
            if (order.merchant_id !== merchant.merchant_id) {
                ctx.status = 403;
                ctx.body = helper.formatResponse(
                    'ORDER.ACCESS_DENIED',
                    {},
                    '无权访问该订单',
                    'Access denied',
                    ctx.request.id
                );
                return;
            }

            ctx.body = helper.formatResponse(
                'ORDER.QUERY_SUCCESS',
                {
                    order_id: order.order_id,
                    merchant_order_id: order.merchant_order_id,
                    merchant_id: order.merchant_id,
                    amount: order.amount,
                    currency: order.currency,
                    channel: order.channel,
                    status: order.status,
                    create_time: order.create_time
                },
                '订单查询成功',
                'Order query successful',
                ctx.request.id
            );
        } catch (error) {
            ctx.status = 500;
            ctx.body = helper.formatResponse(
                'ORDER.QUERY_FAILED',
                {},
                '订单查询失败: ' + error.message,
                'Failed to query order: ' + error.message,
                ctx.request.id
            );
        }
    }

    /**
     * 关闭订单
     * @param {Object} ctx - Koa上下文
     */
    async closeOrder(ctx) {
        try {
            // 获取商户信息（通过签名验证中间件添加）
            const merchant = ctx.merchant;

            const { order_id, merchant_order_id } = ctx.request.body;

            // 需要提供订单号或商户订单号其中之一
            if (!order_id && !merchant_order_id) {
                ctx.status = 400;
                ctx.body = helper.formatResponse(
                    'ORDER.INVALID_PARAMS',
                    {},
                    '缺少订单号',
                    'Missing order ID',
                    ctx.request.id
                );
                return;
            }

            let order;

            // 优先使用系统订单号查询
            if (order_id) {
                order = await orderService.getOrderById(order_id);
            } else {
                // 使用商户订单号查询
                order = await orderService.getOrderByMerchantOrderId(merchant_order_id, merchant.merchant_id);
            }

            if (!order) {
                ctx.status = 404;
                ctx.body = helper.formatResponse(
                    'ORDER.NOT_FOUND',
                    {},
                    '订单不存在',
                    'Order not found',
                    ctx.request.id
                );
                return;
            }

            // 检查订单是否属于该商户
            if (order.merchant_id !== merchant.merchant_id) {
                ctx.status = 403;
                ctx.body = helper.formatResponse(
                    'ORDER.ACCESS_DENIED',
                    {},
                    '无权访问该订单',
                    'Access denied',
                    ctx.request.id
                );
                return;
            }

            // 检查订单状态是否为待支付
            if (order.status !== 0) {
                ctx.status = 400;
                ctx.body = helper.formatResponse(
                    'ORDER.INVALID_STATUS',
                    {},
                    '订单状态不允许关闭',
                    'Order status does not allow closing',
                    ctx.request.id
                );
                return;
            }

            // 关闭订单
            const success = await orderService.closeOrder(order.order_id, order.version);

            if (!success) {
                ctx.status = 409;
                ctx.body = helper.formatResponse(
                    'ORDER.CLOSE_CONFLICT',
                    {},
                    '订单状态已被修改，请重新查询',
                    'Order status has been modified, please query again',
                    ctx.request.id
                );
                return;
            }

            ctx.body = helper.formatResponse(
                'ORDER.CLOSE_SUCCESS',
                {
                    order_id: order.order_id,
                    merchant_order_id: order.merchant_order_id,
                    status: 2  // 已关闭
                },
                '订单关闭成功',
                'Order closed successfully',
                ctx.request.id
            );
        } catch (error) {
            ctx.status = 500;
            ctx.body = helper.formatResponse(
                'ORDER.CLOSE_FAILED',
                {},
                '订单关闭失败: ' + error.message,
                'Failed to close order: ' + error.message,
                ctx.request.id
            );
        }
    }

    /**
     * 支付订单（模拟支付）
     * @param {Object} ctx - Koa上下文
     */
    async payOrder(ctx) {
        try {
            const { order_id, from_account, to_account } = ctx.request.body;

            // 验证必要参数
            if (!order_id || !from_account || !to_account) {
                ctx.status = 400;
                ctx.body = helper.formatResponse(
                    'ORDER.INVALID_PARAMS',
                    {},
                    '缺少必要参数',
                    'Missing required parameters',
                    ctx.request.id
                );
                return;
            }

            // 查询订单
            const order = await orderService.getOrderById(order_id);

            if (!order) {
                ctx.status = 404;
                ctx.body = helper.formatResponse(
                    'ORDER.NOT_FOUND',
                    {},
                    '订单不存在',
                    'Order not found',
                    ctx.request.id
                );
                return;
            }

            // 检查订单状态是否为待支付
            if (order.status !== 0) {
                ctx.status = 400;
                ctx.body = helper.formatResponse(
                    'ORDER.INVALID_STATUS',
                    {},
                    '订单状态不允许支付',
                    'Order status does not allow payment',
                    ctx.request.id
                );
                return;
            }

            // 验证付款方账户
            const payer = await accountService.getAccount(from_account);
            if (!payer) {
                ctx.status = 404;
                ctx.body = helper.formatResponse(
                    'ACCOUNT.PAYER_NOT_FOUND',
                    {},
                    '付款账户不存在',
                    'Payer account not found',
                    ctx.request.id
                );
                return;
            }

            // 验证收款方账户
            const receiver = await accountService.getAccount(to_account);
            if (!receiver) {
                ctx.status = 404;
                ctx.body = helper.formatResponse(
                    'ACCOUNT.RECEIVER_NOT_FOUND',
                    {},
                    '收款账户不存在',
                    'Receiver account not found',
                    ctx.request.id
                );
                return;
            }

            // 检查余额是否充足
            if (payer.balance < order.amount) {
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

            // 处理支付（转账）
            const transferResult = await accountService.transfer(
                from_account,
                to_account,
                order.amount,
                order.order_id
            );

            // 更新订单状态为已支付
            await orderService.updateOrderStatus(order.order_id, 1, order.version);

            ctx.body = helper.formatResponse(
                'ORDER.PAY_SUCCESS',
                {
                    order_id: order.order_id,
                    transaction_id: transferResult.transaction_id,
                    amount: order.amount,
                    currency: order.currency,
                    status: 1,  // 已支付
                    pay_time: new Date().toISOString()
                },
                '订单支付成功',
                'Order paid successfully',
                ctx.request.id
            );
        } catch (error) {
            ctx.status = 500;
            ctx.body = helper.formatResponse(
                'ORDER.PAY_FAILED',
                {},
                '订单支付失败: ' + error.message,
                'Failed to pay order: ' + error.message,
                ctx.request.id
            );
        }
    }

    /**
     * 获取订单列表
     * @param {Object} ctx - Koa上下文
     */
    async getOrderList(ctx) {
        try {
            // 获取商户信息（通过签名验证中间件添加）
            const merchant = ctx.merchant;

            const {
                status,
                start_time,
                end_time,
                page = 1,
                page_size = 10
            } = ctx.query;

            // 转换分页参数为数字
            const pageNum = parseInt(page, 10);
            const pageSizeNum = parseInt(page_size, 10);

            // 查询商户订单
            const result = await orderService.getOrdersByMerchant(
                merchant.merchant_id,
                { status, start_time, end_time },
                pageNum,
                pageSizeNum
            );

            ctx.body = helper.formatResponse(
                'ORDER.LIST_SUCCESS',
                result,
                '订单列表查询成功',
                'Order list retrieved successfully',
                ctx.request.id
            );
        } catch (error) {
            ctx.status = 500;
            ctx.body = helper.formatResponse(
                'ORDER.LIST_FAILED',
                {},
                '订单列表查询失败: ' + error.message,
                'Failed to retrieve order list: ' + error.message,
                ctx.request.id
            );
        }
    }
}

module.exports = new OrderController(); 