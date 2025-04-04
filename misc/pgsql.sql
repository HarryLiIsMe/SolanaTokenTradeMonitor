BEGIN;
-- CREATE TABLE tb_tx (
--     tx_hash TEXT PRIMARY KEY,
--     block_number BIGINT NOT NULL,
--     tms TIMESTAMP NOT NULL
-- );

CREATE TABLE tb_followed_usr (
    account_addr TEXT PRIMARY KEY,
    last_tx_hash TEXT NOT NULL,
    tms TIMESTAMP NOT NULL,
    block_number BIGINT NOT NULL,
    is_disabled BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE tb_followed_position (
    followed_account_addr TEXT NOT NULL,
    token_id TEXT NOT NULL,
    amount BIGINT NOT NULL,

    PRIMARY KEY (followed_account_addr, token_id),
    FOREIGN KEY (followed_account_addr) REFERENCES tb_followed_usr(account_addr)
);

CREATE TABLE tb_followed_tx (
    following_tx_hash: TEXT PRIMARY KEY,
    followed_tx_hash: TEXT NOT NULL,
    followed_account_addr: TEXT NOT NULL,
    token_id: TEXT NOT NULL,
    amount: BIGINT NOT NULL,
    trade_direct: BOOLEAN NOT NULL DEFAULT FALSE,
    tms: TIMESTAMP NOT NULL,
    block_number:  BIGINT NOT NULL,

    FOREIGN KEY (followed_account_addr) REFERENCES tb_followed_usr(account_addr)
);

CREATE INDEX idx_followed_account_addr_on_position ON tb_followed_position(followed_account_addr);
CREATE INDEX idx_token_id_on_position ON tb_followed_position(token_id);
CREATE INDEX idx_followed_tx_hash_on_tx ON tb_followed_tx(followed_tx_hash);
CREATE INDEX idx_followed_account_addr_on_tx ON tb_followed_tx(followed_account_addr);
CREATE INDEX idx_token_id_on_tx ON tb_followed_tx(token_id);

COMMIT;

-- CREATE TABLE tb_trade (
--     tx_hash TEXT PRIMARY KEY,
--     token_id TEXT NOT NULL,
--     trade_direction TEXT NOT NULL, -- 买/卖方向
--     followed_account TEXT NOT NULL,
--     amount NUMERIC NOT NULL,
--     FOREIGN KEY (tx_hash) REFERENCES transactions(tx_hash)
-- );

-- CREATE TABLE tb_followed_trade (
--     follow_tx_hash TEXT PRIMARY KEY,
--     related_tx_hash TEXT NOT NULL,
--     follow_account TEXT NOT NULL,
--     followed_account TEXT NOT NULL,
--     token_id TEXT NOT NULL,
--     amount NUMERIC NOT NULL,
--     block_number BIGINT NOT NULL,
--     timestamp TIMESTAMP NOT NULL,
--     FOREIGN KEY (related_tx_hash) REFERENCES orders(tx_hash)
-- );

-- CREATE TABLE position (
--     followed_account TEXT NOT NULL,
--     token_id TEXT NOT NULL,
--     amount NUMERIC NOT NULL,
--     PRIMARY KEY (followed_account, token_id)
-- );

