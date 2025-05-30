/**
 * 日志管理脚本
 * 
 * 此脚本用于手动管理日志文件，包括：
 * - 压缩归档旧日志文件
 * - 清理过期的日志文件
 * - 查看日志统计信息
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const moment = require('moment');
const readline = require('readline');

// 日志目录路径
const LOG_DIR = path.join(process.cwd(), 'logs');

/**
 * 获取所有日志文件
 * @returns {Array} 日志文件列表
 */
function getAllLogFiles() {
    if (!fs.existsSync(LOG_DIR)) {
        console.log('日志目录不存在');
        return [];
    }

    return fs.readdirSync(LOG_DIR)
        .filter(file => file.endsWith('.log'))
        .map(file => ({
            name: file,
            path: path.join(LOG_DIR, file),
            stats: fs.statSync(path.join(LOG_DIR, file))
        }));
}

/**
 * 归档指定日期之前的日志
 * @param {Date} beforeDate - 归档此日期之前的日志
 */
function archiveOldLogs(beforeDate) {
    const dateStr = moment(beforeDate).format('YYYYMMDD');
    const files = getAllLogFiles().filter(file =>
        new Date(file.stats.mtime) < beforeDate
    );

    if (files.length === 0) {
        console.log('没有找到需要归档的日志文件');
        return;
    }

    // 确保归档目录存在
    const archiveDir = path.join(LOG_DIR, 'archives');
    if (!fs.existsSync(archiveDir)) {
        fs.mkdirSync(archiveDir);
    }

    // 创建归档文件
    const archivePath = path.join(archiveDir, `logs-before-${dateStr}.zip`);
    const output = fs.createWriteStream(archivePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
        console.log(`归档完成，共 ${archive.pointer()} 字节`);
        console.log(`归档文件: ${archivePath}`);

        // 删除已归档的文件
        files.forEach(file => {
            fs.unlinkSync(file.path);
            console.log(`已删除: ${file.name}`);
        });
    });

    archive.on('error', (err) => {
        throw err;
    });

    archive.pipe(output);

    files.forEach(file => {
        archive.file(file.path, { name: file.name });
        console.log(`添加到归档: ${file.name}`);
    });

    archive.finalize();
}

/**
 * 删除指定天数之前的日志
 * @param {Number} days - 天数
 */
function deleteOldLogs(days) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const files = getAllLogFiles().filter(file =>
        new Date(file.stats.mtime) < cutoffDate
    );

    if (files.length === 0) {
        console.log(`没有找到 ${days} 天前的日志文件`);
        return;
    }

    console.log(`将删除以下 ${files.length} 个日志文件:`);
    files.forEach(file => console.log(` - ${file.name} (${moment(file.stats.mtime).format('YYYY-MM-DD')})`));

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('确定删除这些文件吗? (y/n) ', (answer) => {
        if (answer.toLowerCase() === 'y') {
            files.forEach(file => {
                fs.unlinkSync(file.path);
                console.log(`已删除: ${file.name}`);
            });
        } else {
            console.log('操作已取消');
        }
        rl.close();
    });
}

/**
 * 显示日志统计信息
 */
function showLogStats() {
    const files = getAllLogFiles();

    if (files.length === 0) {
        console.log('没有找到日志文件');
        return;
    }

    // 按类型分组
    const logTypes = {};
    files.forEach(file => {
        const match = file.name.match(/^([^-]+)/);
        if (match) {
            const type = match[1];
            if (!logTypes[type]) {
                logTypes[type] = [];
            }
            logTypes[type].push(file);
        }
    });

    console.log('日志统计信息:');
    console.log('==============');
    console.log(`总文件数: ${files.length}`);
    console.log(`总大小: ${formatBytes(files.reduce((sum, file) => sum + file.stats.size, 0))}`);
    console.log('==============');

    Object.keys(logTypes).forEach(type => {
        const typeFiles = logTypes[type];
        console.log(`类型: ${type}`);
        console.log(`  文件数: ${typeFiles.length}`);
        console.log(`  总大小: ${formatBytes(typeFiles.reduce((sum, file) => sum + file.stats.size, 0))}`);
        console.log(`  最老文件: ${typeFiles.reduce((oldest, file) =>
            new Date(file.stats.mtime) < new Date(oldest.stats.mtime) ? file : oldest
        ).name} (${moment(typeFiles.reduce((oldest, file) =>
            new Date(file.stats.mtime) < new Date(oldest.stats.mtime) ? file : oldest
        ).stats.mtime).format('YYYY-MM-DD')})`);
        console.log(`  最新文件: ${typeFiles.reduce((newest, file) =>
            new Date(file.stats.mtime) > new Date(newest.stats.mtime) ? file : newest
        ).name} (${moment(typeFiles.reduce((newest, file) =>
            new Date(file.stats.mtime) > new Date(newest.stats.mtime) ? file : newest
        ).stats.mtime).format('YYYY-MM-DD')})`);
        console.log('');
    });
}

/**
 * 格式化字节大小为可读字符串
 * @param {Number} bytes - 字节数
 * @returns {String} 格式化后的字符串
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 命令行参数处理
function main() {
    const args = process.argv.slice(2);

    if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
        console.log('日志管理工具使用方法:');
        console.log('--stats      显示日志统计信息');
        console.log('--archive    归档旧日志文件 (可选参数: 日期, 格式: YYYY-MM-DD, 默认7天前)');
        console.log('--delete     删除旧日志文件 (可选参数: 天数, 默认30天)');
        return;
    }

    switch (args[0]) {
        case '--stats':
            showLogStats();
            break;
        case '--archive':
            const archiveDate = args[1] ? new Date(args[1]) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            archiveOldLogs(archiveDate);
            break;
        case '--delete':
            const days = args[1] ? parseInt(args[1], 10) : 30;
            deleteOldLogs(days);
            break;
        default:
            console.log('未知命令。使用 --help 查看帮助。');
    }
}

// 执行主函数
main(); 