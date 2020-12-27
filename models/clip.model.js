module.exports = (sequelize, Sequelize) => {
    const Clip = sequelize.define('Clip', {
        ClipId: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true
        },
        PosterUserId: {
            type: Sequelize.BIGINT
        },
        VideoFilepath: {
            type: Sequelize.STRING
        },
        Title: {
            type: Sequelize.STRING
        },
        GameId: {
            type: Sequelize.BIGINT
        },
        Duration: {
            type: Sequelize.TIME
        },
        DateCreated: {
            type: Sequelize.DATE
        },
        ThumbnailFilepath: {
            type: Sequelize.STRING
        },
        ViewCount: {
            type: Sequelize.BIGINT
        },
    }, {
        timestamps: false,
        underscored: false,
        freezeTableName: true

    });

    return Clip;
};