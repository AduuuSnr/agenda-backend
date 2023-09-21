const express = require("express");
const {
    createCompany,
    addUserToCompany,
    updateCompany,
    getCompanyTeams,
    searchCompany,
    getCompanyMembers,
    deleteCompany,
    getUserCompanies,
    delCompMember,
    getCompany
} = require("../controllers/companyController");
const {delTeamMember} = require("../controllers/groupController");

const router = express.Router();

router.route("/").post(createCompany);
router.route("/add-user").post(addUserToCompany);
router.route("/update").post(updateCompany);
router.route("/getCompanyTeams").post(getCompanyTeams);
router.route("/getCompanyMembers").post(getCompanyMembers);
router.route("/search").post(searchCompany);
router.route("/delCompany").post(deleteCompany);
router.route("/getUserCompanies").post(getUserCompanies);
router.route("/deleteCompanyMember").delete(delCompMember);
router.route("/getCompany").post(getCompany);

module.exports = router;
