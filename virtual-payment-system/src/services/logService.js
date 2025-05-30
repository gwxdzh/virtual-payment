const { Op } = require('sequelize');
const OperationLog = require('../models/operationLog');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');
const dayjs = require('dayjs');

/**
 * 日志服务类
 * 提供系统日志查询和导出功能
 */
class LogService {
    /**
     * 分页查询操作日志
     * @param {Object} params 查询参数
     * @param {number} params.page 页码
     * @param {number} params.limit 每页记录数
     * @param {string} params.operationType 操作类型
     * @param {string} params.operator 操作人
     * @param {string} params.module 操作模块
     * @param {string} params.startTime 开始时间
     * @param {string} params.endTime 结束时间
     * @returns {Promise<Object>} 分页结果
     */
    async getOperationLogs(params) {
        try {
            const {
                page = 1,
                limit = 20,
                operationType,
                operator,
                module,
                startTime,
                endTime
            } = params;

            // 构建查询条件
            const where = {};

            if (operationType) {
                where.operation_type = operationType;
            }

            if (operator) {
                where.operator_name = {
                    [Op.like]: `%${operator}%`
                };
            }

            if (module) {
                where.module = module;
            }

            // 添加时间范围条件
            if (startTime || endTime) {
                where.create_time = {};

                if (startTime) {
                    where.create_time[Op.gte] = new Date(startTime);
                }

                if (endTime) {
                    where.create_time[Op.lte] = new Date(endTime);
                }
            }

            // 执行分页查询
            const { count, rows } = await OperationLog.findAndCountAll({
                where,
                order: [['create_time', 'DESC']],
                offset: (page - 1) * limit,
                limit: parseInt(limit)
            });

            return {
                total: count,
                list: rows,
                page: parseInt(page),
                limit: parseInt(limit)
            };
        } catch (error) {
            logger.error('查询操作日志失败', { error: error.message });
            throw new Error('查询操作日志失败');
        }
    }

    /**
     * 获取操作日志详情
     * @param {number} id 日志ID
     * @returns {Promise<Object>} 日志详情
     */
    async getLogDetail(id) {
        try {
            const log = await OperationLog.findByPk(id);

            if (!log) {
                throw new Error('日志不存在');
            }

            return log;
        } catch (error) {
            logger.error('获取日志详情失败', { error: error.message, id });
            throw error;
        }
    }

    /**
     * 导出操作日志
     * @param {Object} params 查询参数
     * @returns {Promise<string>} 导出的文件路径
     */
    async exportLogs(params) {
        try {
            const {
                operationType,
                operator,
                module,
                startTime,
                endTime
            } = params;

            // 构建查询条件
            const where = {};

            if (operationType) {
                where.operation_type = operationType;
            }

            if (operator) {
                where.operator_name = {
                    [Op.like]: `%${operator}%`
                };
            }

            if (module) {
                where.module = module;
            }

            // 添加时间范围条件
            if (startTime || endTime) {
                where.create_time = {};

                if (startTime) {
                    where.create_time[Op.gte] = new Date(startTime);
                }

                if (endTime) {
                    where.create_time[Op.lte] = new Date(endTime);
                }
            }

            // 查询数据
            const logs = await OperationLog.findAll({
                where,
                order: [['create_time', 'DESC']],
                limit: 10000 // 限制导出数量
            });

            // 将日期时间格式化为字符串
            const formattedLogs = logs.map(log => {
                const plainLog = log.get({ plain: true });
                plainLog.create_time = dayjs(plainLog.create_time).format('YYYY-MM-DD HH:mm:ss');
                return plainLog;
            });

            // 定义CSV字段
            const fields = [
                { label: '日志ID', value: 'id' },
                { label: '操作人', value: 'operator_name' },
                { label: '操作类型', value: 'operation_type' },
                { label: '操作模块', value: 'module' },
                { label: '操作描述', value: 'description' },
                { label: 'IP地址', value: 'ip' },
                { label: '操作状态', value: (row) => row.status === 1 ? '成功' : '失败' },
                { label: '错误信息', value: 'error_msg' },
                { label: '操作时间', value: 'create_time' }
            ];

            // 生成CSV
            const parser = new Parser({ fields });
            const csv = parser.parse(formattedLogs);

            // 创建导出文件夹
            const exportDir = path.join(process.cwd(), 'exports');
            if (!fs.existsSync(exportDir)) {
                fs.mkdirSync(exportDir, { recursive: true });
            }

            // 生成文件名
            const timestamp = dayjs().format('YYYYMMDDHHmmss');
            const fileName = `operation_logs_${timestamp}.csv`;
            const filePath = path.join(exportDir, fileName);

            // 写入文件
            fs.writeFileSync(filePath, '\ufeff' + csv); // 添加BOM头以支持中文

            return {
                fileName,
                filePath: `/exports/${fileName}`
            };
        } catch (error) {
            logger.error('导出操作日志失败', { error: error.message });
            throw new Error('导出操作日志失败');
        }
    }

    /**
     * 记录操作日志
     * @param {Object} logData 日志数据
     * @returns {Promise<Object>} 创建的日志对象
     */
    async createOperationLog(logData) {
        try {
            return await OperationLog.create(logData);
        } catch (error) {
            logger.error('记录操作日志失败', { error: error.message, logData });
            // 记录日志失败不应影响正常业务流程，只记录错误
            return null;
        }
    }
}

module.exports = new LogService(); 