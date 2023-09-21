const query = require("../db/config");
const {httpResponse} = require("../utils/helpers");
const Company = require("../models_mysql/CompanyModel");
const Group = require("../models_mysql/GroupModel");
const Task = require("../models_mysql/TaskModel");
const User = require("../models_mysql/UserModel");
const notify = require("onesignal-node");
const {getUser} = require("./userController");
const checkPerm = require("../utils/perm");
const http = require("http");

exports.createCompany = async (req, res, next) => {
    const {companyName, companyDescription, ownerId} = req.body;


    let {banner} = req.body;
    try {
        const check = await User.prototype.getUser(ownerId);
        const companies = await Company.prototype.getCompanies(ownerId);

        if (check[0].tier === 0 && companies.length >= 1) { //Free tier cant create more than 1 company

            return httpResponse(
                res,
                200,
                "error",
                "You cant create new company. Please upgrade your account",
                "You cant create new company. Please upgrade your account"
            );
        }

        if (!companyName || !companyDescription || !ownerId) {

            return httpResponse(
                res,
                200,
                "success",
                "Please fill all blanks",
                "Please fill all blanks"
            );
        }
        if (!banner) {
            banner = "https://bagenda-space.fra1.cdn.digitaloceanspaces.com/companyBanners/image%2077.png";
        }
        const newCompany = new Company(companyName, companyDescription, banner, ownerId);
        const response = await newCompany.save();


        if (response.affectedRows !== 0) {

            const addOwnerToCompany = await Company.prototype.addCompanyUser(ownerId, response.insertId);

            return httpResponse(res, 200, "success", "You have successfully created a new company", newCompany);
        }
    } catch (error) {
        return httpResponse(res, 200, "error", error.toString());
    }
};

exports.searchCompany = async (req, res, next) => {
    const {query, userId} = req.body;

    const userCompanies = await Company.prototype.findUserCompanies(userId);
    console.log(userCompanies)
    let companyArr = [];
    let abc = 0;
    for (let i = 0; i < userCompanies.length; i++) {
        const company = await Company.prototype.getCompany(userCompanies[i].companyId);

        if (company.length !== 0) {
            companyArr = [...companyArr, company[0]];

            let memberArr = [];
            const members = await Company.prototype.findWorkers(company[0].id);
            if (members.length > 0) {
                for (let m = 0; m < members.length; m++) {
                    const memberDetail = await Company.prototype.findUserFromCompany(members[m].userId)
                    memberArr[m] = memberDetail[0];
                }
            }
            companyArr[i].companyMembers = memberArr;

        }

    }
    companyArr = companyArr.filter(company => (company?.companyName.toLowerCase().includes(query.toLowerCase())))


    //const result = await Task.prototype.search(query);

    if (companyArr.length > 0) {
        return httpResponse(res, 200, "success", companyArr);
    } else {
        return httpResponse(res, 200, "error", "Nothing found");
    }

}

exports.addUserToCompany = async (req, res, next) => {
    const {userId, companyId} = req.body;

    try {
        const response = await query(
            `INSERT INTO companyUsers(userId, companyId)
             VALUES (?, ?)`,
            [userId, companyId]
        );


        if (response.insertId) {
            return httpResponse(
                res,
                200,
                `User with id ${userId} is successfully added into Company with id ${companyId}`
            );
        } else if (response.errno === 1062) {
            return httpResponse(
                res,
                200,
                `User with id ${userId} is already in Company with id ${companyId}`
            );
        } else {
            return httpResponse(res, 200, `${response.sqlMessage}`);
        }
    } catch (error) {
        return httpResponse(res, 200, error.toString());
    }
};

exports.findAllCompanies = async (req, res, next) => {
    try {
        const response = await Company.prototype.findAll();
        return httpResponse(res, 200, "success", response);
    } catch (error) {
        return httpResponse(res, 200, "fail", error.toString());
    }
};

exports.deleteCompany = async (req, res, next) => {

    const {companyId} = req.body;

    const update = await Company.prototype.update(companyId, {status: 1});
    if (update.affectedRows) {
        return httpResponse(res, 200, "success", "Company Deleted Successfully");
    } else {
        return httpResponse(res, 200, "error", update.sqlMessage);
    }


}

exports.updateCompany = async (req, res, next) => {
    try {
        const {companyId, updateFields} = req.body;

        const response = await Company.prototype.update(companyId, updateFields);
        if (response.affectedRows) {
            return httpResponse(res, 200, "success", response.message);
        } else {
            return httpResponse(res, 200, "error", response.sqlMessage);
        }
    } catch (error) {
        return httpResponse(res, 200, "error", error.toString());
    }
};

