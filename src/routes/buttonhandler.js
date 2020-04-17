module.exports = function(app) {
    var buttonController = require('../controllers/buttonController');

    app.route('/buttonPush')
        .get(buttonController.buttonPushed);
};