const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Account = sequelize.define('account', {
    account_id: {
        type: DataTypes.STRING(64),
        primaryKey: true,
        allowNull: false
    },
    balance: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0
    },
    frozen_balance: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0
    },
    create_time: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'account',
    timestamps: false,
    indexes: [
        {
            fields: ['create_time']
        }
    ]
});

module.exports = Account; 