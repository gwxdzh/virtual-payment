const { merchantService } = require('../services');
const helper = require('../utils/helper');

/**
 * 商户控制器
 */
class MerchantController {
    /**
     * 创建商户
     * @param {Object} ctx - Koa上下文
     */
    async createMerchant(ctx) {
        try {
            const { merchant_name } = ctx.request.body;

            // 验证参数
            if (!merchant_name) {
                ctx.status = 400;
                ctx.body = helper.formatResponse(
                    'MERCHANT.INVALID_PARAMS',
                    {},
                    '缺少必要参数',
                    'Missing required parameters',
                    ctx.request.id
                );
                return;
            }

            // 创建商户
            const merchant = await merchantService.createMerchant({ merchant_name });

            ctx.status = 201;
            ctx.body = helper.formatResponse(
                'MERCHANT.CREATE_SUCCESS',
                merchant,
                '商户创建成功',
                'Merchant created successfully',
                ctx.request.id
            );
        } catch (error) {
            ctx.status = 500;
            ctx.body = helper.formatResponse(
                'MERCHANT.CREATE_FAILED',
                {},
                '商户创建失败: ' + error.message,
                'Failed to create merchant: ' + error.message,
                ctx.request.id
            );
        }
    }

    /**
     * 获取商户信息
     * @param {Object} ctx - Koa上下文
     */
    async getMerchant(ctx) {
        try {
            const { merchant_id } = ctx.params;

            // 查询商户
            const merchant = await merchantService.getMerchantById(merchant_id);

            if (!merchant) {
                ctx.status = 404;
                ctx.body = helper.formatResponse(
                    'MERCHANT.NOT_FOUND',
                    {},
                    '商户不存在',
                    'Merchant not found',
                    ctx.request.id
                );
                return;
            }

            ctx.body = helper.formatResponse(
                'MERCHANT.GET_SUCCESS',
                merchant,
                '获取商户信息成功',
                'Merchant information retrieved successfully',
                ctx.request.id
            );
        } catch (error) {
            ctx.status = 500;
            ctx.body = helper.formatResponse(
                'MERCHANT.GET_FAILED',
                {},
                '获取商户信息失败: ' + error.message,
                'Failed to get merchant information: ' + error.message,
                ctx.request.id
            );
        }
    }

    /**
     * 更新商户信息
     * @param {Object} ctx - Koa上下文
     */
    async updateMerchant(ctx) {
        try {
            const { merchant_id } = ctx.params;
            const { merchant_name } = ctx.request.body;

            // 验证参数
            if (!merchant_name) {
                ctx.status = 400;
                ctx.body = helper.formatResponse(
                    'MERCHANT.INVALID_PARAMS',
                    {},
                    '缺少必要参数',
                    'Missing required parameters',
                    ctx.request.id
                );
                return;
            }

            // 更新商户
            const success = await merchantService.updateMerchant(merchant_id, { merchant_name });

            if (!success) {
                ctx.status = 404;
                ctx.body = helper.formatResponse(
                    'MERCHANT.NOT_FOUND',
                    {},
                    '商户不存在',
                    'Merchant not found',
                    ctx.request.id
                );
                return;
            }

            ctx.body = helper.formatResponse(
                'MERCHANT.UPDATE_SUCCESS',
                { merchant_id, merchant_name },
                '商户信息更新成功',
                'Merchant information updated successfully',
                ctx.request.id
            );
        } catch (error) {
            ctx.status = 500;
            ctx.body = helper.formatResponse(
                'MERCHANT.UPDATE_FAILED',
                {},
                '更新商户信息失败: ' + error.message,
                'Failed to update merchant information: ' + error.message,
                ctx.request.id
            );
        }
    }

    /**
     * 重新生成商户密钥对
     * @param {Object} ctx - Koa上下文
     */
    async regenerateKeys(ctx) {
        try {
            const { merchant_id } = ctx.params;

            // 重新生成密钥
            const result = await merchantService.regenerateKeys(merchant_id);

            if (!result) {
                ctx.status = 404;
                ctx.body = helper.formatResponse(
                    'MERCHANT.NOT_FOUND',
                    {},
                    '商户不存在',
                    'Merchant not found',
                    ctx.request.id
                );
                return;
            }

            ctx.body = helper.formatResponse(
                'MERCHANT.KEY_REGENERATE_SUCCESS',
                { merchant_id, public_key: result.public_key },
                '密钥重新生成成功',
                'Keys regenerated successfully',
                ctx.request.id
            );
        } catch (error) {
            ctx.status = 500;
            ctx.body = helper.formatResponse(
                'MERCHANT.KEY_REGENERATE_FAILED',
                {},
                '密钥重新生成失败: ' + error.message,
                'Failed to regenerate keys: ' + error.message,
                ctx.request.id
            );
        }
    }

    /**
     * 搜索商户
     * @param {Object} ctx - Koa上下文
     */
    async searchMerchants(ctx) {
        try {
            const { merchant_name, page = 1, page_size = 10 } = ctx.query;

            // 转换分页参数为数字
            const pageNum = parseInt(page, 10);
            const pageSizeNum = parseInt(page_size, 10);

            // 搜索商户
            const result = await merchantService.searchMerchants(
                { merchant_name },
                pageNum,
                pageSizeNum
            );

            ctx.body = helper.formatResponse(
                'MERCHANT.SEARCH_SUCCESS',
                result,
                '商户搜索成功',
                'Merchants searched successfully',
                ctx.request.id
            );
        } catch (error) {
            ctx.status = 500;
            ctx.body = helper.formatResponse(
                'MERCHANT.SEARCH_FAILED',
                {},
                '搜索商户失败: ' + error.message,
                'Failed to search merchants: ' + error.message,
                ctx.request.id
            );
        }
    }
}

module.exports = new MerchantController(); 