module.exports = (sequelize, Sequelize) => {
    const LikeClip = sequelize.define('LikeClip', {
        LikeId: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            allowNull: false,
            unique: true,
            primaryKey: true
        },
        // TODO update to be specific set of types?
        /*
        Type: {
            type: Sequelize.ENUM,
            values: ['Like', 'Impressive', 'Funny', 'Discussion'] results[i].
        },
        */
        Types: {
            type: Sequelize.STRING,
            get() {
                return this.getDataValue('Types').split(',');
            },
            set(val) {
                let value = val.toString();
                this.setDataValue('Types', value);
            },
        },
        ClipId: {
            type: Sequelize.UUID,
        },
        UserId: {
            type: Sequelize.UUID,
        }
    }, {
        timestamps: false,
        underscored: false,
        freezeTableName: true
    });

    return LikeClip;
};