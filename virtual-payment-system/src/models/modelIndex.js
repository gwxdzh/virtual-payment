const sequelize = require('./index');
const Merchant = require('./merchant');
const Order = require('./order');
const Account = require('./account');
const Transaction = require('./transaction');
const Admin = require('./admin');
const OperationLog = require('./operationLog');

// 确保模型之间的关联关系正确建立
Merchant.hasMany(Order, { foreignKey: 'merchant_id', sourceKey: 'merchant_id' });
Order.belongsTo(Merchant, { foreignKey: 'merchant_id', targetKey: 'merchant_id' });

Order.hasMany(Transaction, { foreignKey: 'order_id' });
Transaction.belongsTo(Order, { foreignKey: 'order_id' });

// 管理员与操作日志的关联
Admin.hasMany(OperationLog, { foreignKey: 'operator_id' });
OperationLog.belongsTo(Admin, { foreignKey: 'operator_id' });

module.exports = {
    sequelize,
    Merchant,
    Order,
    Account,
    Transaction,
    Admin,
    OperationLog
};

