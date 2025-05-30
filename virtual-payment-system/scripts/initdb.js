const { execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// 检查SQL文件是否存在
const sqlFilePath = path.join(__dirname, '../db/init.sql');
if (!fs.existsSync(sqlFilePath)) {
    console.error('错误: 初始化SQL文件不存在:', sqlFilePath);
    process.exit(1);
}

console.log('=== 数据库初始化工具 ===');
console.log('此工具将创建payment_db数据库并初始化表结构');
console.log('注意: 请确保已安装MySQL并已启动服务\n');

// 提示用户输入MySQL连接信息
rl.question('请输入MySQL用户名 (默认: root): ', (username) => {
    username = username || 'root';

    rl.question('请输入MySQL密码: ', (password) => {
        const mysqlCmd = `mysql -u ${username} ${password ? `-p${password}` : ''} < "${sqlFilePath}"`;

        console.log('\n正在执行SQL初始化...');

        try {
            execSync(mysqlCmd, { stdio: 'inherit' });
            console.log('\n数据库初始化成功！');
            console.log('数据库 payment_db 已创建，表结构已初始化');
        } catch (error) {
            console.error('\n数据库初始化失败:');
            console.error('请检查MySQL服务是否启动以及用户名密码是否正确');
            console.error('错误详情:', error.message);
            process.exit(1);
        } finally {
            rl.close();
        }
    });
}); 