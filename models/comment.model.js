module.exports = (sequelize, Sequelize) => {
    const Comment = sequelize.define('Comment', {
        CommentId: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            allowNull: false,
            unique: true,
            primaryKey: true
        },
        UserId: {
            type: Sequelize.UUID,
        },
        Text: {
            type: Sequelize.TEXT('medium')
        },
        DateCreated: {
            type: Sequelize.DATE
        },
        ClipId: {
            type: Sequelize.UUID,
        },
        ParentCommentId: {
            type: Sequelize.UUID,
        }
    }, {
        timestamps: false,
        underscored: false,
        freezeTableName: true
    });

    return Comment;
};