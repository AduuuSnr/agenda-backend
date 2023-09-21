const query = require("../db/config");
const Group = require("../models_mysql/GroupModel");
const {httpResponse} = require("../utils/helpers");
const Task = require("../models_mysql/TaskModel");
const User = require("../models_mysql/UserModel");
const Company = require("../models_mysql/CompanyModel");
const checkPerm = require("../utils/perm");

exports.createGroup = async (req, res, next) => {
    const {groupName, groupDescription, banner, companyId, userId} = req.body;




    const findCompanyOwner = await Company.prototype.getCompany(companyId)
    const check = await User.prototype.getUser(findCompanyOwner[0].ownerId);
    const teams = await Group.prototype.getGroups(companyId);
    if (check[0].tier === 0 && teams.length >= 1) { //Free tier cant create more than 1 team

        return httpResponse(
            res,
            200,
            "error",
            "You cant create new team. Please upgrade your account",
            "You cant create new team. Please upgrade your account"
        );
    }

    try {
        const newGroup = new Group(groupName, groupDescription, banner, companyId);

        if (!groupName || !groupDescription || !banner || !companyId) {
            return httpResponse(
                res,
                200,
                "error",
                "Please fill all blanks",
                "Please fill all blanks"
            );
        }


        const response = await newGroup.save();
        if (response.affectedRows) {
            const addMember = await Group.prototype.addMember(userId, response.insertId);
            const permissions = {
                allowCreateTask: true,
                allowEditTask: true,
                allowDeleteTask: true,
                allowEditGroup: true,
                allowViewMap: true,
                allowAddUser: true,
                allowKickUser: true,
            }

            if (addMember.affectedRows) {
                const insertNew = await User.prototype.insertPermission(userId, JSON.stringify(permissions), response.insertId)

                if (insertNew.affectedRows) {
                    return httpResponse(res, 200, "success", "Team Created.", newGroup);
                }
            } else {
                return httpResponse(res, 200, "error", "error.", addMember);
            }
        } else {
            return httpResponse(res, 200, "error", response.sqlMessage);
        }
    } catch (error) {
        return httpResponse(res, 200, "fail", error.toString());
    }
};

exports.deleteGroup = async (req, res, next) => {

    const {groupId} = req.body;

    const del = await Group.prototype.deleteById(groupId);
    if (del.affectedRows) {
        return httpResponse(res, 200, "success", "Team deleted.", "Team deleted.");
    } else {
        return httpResponse(res, 200, "error", "An error occured.", del);
    }

};

exports.getUserGroups = async (req, res, next) => {
    const {userId, companyId} = req.body;

    const getUserGroups = await Group.prototype.findUserGroups(userId);

    let groups = [];
    for (let i = 0; i < getUserGroups.length; i++) {
        const getGroup = await Group.prototype.getGroup(getUserGroups[i].groupId, companyId);
        if (getGroup.length > 0) {
            const findGroupMembers = await Group.prototype.findWorkers(getGroup[0].id);
            let memArr = [];
            for (let gm = 0; gm < findGroupMembers.length; gm++) {
                const findUser = await User.prototype.getUser(findGroupMembers[gm].userId);
                memArr = [...memArr, findUser[0]]
            }
            getGroup[0].teamMembers = memArr;
            groups = [...groups, getGroup[0]];
        }
    }

    return httpResponse(res, 200, "success", "Users groups", groups)
};

exports.addUserToGroup = async (req, res, next) => {
    const {userId, groupId} = req.body;

    try {

        const checkMembers = await Group.prototype.findWorkers(groupId);
        const getgroup = await Group.prototype.getGroup(groupId);
        const getMemberShip = await Company.prototype.getCompany(getgroup[0].companyId)
        const getUser = await User.prototype.getUser(getMemberShip[0].ownerId)
        if (checkMembers.length >= 10 && getUser[0].tier === 0) {
            return httpResponse(
                res,
                200,
                "error",
                "You cant add more than 10 members. Please upgrade your account"
            );
        }

        const response = await query(
            `INSERT INTO groupUsers(userId, groupId)
             VALUES (?, ?)`,
            [userId, groupId]
        );
        /*** PERMISSIONS ***/
        const permissions = {
            allowCreateTask: false,
            allowEditTask: false,
            allowDeleteTask: false,
            allowEditGroup: false,
            allowViewMap: false,
            allowAddUser: false,
            allowKickUser: false,
        }
        const insertNew = await User.prototype.insertPermission(userId, JSON.stringify(permissions), groupId)
        if (response.affectedRows) {
            return httpResponse(
                res,
                200,
                `User with id ${userId} is successfully added into Team with id ${groupId}`
            );
        } else {
            return httpResponse(res, 200, response.sqlMessage);
        }
    } catch (error) {
        return httpResponse(res, 200, error.toString());
    }
};

