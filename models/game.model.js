module.exports = (sequelize, Sequelize) => {
    const Game = sequelize.define("game", {
        game_id: {
            type: Sequelize.STRING,
            primaryKey: true
        },
        game_title: {
            type: Sequelize.STRING
        },
        game_icon_filepath: {
            type: Sequelize.STRING
        },
    }, {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        freezeTableName: true
    });

    return Game;
};