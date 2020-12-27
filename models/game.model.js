module.exports = (sequelize, Sequelize) => {
    const Game = sequelize.define('Game', {
        GameId: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true

        },
        Title: {
            type: Sequelize.STRING
        },
        IconFilepath: {
            type: Sequelize.STRING
        },
    }, {
        timestamps: false,
        underscored: false,
        freezeTableName: true

    });

    return Game;
};