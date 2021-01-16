module.exports = (sequelize, Sequelize) => {
    const Report = sequelize.define('Report', {
        ReportId: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true
        },
        ReporterId: {
            type: Sequelize.BIGINT
        },
        Reason: {
            type: Sequelize.ENUM,
            values: ['Content', 'Language', 'Quality', 'Off-Topic', 'Offensive', 'Inappropriate']
        },
        Text: {
            type: Sequelize.TEXT('medium')
        },
        DateCreated: {
            type: Sequelize.DATE
        },
        Resolved: {
            type: Sequelize.TINYINT
        },
        DateResolved: {
            type: Sequelize.DATE
        },
        ClipId: {
            type: Sequelize.BIGINT
        },
        CommentId: {
            type: Sequelize.BIGINT
        }
    }, {
        timestamps: false,
        underscored: false,
        freezeTableName: true

    });

    return Report;
};