module.exports = (sequelize, Sequelize) => {
    const Comment = sequelize.define('Comment', {
        CommentId: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true
        },
        UserId: {
            type: Sequelize.BIGINT
        },
        Text: {
            type: Sequelize.TEXT('medium')
        },
        DateCreated: {
            type: Sequelize.DATE
        },
        ParentClipId: {
            type: Sequelize.BIGINT
        },
        ParentCommentId: {
            type: Sequelize.BIGINT
        }
    }, {
        timestamps: false,
        underscored: false,
        freezeTableName: true

    });

    return Comment;
};