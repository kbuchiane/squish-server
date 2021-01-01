module.exports = (sequelize, Sequelize) => {
    const Like = sequelize.define('Like', {
        LikeId: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true
        },
        ClipId: {
            type: Sequelize.BIGINT
        },
        CommentId: {
            type: Sequelize.BIGINT
        },
        UserId: {
            type: Sequelize.BIGINT
        }
    }, {
        timestamps: false,
        underscored: false,
        freezeTableName: true

    });

    return Like;
};