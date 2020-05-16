async resendCode(emailAddr) {
    // Functions
    async function updateVerificationCode(emailAddr) {
        return new Promise(function (resolve, reject) {
            var updateCodeRet = {
                success: true,
                message: ""
            };

            // Generate new code
            var newDateCreated = moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");

            var newUserConfirmId = uuidv4();
            newUserConfirmId = newUserConfirmId.substring(0, 8);

            // Upate db code
            var sql = "UPDATE user SET user_confirm_id = ?, confirm_id_date_created = '"
                + newDateCreated
                + "', verify_attempt_count = 0 WHERE email = '"
                + emailAddr + "' AND active = false";
            db.query(sql, newUserConfirmId, function (err, result) {
                if (err) {
                    updateCodeRet.success = false;
                    updateCodeRet.message = "There was an issue sending a new verification code, please try again later";
                } else if (result.affectedRows === 0) {
                    updateCodeRet.success = false;
                    updateCodeRet.message = "Email entered was not found, or has already been verified";
                } else {
                    updateCodeRet.message = newUserConfirmId;
                }

                resolve(updateCodeRet);
            });
        });
    };

    // Processes
    var ret = {
        success: true,
        message: ""
    };

    var checkStringRet = await checkStringEntries(emailAddr);
    if (!checkStringRet.success) {
        return checkStringRet;
    }

    var updateCodeRet = await updateVerificationCode(emailAddr);
    if (!updateCodeRet.success) {
        return updateCodeRet;
    }

    var email = new Email();
    var emailConfirmRet = await email.sendConfirmation(emailAddr, updateCodeRet.message);
    if (!emailConfirmRet.success) {
        return emailConfirmRet;
    } else {
        ret.message = "A confirmation email has been sent to "
            + emailAddr +
            ", please enter the verification code to finish signing up";
        return ret;
    }
};