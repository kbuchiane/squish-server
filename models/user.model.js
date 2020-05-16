module.exports = (sequelize, Sequelize) => {
    const User = sequelize.define("user", {
        user_id: {
            type: Sequelize.STRING
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
        user_icon_file: {
            type: Sequelize.STRING
        },
        active: {
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
    });

    return User;
};