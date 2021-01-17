const { v4: uuidv4 } = require("uuid");

module.exports = (sequelize, Sequelize) => {
    const User = sequelize.define("User", {
        UserId: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            allowNull: false,
            unique: true,
            primaryKey: true
        },
        Username: {
            type: Sequelize.STRING(45, false)
        },
        Email: {
            type: Sequelize.STRING
        },
        Password: {
            type: Sequelize.STRING(60, false)
        },
        DateCreated: {
            type: Sequelize.DATE
        },
        IconFilepath: {
            type: Sequelize.STRING
        },
        Active: {
            type: Sequelize.TINYINT
        },
        RefreshToken: {
            type: Sequelize.STRING
        },
        RefreshTokenExpiration: {
            type: Sequelize.DATE
        },
        ConfirmId: {
            type: Sequelize.STRING(8, false)
        },
        ConfirmIdDateCreated: {
            type: Sequelize.DATE
        },
        VerifyAttemptCount: {
            type: Sequelize.INTEGER
        },
        Admin: {
            type: Sequelize.TINYINT
        }
    }, {
        timestamps: false,
        underscored: false,
        freezeTableName: true
    });

    return User;
};