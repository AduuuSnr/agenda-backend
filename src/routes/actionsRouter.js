const express = require("express");
const {
  createAction,
  doAction,
  notificationHistory,
  getKeyword
} = require("../controllers/actionsController");

const router = express.Router();

router.route("/doAction").post(doAction);
router.route("/getNotificationHistory").post(notificationHistory);
router.route("/getKeyword").post(getKeyword);

module.exports = router;
