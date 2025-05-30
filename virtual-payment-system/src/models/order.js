const { DataTypes } = require('sequelize');
const sequelize = require('./index');
const Merchant = require('./merchant');

const Order = sequelize.define('order', {
    order_id: {
        type: DataTypes.STRING(64),
        primaryKey: true,
        allowNull: false
    },
    merchant_order_id: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true
    },
    merchant_id: {
        type: DataTypes.STRING(64),
        allowNull: false,
        references: {
            model: Merchant,
            key: 'merchant_id'
        }
    },
    amount: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'CNY'
    },
    channel: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    status: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0 // 0=待支付，1=已支付，2=已关闭，3=部分退款，4=全额退款
    },
    version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    notify_url: {
        type: DataTypes.STRING(256),
        allowNull: true
    },
    create_time: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'order',
    timestamps: false,
    indexes: [
        {
            fields: ['merchant_order_id'],
            unique: true
        },
        {
            fields: ['merchant_id']
        },
        {
            fields: ['status']
        },
        {
            fields: ['create_time']
        },
        {
            fields: ['merchant_id', 'status', 'create_time']
        }
    ]
});

// 建立与商户表的关联
Order.belongsTo(Merchant, { foreignKey: 'merchant_id', targetKey: 'merchant_id' });

module.exports = Order; 