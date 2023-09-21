const express = require("express");
const {
  createGroup,
  findAllGroups,
  updateGroup,
  getGroups,
  getCompanyTeams,
  addUserToGroup,
  deleteGroup,
  getUserGroups,
  delTeamMember,
  getGroup,
  getTeamMembers
} = require("../controllers/groupController");
const router = express.Router();

router.route("/").post(createGroup).get(findAllGroups);
router.route("/update").post(updateGroup);
router.route("/getGroups").post(getGroups);
router.route("/getGroup").post(getGroup);
router.route("/getCompanyTeams").post(getCompanyTeams);
router.route("/addMember").post(addUserToGroup);
router.route("/delGroup").post(deleteGroup);
router.route("/getUserGroups").post(getUserGroups);
router.route("/deleteTeamMember").delete(delTeamMember);
router.route("/getTeamMembers").post(getTeamMembers);

module.exports = router;
