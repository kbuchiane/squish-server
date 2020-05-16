async confirmUser(emailAddr, confirmId) {
        // Functions
        function codeExpired(datetime) {
            var nowTime = moment();
            var codeTime = moment(datetime);
            var minuteDiff = nowTime.diff(codeTime, 'minutes');
            var maxMinutes = 4;

            if (minuteDiff < maxMinutes) {
                return false;
            }

            return true;
        };

        async function updateVerificationCode(emailAddr) {
            return new Promise(function (resolve, reject) {
                var updateCodeRet = {
                    success: true,
                    message: ""
                };

                // Generate new code and date
                var newDateCreated = moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");

                var newUserConfirmId = uuidv4();
                newUserConfirmId = newUserConfirmId.substring(0, 8);

                // Upate db code
                var sql = "UPDATE user SET user_confirm_id = ?, confirm_id_date_created = '"
                    + newDateCreated + "', verify_attempt_count = 0 WHERE active = false AND email = '"
                    + emailAddr + "'";
                db.query(sql, newUserConfirmId, function (err, result) {
                    if (err) {
                        updateCodeRet.success = false;
                        updateCodeRet.message = "There was an issue sending a new verification code, please try again later";
                    } else {
                        updateCodeRet.message = newUserConfirmId;
                    }

                    resolve(updateCodeRet);
                });
            });
        };

        async function addVerifyAttempt(emailAddr) {
            return new Promise(function (resolve, reject) {
                var addVerifyAttemptRet = {
                    success: true,
                    message: ""
                };

                var sql = "UPDATE user SET verify_attempt_count = verify_attempt_count + 1 WHERE email = ?";
                db.query(sql, emailAddr, function (err, result) {
                    if (err) {
                        addVerifyAttemptRet.success = false;
                        addVerifyAttemptRet.message = "There was an issue verifying your account, please try again later";
                    }

                    resolve(addVerifyAttemptRet);
                });
            });
        };

        async function verifyUser(emailAddr, confirmId) {
            return new Promise(function (resolve, reject) {
                var verifyUserRet = {
                    success: true,
                    message: "",
                    resendCode: false,
                    incrementAttempt: false,
                    username: ""
                };

                var sql = "SELECT * FROM user WHERE email = ? AND active = false";
                db.query(sql, emailAddr, function (err, result) {
                    if (err) {
                        verifyUserRet.success = false;
                        verifyUserRet.message = "There was an issue verifying your account, please try again later";
                    }

                    if (result.length === 0) {
                        verifyUserRet.success = false;
                        verifyUserRet.message = "Email entered was not found, or has already been verified";
                    } else if (result[0].verify_attempt_count == 3) {
                        verifyUserRet.success = false;
                        verifyUserRet.message = "Maximum attempts reached, a new verification code has been sent to " + emailAddr;
                        verifyUserRet.resendCode = true;
                    } else if (codeExpired(result[0].confirm_id_date_created)) {
                        verifyUserRet.success = false;
                        verifyUserRet.message = "Verification code has expired, a new code has been sent to " + emailAddr;
                        verifyUserRet.resendCode = true;
                    } else if (result[0].user_confirm_id != confirmId) {
                        verifyUserRet.success = false;
                        verifyUserRet.message = "Entered verification code is incorrect";
                        verifyUserRet.incrementAttempt = true;
                    } else {
                        verifyUserRet.username = result[0].username;
                    }

                    resolve(verifyUserRet);
                });
            });
        };

        async function updateVerifiedUser(emailAddr) {
            return new Promise(function (resolve, reject) {
                var updateVerifiedUserRet = {
                    success: true,
                    message: ""
                };

                var sql = "UPDATE user SET user_confirm_id = null, confirm_id_date_created = null, verify_attempt_count = 0, active = true WHERE email = ?";
                db.query(sql, emailAddr, function (err, result) {
                    if (err) {
                        updateVerifiedUserRet.success = false;
                        updateVerifiedUserRet.message = "There was an issue verifying your account, please try again later";
                    }

                    resolve(updateVerifiedUserRet);
                });
            });
        };

        // Processes
        var ret = {
            success: true,
            message: ""
        };

        var checkStringRet = await checkStringEntries(emailAddr, confirmId);
        if (!checkStringRet.success) {
            return checkStringRet;
        }

        var verifyUserRet = await verifyUser(emailAddr, confirmId);
        if (!verifyUserRet.success) {
            if (verifyUserRet.resendCode) {
                var updateCodeRet = await updateVerificationCode(emailAddr);

                if (updateCodeRet.success) {
                    var email = new Email();
                    await email.sendConfirmation(emailAddr, updateCodeRet.message);
                }
            } else if (verifyUserRet.incrementAttempt) {
                await addVerifyAttempt(emailAddr);
            }

            ret.success = false;
            ret.message = verifyUserRet.message;
            return ret;
        } else {
            var updateVerifiedUserRet = await updateVerifiedUser(emailAddr);
            updateVerifiedUserRet.message = verifyUserRet.username;

            return updateVerifiedUserRet;
        }
    };