module.exports = (sequelize, Sequelize) => {
    const UserFollowing = sequelize.define("UserFollowing", {
        UserFollowingId: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true
        },
        FollowerUserId: {
            type: Sequelize.BIGINT
        },
        FollowedUserId: {
            type: Sequelize.BIGINT
        },
        DateFollowed: {
            type: Sequelize.STRING
        }
    }, {
        timestamps: false,
        underscored: false,
        freezeTableName: true
    });

    return UserFollowing;
};