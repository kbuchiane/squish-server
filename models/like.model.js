module.exports = (sequelize, Sequelize) => {
    const Like = sequelize.define('Like', {
        LikeId: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true
        },
        LikedClipId: {
            type: Sequelize.BIGINT
        },
        LikedCommentId: {
            type: Sequelize.BIGINT
        },
        LikeUserId: {
            type: Sequelize.BIGINT
        }
    }, {
        timestamps: false,
        underscored: false,
        freezeTableName: true

    });

    return Like;
};