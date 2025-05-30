const { DataTypes } = require('sequelize');
const sequelize = require('./index');
const Order = require('./order');

const Transaction = sequelize.define('transaction', {
    transaction_id: {
        type: DataTypes.STRING(64),
        primaryKey: true,
        allowNull: false
    },
    order_id: {
        type: DataTypes.STRING(64),
        allowNull: false,
        references: {
            model: Order,
            key: 'order_id'
        }
    },
    from_account: {
        type: DataTypes.STRING(64),
        allowNull: false
    },
    to_account: {
        type: DataTypes.STRING(64),
        allowNull: false
    },
    amount: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    type: {
        type: DataTypes.TINYINT,
        allowNull: false,
        // 1=支付，2=退款，3=充值，4=提现，5=分账
    },
    create_time: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'transaction',
    timestamps: false,
    indexes: [
        {
            fields: ['order_id']
        },
        {
            fields: ['from_account']
        },
        {
            fields: ['to_account']
        },
        {
            fields: ['create_time']
        },
        {
            fields: ['order_id', 'from_account', 'to_account', 'amount']
        }
    ]
});

// 建立与订单表的关联
Transaction.belongsTo(Order, { foreignKey: 'order_id' });

module.exports = Transaction; 