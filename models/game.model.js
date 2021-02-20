const { v4: uuidv4 } = require("uuid");

module.exports = (sequelize, Sequelize) => {
    const Game = sequelize.define('Game', {
        GameId: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            allowNull: false,
            unique: true,
            primaryKey: true
        },
        Title: {
            type: Sequelize.STRING
        },
        IconFilepath: {
            type: Sequelize.STRING
        },
        ReleaseDate: {
            type: Sequelize.STRING
        },
        Tags: {
            type: Sequelize.STRING,
            get() {
                return this.getDataValue('Tags').split(',');
            },
            set(val) {
                let value = val.toString();
                this.setDataValue('Tags', value);
            },
        }
    }, {
        timestamps: false,
        underscored: false,
        freezeTableName: true
    });

    return Game;
};