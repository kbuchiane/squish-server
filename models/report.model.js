module.exports = (sequelize, Sequelize) => {
    const Report = sequelize.define('Report', {
        ReportId: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            allowNull: false,
            unique: true,
            primaryKey: true
        },
        ReporterId: {
            type: Sequelize.UUID,
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
            type: Sequelize.UUID,
        },
        CommentId: {
            type: Sequelize.UUID,
        }
    }, {
        timestamps: false,
        underscored: false,
        freezeTableName: true
    });

    return Report;
};