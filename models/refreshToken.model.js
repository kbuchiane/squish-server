module.exports = (sequelize, Sequelize) => {
    const RefreshToken = sequelize.define("refresh_token", {
        refresh_token_id: {
            type: Sequelize.STRING,
            primaryKey: true
        },
        refresh_token_user_id: {
            type: Sequelize.STRING
        },
        expiration_date: {
            type: Sequelize.STRING
        }
    }, {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        freezeTableName: true
    });

    return RefreshToken;
};