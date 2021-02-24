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
        // TODO: Update to limit Badges [4] (allocate space for 4, set to null if empty?)
        Badges: {
            type: Sequelize.STRING,
            get() {
                let badges = this.getDataValue('Badges');
                if (badges) {
                    return this.getDataValue('Badges').split(',');
                }
                else {
                    return [];
                }
            },
            set(val) {
                let value = val.toString();
                this.setDataValue('Badges', value);
            },
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