const { v4: uuidv4 } = require("uuid");

module.exports = (sequelize, Sequelize) => {
    const GameFollowing = sequelize.define("GameFollowing", {
        GameFollowingId: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            allowNull: false,
            unique: true,
            primaryKey: true
        },
        FollowerUserId: {
            type: Sequelize.UUID,
        },
        GameId: {
            type: Sequelize.UUID,
        },
        DateFollowed: {
            type: Sequelize.DATE
        }
    }, {
        timestamps: false,
        underscored: false,
        freezeTableName: true
    });

    return GameFollowing;
};