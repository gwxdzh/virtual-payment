const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Merchant = sequelize.define('merchant', {
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    merchant_id: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true
    },
    merchant_name: {
        type: DataTypes.STRING(128),
        allowNull: false
    },
    private_key: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    public_key: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    create_time: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'merchant',
    timestamps: false,
    indexes: [
        {
            fields: ['merchant_id'],
            unique: true
        },
        {
            fields: ['merchant_name']
        },
        {
            fields: ['create_time']
        }
    ]
});

module.exports = Merchant; 