exports.searchGroup = async (req, res, next) => {
    const {query} = req.body;

    const result = await Group.prototype.search(query);

    if (result.length > 0) {
        return httpResponse(res, 200, "success", result);
    } else {
        return httpResponse(res, 200, "error", "Nothing found");
    }

};

exports.findAllGroups = async (req, res, next) => {
    try {
        const response = await Group.prototype.findAll();
        return httpResponse(res, 200, "success", response);
    } catch (error) {
        return httpResponse(res, 200, "fail", error.toString());
    }
};

exports.getGroups = async (req, res, next) => {
    const {companyId} = req.body;
    try {
        const response = await Group.prototype.getGroups(companyId);
        return httpResponse(res, 200, "success", response);
    } catch (error) {
        return httpResponse(res, 200, "fail", error.toString());
    }
};

exports.getGroup = async (req, res, next) => {
    const {groupId} = req.body;
    try {
        const response = await Group.prototype.get(groupId);

        if(response.length > 0) {
            const findGroupMembers = await Group.prototype.findWorkers(response[0].id);
            let memArr = [];
            for (let gm = 0; gm < findGroupMembers.length; gm++) {
                const findUser = await User.prototype.getUser(findGroupMembers[gm].userId);
                memArr = [...memArr, findUser[0]]
            }
            response[0].teamMembers = memArr;
        }

        return httpResponse(res, 200, "success", response);
    } catch (error) {
        return httpResponse(res, 200, "fail", error.toString());
    }
};

exports.updateGroup = async (req, res, next) => {
    try {
        const {groupId, updateFields} = req.body;

        const response = await Group.prototype.update(groupId, updateFields);
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
    const {companyId} = req.body;

    const teams = await Group.prototype.getGroups(companyId);
    if (teams.length > 0) {
        for (let i = 0; i < teams.length; i++) {
            let memberArr = [];
            const members = await Group.prototype.findWorkers(teams[i].id);
            if (members.length > 0) {
                for (let m = 0; m < members.length; m++) {
                    const memberDetail = await Group.prototype.findUserFromTeam(members[m].userId)
                    memberArr[m] = memberDetail[0];
                }
            }
            teams[i].teamMembers = memberArr;
        }
        return httpResponse(res, 200, "success", teams);
    }

};

exports.delTeamMember = async (req, res, next) => {

    const {userId, memberId, groupId} = req.body;

    if(await checkPerm(userId,groupId, "allowKickUser")) {

        const memberTasks = await Task.prototype.findUserTasks(memberId);

        memberTasks.map(async task => {
            const deleteTaskFromUser = await query(`DELETE FROM userTasks WHERE taskId = ${task.id} AND userId = ${memberId}`);
            console.log("User tasks revoked.");
        })

        const delUser = await Group.prototype.deleteTeamMember(memberId, groupId);
        if(delUser.affectedRows) {
            console.log("User kicked from group.")
            return httpResponse(res, 200, "success", "User successfully kicked from group.");
        } else {
            return httpResponse(res, 200, "error", "User can't kicked from group.");
        }
    } else {
        return httpResponse(res, 200, "error", "You don't have enough permission to do this.");
    }


};

exports.getTeamMembers = async (req, res, next) => {

    const {groupId} = req.body;

    const getGroupMembers = await Group.prototype.findWorkers(groupId);

    let users = [];

    for(const member of getGroupMembers){
        let user = await User.prototype.getUser(member.userId);
        users = [...users, user[0]]

    }

    return httpResponse(res, 200, "success", "Team Members", users)
    console.log(users)
}