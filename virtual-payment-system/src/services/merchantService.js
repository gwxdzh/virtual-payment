const { Merchant } = require('../models/modelIndex');
const helper = require('../utils/helper');
const { Op } = require('sequelize');

/**
 * 商户服务
 * 提供商户相关的业务逻辑处理
 */
class MerchantService {
    /**
     * 创建新商户
     * @param {Object} merchantData - 商户信息
     * @returns {Promise<Object>} - 创建的商户信息
     */
    async createMerchant(merchantData) {
        const { merchant_name } = merchantData;

        // 生成商户唯一标识
        const merchant_id = helper.generateMerchantId();

        // 生成密钥对
        const { privateKey, publicKey } = helper.generateKeyPair();

        // 创建商户记录
        const merchant = await Merchant.create({
            merchant_id,
            merchant_name,
            private_key: privateKey,
            public_key: publicKey
        });

        // 返回商户信息（不包含私钥）
        return {
            merchant_id: merchant.merchant_id,
            merchant_name: merchant.merchant_name,
            public_key: merchant.public_key,
            create_time: merchant.create_time
        };
    }

    /**
     * 根据商户ID获取商户信息
     * @param {string} merchantId - 商户ID
     * @param {boolean} includePrivateKey - 是否包含私钥
     * @returns {Promise<Object|null>} - 商户信息
     */
    async getMerchantById(merchantId, includePrivateKey = false) {
        const merchant = await Merchant.findOne({
            where: { merchant_id: merchantId }
        });

        if (!merchant) return null;

        // 根据需求决定是否返回私钥
        const result = {
            id: merchant.id,
            merchant_id: merchant.merchant_id,
            merchant_name: merchant.merchant_name,
            public_key: merchant.public_key,
            create_time: merchant.create_time
        };

        if (includePrivateKey) {
            result.private_key = merchant.private_key;
        }

        return result;
    }

    /**
     * 更新商户信息
     * @param {string} merchantId - 商户ID
     * @param {Object} updateData - 更新数据
     * @returns {Promise<boolean>} - 是否更新成功
     */
    async updateMerchant(merchantId, updateData) {
        const [updatedRows] = await Merchant.update(updateData, {
            where: { merchant_id: merchantId }
        });

        return updatedRows > 0;
    }

    /**
     * 重新生成商户密钥对
     * @param {string} merchantId - 商户ID
     * @returns {Promise<Object|null>} - 更新后的密钥信息
     */
    async regenerateKeys(merchantId) {
        // 生成新的密钥对
        const { privateKey, publicKey } = helper.generateKeyPair();

        // 更新商户密钥
        const [updatedRows] = await Merchant.update(
            { private_key: privateKey, public_key: publicKey },
            { where: { merchant_id: merchantId } }
        );

        if (updatedRows === 0) return null;

        return {
            public_key: publicKey,
            update_time: new Date()
        };
    }

    /**
     * 搜索商户
     * @param {Object} params - 搜索参数
     * @param {number} page - 页码
     * @param {number} pageSize - 每页数量
     * @returns {Promise<Object>} - 分页搜索结果
     */
    async searchMerchants(params = {}, page = 1, pageSize = 10) {
        const { merchant_name } = params;

        const whereClause = {};
        if (merchant_name) {
            whereClause.merchant_name = { [Op.like]: `%${merchant_name}%` };
        }

        const offset = (page - 1) * pageSize;

        const { count, rows } = await Merchant.findAndCountAll({
            where: whereClause,
            attributes: ['id', 'merchant_id', 'merchant_name', 'public_key', 'create_time'],
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
}

module.exports = new MerchantService(); 