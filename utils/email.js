class Email {
    constructor() {
        // Empty
    };

    sendConfirmation(email) {
        return new Promise(function(resolve, rejct) {
            console.log("sending confirmation email");

            var ret = {
                success: true,
                message: ""
            }

            resolve(ret);
        });
    }
}

module.exports = Email;