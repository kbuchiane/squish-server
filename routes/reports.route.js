const express = require("express");
const { auth } = require("../middleware");
const { verifyCredentials } = require("../middleware");
const reportController = require("../controllers/report.controller");
const router = express.Router();

router.post("/",
    [
        verifyCredentials.checkCredentials,
        auth.verifyToken
    ],
    reportController.reports
);

router.post("/reportClip",
    [
        verifyCredentials.checkCredentials,
        auth.verifyToken
    ],
    reportController.reportClip
);

router.post("/reportComment",
    [
        verifyCredentials.checkCredentials,
        auth.verifyToken
    ],
    reportController.reportComment
);

module.exports = router;
