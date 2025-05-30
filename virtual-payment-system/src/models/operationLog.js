const { DataTypes } = require('sequelize');
const sequelize = require('./index');
const Admin = require('./admin');

/**
 * 操作日志模型
 * 用于记录系统后台的各种操作行为
 */
const OperationLog = sequelize.define('operation_log', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '日志ID'
    },
    operator_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '操作人ID',
        references: {
            model: Admin,
            key: 'id'
        }
    },
    operator_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: '操作人名称'
    },
    operation_type: {
        type: DataTypes.ENUM(
            'LOGIN', 'LOGOUT', 'QUERY',
            'INSERT', 'UPDATE', 'DELETE',
            'REFUND', 'FREEZE', 'UNFREEZE',
            'EXPORT', 'IMPORT', 'OTHER'
        ),
        allowNull: false,
        comment: '操作类型'
    },
    module: {
        type: DataTypes.ENUM(
            'SYSTEM', 'MERCHANT', 'ORDER',
            'ACCOUNT', 'MONITOR', 'LOG'
        ),
        allowNull: false,
        comment: '操作模块'
    },
    description: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: '操作描述'
    },
    request_param: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '请求参数(JSON字符串)'
    },
    response_data: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '响应结果(JSON字符串)'
    },
    ip: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: '操作IP地址'
    },
    status: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 1,
        comment: '操作结果状态: 1=成功, 0=失败'
    },
    error_msg: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: '失败错误信息'
    },
    create_time: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        comment: '操作时间'
    }
}, {
    tableName: 'operation_log',
    timestamps: false,
    indexes: [
        {
            fields: ['operation_type']
        },
        {
            fields: ['module']
        },
        {
            fields: ['operator_id']
        },
        {
            fields: ['create_time']
        },
        {
            fields: ['status']
        },
        {
            fields: ['operator_id', 'operation_type', 'module', 'create_time']
        }
    ]
});

// 建立与管理员表的关联
OperationLog.belongsTo(Admin, { foreignKey: 'operator_id' });

module.exports = OperationLog; 