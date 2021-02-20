const { v4: uuidv4 } = require("uuid");

module.exports = (sequelize, Sequelize) => {
    const Clip = sequelize.define('Clip', {
        ClipId: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            allowNull: false,
            unique: true,
            primaryKey: true
        },
        PosterUserId: {
            type: Sequelize.UUID,
        },
        VideoFilepath: {
            type: Sequelize.STRING
        },
        Title: {
            type: Sequelize.STRING
        },
        GameId: {
            type: Sequelize.UUID,
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