module.exports = (sequelize, Sequelize) => {
    const LikeComment = sequelize.define('LikeComment', {
        LikeId: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            allowNull: false,
            unique: true,
            primaryKey: true
        },
        // TODO the Type field can probably be removed
        Type: {
            type: Sequelize.ENUM,
            values: ['Like', 'Impressive', 'Funny', 'Discussion']
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

    return LikeComment;
};