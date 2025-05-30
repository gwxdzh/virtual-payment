CREATE DATABASE IF NOT EXISTS payment_db;

USE payment_db;

-- 商户表
CREATE TABLE IF NOT EXISTS merchant (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    merchant_id VARCHAR(64) UNIQUE,
    merchant_name VARCHAR(128),
    private_key TEXT,
    public_key TEXT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 订单表
CREATE TABLE IF NOT EXISTS `order` (
    order_id VARCHAR(64) PRIMARY KEY,
    merchant_order_id VARCHAR(64) UNIQUE,
    merchant_id VARCHAR(64),
    amount BIGINT,
    currency VARCHAR(3) DEFAULT 'CNY',
    channel VARCHAR(20),
    status TINYINT,
    version INT,
    notify_url VARCHAR(256),
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (merchant_id) REFERENCES merchant(merchant_id)
);

-- 账户表
CREATE TABLE IF NOT EXISTS account (
    account_id VARCHAR(64) PRIMARY KEY,
    balance BIGINT,
    frozen_balance BIGINT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 交易记录表
CREATE TABLE IF NOT EXISTS transaction (
    transaction_id VARCHAR(64) PRIMARY KEY,
    order_id VARCHAR(64),
    from_account VARCHAR(64),
    to_account VARCHAR(64),
    amount BIGINT,
    type TINYINT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES `order`(order_id)
); 