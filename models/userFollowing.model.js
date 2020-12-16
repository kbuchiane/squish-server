module.exports = (sequelize, Sequelize) => {
    const UserFollowing = sequelize.define("user_following", {
        follow_id: {
            type: Sequelize.STRING,
            primaryKey: true
        },
        follower_user_id: {
            type: Sequelize.STRING
        },
        followed_user_id: {
            type: Sequelize.STRING
        },
        date_followed: {
            type: Sequelize.STRING
        }
    }, {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        freezeTableName: true
    });

    return UserFollowing;
};