module.exports = (sequelize, Sequelize) => {
    const Like = sequelize.define('Like', {
        LikeId: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            allowNull: false,
            unique: true,
            primaryKey: true
        },
        Type: {
            type: Sequelize.ENUM,
            values: ['Like', 'Impressive', 'Funny', 'Discussion']
        },
        ClipId: {
            type: Sequelize.UUID,
        },
        CommentId: {
            type: Sequelize.UUID,
        },
        UserId: {
            type: Sequelize.UUID,
        }
    }, {
        timestamps: false,
        underscored: false,
        freezeTableName: true
    });

    return Like;
};