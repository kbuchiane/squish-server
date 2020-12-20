module.exports = (sequelize, Sequelize) => {
    const GameFollowing = sequelize.define("game_following", {
        game_follow_id: {
            type: Sequelize.STRING,
            primaryKey: true
        },
        game_follower_user_id: {
            type: Sequelize.STRING
        },
        followed_game_id: {
            type: Sequelize.STRING
        },
        date_game_followed: {
            type: Sequelize.STRING
        }
    }, {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        freezeTableName: true
    });

    return GameFollowing;
};