exports.getCompanyTeams = async (req, res, next) => {
    const {userId} = req.body;

    const getUserCompanies = await Company.prototype.findUserCompanies(userId)
    let companyArr = [];
    for (let cc = 0; cc < getUserCompanies.length; cc++) {
        let companiy = await Company.prototype.getCompanies(getUserCompanies[cc].companyId);

        if (companiy[0]) {
            for (let i = 0; i < companiy.length; i++) {
                let memberArr = [];
                const members = await Company.prototype.findWorkers(companiy[0].id);
                if (members.length > 0) {
                    for (let m = 0; m < members.length; m++) {
                        const memberDetail = await Company.prototype.findUserFromCompany(members[m].userId)
                        memberArr[m] = memberDetail[0];
                    }
                }
                companiy[0].companyMembers = memberArr;
            }
            companyArr = [...companyArr, companiy[0]]
        }

    }
    return httpResponse(res, 200, "success", companyArr);

}

exports.getCompany = async (req, res, next) => {
    const {companyId} = req.body;

    const company = await Company.prototype.getCompany(companyId);
    let companyArr = []
    if (company[0]) {
        for (let i = 0; i < company.length; i++) {
            let memberArr = [];
            const members = await Company.prototype.findWorkers(company[0].id);
            if (members.length > 0) {
                for (let m = 0; m < members.length; m++) {
                    const memberDetail = await Company.prototype.findUserFromCompany(members[m].userId)
                    memberArr[m] = memberDetail[0];
                }
            }
            company[0].companyMembers = memberArr;
        }
        companyArr = [...companyArr, company[0]]
    }

    return httpResponse(res, 200, "success", "", companyArr)

}

exports.delCompMember = async (req, res, next) => {
    const {userId, memberId, companyId} = req.body;

    const checkOwner = await query(`SELECT ownerId
                                    FROM companies
                                    WHERE id = ${companyId}`);
    console.log(checkOwner)
    if (checkOwner[0].ownerId !== userId) {
        return httpResponse(res, 200, "error", "You don't have enough permission to do this.");
    }


    const findUserGroups = await Group.prototype.findUserGroups(memberId);

    findUserGroups.map(async group => {
        const getGroup = await query(`SELECT id, companyId, groupName FROM groups WHERE id = ${group.groupId}`)
        const getCompany = await query(`SELECT id, companyName FROM companies WHERE id = ${getGroup[0].companyId}`)

        if (getCompany[0].id === companyId) {
            console.log("user in this group "+ getGroup[0].groupName +" with company " + getCompany[0].companyName)
            const findUserTasks = await query(`SELECT * FROM tasks WHERE groupId = ${getGroup[0].id}`)
            console.log(findUserTasks)
            findUserTasks.map(async task =>  {
                const deleteTaskFromUser = await query(`DELETE FROM userTasks WHERE userId = ${memberId} AND taskId = ${task.id}`);
            })
            const deleteUserFromGroup = await query(`DELETE FROM groupUsers WHERE groupId = ${getGroup[0].id} AND userId = ${memberId}`);
        }
    });

    const delUser = await Company.prototype.deleteWorker(memberId, companyId);
    if (delUser.affectedRows) {
        return httpResponse(res, 200, "success", "User successfully kicked from company.", "User has been deleted from all task assigned to him and kicked from all groups that he joined.");
    } else {
        return httpResponse(res, 200, "error", "User can't kicked from group.");
    }
}

exports.getUserCompanies = async (req, res, next) => {
    const {userId} = req.body;

    const companies = await Company.prototype.findUserCompanies(userId);
    console.log(companies)
    if (companies.length > 0) {
        let companyArr = [];
        for (let i = 0; i < companies.length; i++) {
            const companiy = await Company.prototype.getCompany(companies[i].companyId);
            console.log(companiy)
            if (companiy.length === 1) {
                companyArr = [...companyArr, companiy[0]]
            }

        }
        return httpResponse(res, 200, "success", companyArr);
    }

}

exports.getCompanyMembers = async (req, res, next) => {
    const {companyId} = req.body;

    const memberss = await Company.prototype.findWorkers(companyId);
    if (memberss.length > 0) {
        let memberArr = [];
        for (let i = 0; i < memberss.length; i++) {


            const memberDetail = await Company.prototype.findUserFromCompany(memberss[i].userId)
            memberArr[i] = memberDetail[0];
        }
        return httpResponse(res, 200, "success", memberArr);
    }

}