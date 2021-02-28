module.exports = (sequelize, Sequelize) => {
    const Clip = sequelize.define('Clip', {
        ClipId: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            allowNull: false,
            unique: true,
            primaryKey: true
        },
        UserId: {
            type: Sequelize.UUID,
        },
        VideoFilepath: {
            type: Sequelize.STRING
        },
        Type: {
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
        Thumbnail: {
            type: Sequelize.STRING
        },
        ViewCount: {
            type: Sequelize.BIGINT
        },
        // TODO update to be specific set of filters?
        /*
        Filters: {
            type: Sequelize.ENUM,
            values: ['MostPopular', 'FollowedUsersOnly', 'SpecificGames', 'MostImpressive', 'Funniest', 'BestDiscussion']
        },
        */
        Filters: {
            type: Sequelize.STRING,
            get() {
                return this.getDataValue('Filters').split(',');
            },
            set(val) {
                let value = val.toString();
                this.setDataValue('Filters', value);
            },
        },
    }, {
        timestamps: false,
        underscored: false,
        freezeTableName: true
    });

    return Clip;
};