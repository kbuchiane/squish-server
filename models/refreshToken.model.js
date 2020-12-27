module.exports = (sequelize, Sequelize) => {
    const RefreshToken = sequelize.define("RefreshToken", {
        RefreshTokenId: {
            type: Sequelize.STRING,
            primaryKey: true
        },
        RefreshTokenUserId: {
            type: Sequelize.STRING
        },
        ExpirationDate: {
            type: Sequelize.STRING
        }
    }, {
        timestamps: false,
        underscored: false,
        freezeTableName: true
    });

    return RefreshToken;
};