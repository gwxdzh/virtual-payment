const logService = require('../services/logService');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

/**
 * 日志控制器
 * 处理操作日志相关的HTTP请求
 */
class LogController {
    /**
     * 分页查询操作日志
     * @param {Object} ctx - Koa上下文
     */
    async getOperationLogs(ctx) {
        try {
            // 获取查询参数
            const {
                page = 1,
                limit = 20,
                operationType,
                operator,
                module,
                startTime,
                endTime
            } = ctx.query;

            const result = await logService.getOperationLogs({
                page,
                limit,
                operationType,
                operator,
                module,
                startTime,
                endTime
            });

            ctx.body = {
                code: 'LOG.QUERY_SUCCESS',
                localized_msg: {
                    zh_CN: '查询操作日志成功',
                    en_US: 'Operation logs retrieved successfully'
                },
                data: {
                    total: result.total,
                    list: result.list,
                    page: result.page,
                    limit: result.limit
                }
            };
        } catch (error) {
            logger.error('查询操作日志失败', { error: error.message });
            ctx.status = 500;
            ctx.body = {
                code: 'LOG.QUERY_FAILED',
                localized_msg: {
                    zh_CN: '查询操作日志失败',
                    en_US: 'Failed to retrieve operation logs'
                },
                error: error.message
            };
        }
    }

    /**
     * 获取日志详情
     * @param {Object} ctx - Koa上下文
     */
    async getLogDetail(ctx) {
        try {
            const { id } = ctx.params;

            if (!id || isNaN(parseInt(id))) {
                ctx.status = 400;
                ctx.body = {
                    code: 'VALIDATE.INVALID_PARAMETER',
                    localized_msg: {
                        zh_CN: '无效的日志ID',
                        en_US: 'Invalid log ID'
                    }
                };
                return;
            }

            const log = await logService.getLogDetail(parseInt(id));

            ctx.body = {
                code: 'LOG.DETAIL_SUCCESS',
                localized_msg: {
                    zh_CN: '获取日志详情成功',
                    en_US: 'Log detail retrieved successfully'
                },
                data: log
            };
        } catch (error) {
            logger.error('获取日志详情失败', { error: error.message });

            if (error.message === '日志不存在') {
                ctx.status = 404;
                ctx.body = {
                    code: 'LOG.NOT_FOUND',
                    localized_msg: {
                        zh_CN: '日志不存在',
                        en_US: 'Log not found'
                    }
                };
            } else {
                ctx.status = 500;
                ctx.body = {
                    code: 'LOG.DETAIL_FAILED',
                    localized_msg: {
                        zh_CN: '获取日志详情失败',
                        en_US: 'Failed to retrieve log detail'
                    },
                    error: error.message
                };
            }
        }
    }

    /**
     * 导出操作日志
     * @param {Object} ctx - Koa上下文
     */
    async exportLogs(ctx) {
        try {
            // 获取查询参数
            const {
                operationType,
                operator,
                module,
                startTime,
                endTime
            } = ctx.query;

            const result = await logService.exportLogs({
                operationType,
                operator,
                module,
                startTime,
                endTime
            });

            ctx.body = {
                code: 'LOG.EXPORT_SUCCESS',
                localized_msg: {
                    zh_CN: '导出操作日志成功',
                    en_US: 'Operation logs exported successfully'
                },
                data: {
                    fileName: result.fileName,
                    downloadUrl: result.filePath
                }
            };
        } catch (error) {
            logger.error('导出操作日志失败', { error: error.message });
            ctx.status = 500;
            ctx.body = {
                code: 'LOG.EXPORT_FAILED',
                localized_msg: {
                    zh_CN: '导出操作日志失败',
                    en_US: 'Failed to export operation logs'
                },
                error: error.message
            };
        }
    }

    /**
     * 下载导出的日志文件
     * @param {Object} ctx - Koa上下文
     */
    async downloadExportFile(ctx) {
        try {
            const { fileName } = ctx.params;

            if (!fileName) {
                ctx.status = 400;
                ctx.body = {
                    code: 'VALIDATE.INVALID_PARAMETER',
                    localized_msg: {
                        zh_CN: '无效的文件名',
                        en_US: 'Invalid file name'
                    }
                };
                return;
            }

            const filePath = path.join(process.cwd(), 'exports', fileName);

            if (!fs.existsSync(filePath)) {
                ctx.status = 404;
                ctx.body = {
                    code: 'LOG.FILE_NOT_FOUND',
                    localized_msg: {
                        zh_CN: '文件不存在',
                        en_US: 'File not found'
                    }
                };
                return;
            }

            // 设置响应头
            ctx.set('Content-Type', 'text/csv; charset=utf-8');
            ctx.set('Content-Disposition', `attachment; filename=${encodeURIComponent(fileName)}`);
            ctx.body = fs.createReadStream(filePath);
        } catch (error) {
            logger.error('下载日志文件失败', { error: error.message });
            ctx.status = 500;
            ctx.body = {
                code: 'LOG.DOWNLOAD_FAILED',
                localized_msg: {
                    zh_CN: '下载日志文件失败',
                    en_US: 'Failed to download log file'
                },
                error: error.message
            };
        }
    }
}

module.exports = new LogController(); 