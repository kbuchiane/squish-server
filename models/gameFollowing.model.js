module.exports = (sequelize, Sequelize) => {
    const GameFollowing = sequelize.define("GameFollowing", {
        GameFollowingId: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true
        },
        GameFollowerUserId: {
            type: Sequelize.BIGINT
        },
        FollowedGameId: {
            type: Sequelize.BIGINT
        },
        DateGameFollowed: {
            type: Sequelize.DATE
        }
    }, {
        timestamps: false,
        underscored: false,
        freezeTableName: true
    });

    return GameFollowing;
};