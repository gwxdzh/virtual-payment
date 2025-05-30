const { DataTypes } = require('sequelize');
const sequelize = require('./index');
const bcrypt = require('bcryptjs');

/**
 * 管理员用户模型
 * 用于支付系统的后台管理，而非普通用户
 */
const Admin = sequelize.define('admin', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '管理员ID'
    },
    username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: '登录用户名'
    },
    password: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: '登录密码(加密)'
    },
    real_name: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '真实姓名'
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            isEmail: true
        },
        comment: '电子邮箱'
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: '手机号码'
    },
    role: {
        type: DataTypes.ENUM('super_admin', 'admin', 'manager', 'operator', 'viewer', 'auditor'),
        defaultValue: 'operator',
        comment: '角色: super_admin-超级管理员, admin-管理员, manager-经理, operator-操作员, viewer-查看者, auditor-审计员'
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'locked'),
        defaultValue: 'active',
        comment: '状态: active-启用, inactive-禁用, locked-锁定'
    },
    last_login_time: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '最后登录时间'
    },
    last_login_ip: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '最后登录IP'
    },
    login_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '登录次数'
    },
    remark: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: '备注信息'
    }
}, {
    tableName: 'admin_users',
    underscored: true, // 使用下划线命名法
    timestamps: true,  // 创建 created_at 和 updated_at 字段
    indexes: [
        {
            name: 'idx_username',
            fields: ['username']
        },
        {
            name: 'idx_role',
            fields: ['role']
        },
        {
            name: 'idx_status',
            fields: ['status']
        }
    ],
    hooks: {
        // 保存前对密码进行加密
        beforeCreate: async (admin) => {
            if (admin.password) {
                const salt = await bcrypt.genSalt(10);
                admin.password = await bcrypt.hash(admin.password, salt);
            }
        },
        beforeUpdate: async (admin) => {
            // 只有修改了密码才重新加密
            if (admin.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                admin.password = await bcrypt.hash(admin.password, salt);
            }
        }
    }
});

/**
 * 实例方法：验证密码
 * @param {string} password - 待验证的密码
 * @returns {Promise<boolean>} - 密码是否匹配
 */
Admin.prototype.validatePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

module.exports = Admin; 