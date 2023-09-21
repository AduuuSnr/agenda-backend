const express = require("express");
const {
    createUser,
    findAllUsers,
    login,
    updateUser,
    getUser,
    createForgot,
    getLocation,
    getRTCToken,
    searchUser,
    searchUserInvite,
    getPermissions,
    updatePermissions,
    testNotify
} = require("../controllers/userController");
const router = express.Router();

router.route("/").get(findAllUsers);
router.route("/login").post(login);
router.route("/register").post(createUser);
router.route("/update").post(updateUser);
router.route("/getUser").post(getUser);
router.route("/createForgot").post(createForgot);
router.route("/getLocation").post(getLocation);
router.route("/getRTCToken").post(getRTCToken);
router.route("/searchUser").post(searchUser);
router.route("/searchUserInvite").post(searchUserInvite);
router.route("/getPermissions").post(getPermissions);
router.route("/updatePermissions").post(updatePermissions);
router.route("/testNotify").post(testNotify);

module.exports = router;
