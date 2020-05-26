module.exports = (sequelize, Sequelize) => {
    const User = sequelize.define("user", {
        user_id: {
            type: Sequelize.STRING,
            primaryKey: true
        },
        username: {
            type: Sequelize.STRING
        },
        email: {
            type: Sequelize.STRING
        },
        password: {
            type: Sequelize.STRING
        },
        date_created: {
            type: Sequelize.STRING
        },
        user_icon_filepath: {
            type: Sequelize.STRING
        },
        active: {
            type: Sequelize.STRING
        },
        refresh_token: {
            type: Sequelize.STRING
        },
        refresh_token_expiration: {
            type: Sequelize.STRING
        },
        user_confirm_id: {
            type: Sequelize.STRING
        },
        confirm_id_date_created: {
            type: Sequelize.STRING
        },
        verify_attempt_count: {
            type: Sequelize.STRING
        },
        admin: {
            type: Sequelize.STRING
        }
    }, {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        freezeTableName: true
    });

    return User;
};