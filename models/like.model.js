module.exports = (sequelize, Sequelize) => {
    const Like = sequelize.define('Like', {
        LikeId: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true
        },
        Type: {
            type: Sequelize.ENUM,
            values: ['Like', 'Impressive', 'Funny', 'Discussion']
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