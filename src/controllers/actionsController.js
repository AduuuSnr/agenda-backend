const query = require("../db/config");
const {httpResponse} = require("../utils/helpers");
const Company = require("../models_mysql/CompanyModel");
const Group = require("../models_mysql/GroupModel");
const Task = require("../models_mysql/TaskModel");
const User = require("../models_mysql/UserModel");
const Action = require("../models_mysql/ActionsModel");
const md5 = require("md5");
const axios = require('axios');
const notify = require("../utils/notify")


exports.getKeyword = async (req, res, next) => {
    const {params} = req.body;

    const config = {
        method: 'get',
        url: `https://derdigitaleunternehmer.de/tools/rankingcheck/rankingcheck2.php?kw=${encodeURI(params)}&db=at&url=`,
        headers: {}
    };

    axios(config)
        .then(function (response) {
            console.log("aa")
            //console.log(JSON.stringify(response.data));
            //return response.data

            return res.send(response.data)

        })
        .catch(function (error) {
            console.log(error);
        });

}

exports.notificationHistory = async (req, res, next) => {
    const {userId} = req.body;

    const getHistory = await Action.prototype.find({userId: userId}, "notifications");
    if (getHistory.length > 0) {
        for (let i = 0; i < getHistory.length; i++) {
            if (getHistory[i].actionId !== 0) {
                const getAction = await Action.prototype.find({id: getHistory[i].actionId}, "actions");
                if (getAction.length > 0) {
                    getHistory[i].actionDetails = getAction[0];
                    const actions = JSON.parse(getAction[0].action);
                    const from = await User.prototype.getUser(actions.from)
                    let actType;
                    console.log(actions)
                    if (actions.type === "company" && actions.action === "invite") {
                        actType = "companyInvite"
                    } else if (actions.type === "group" && actions.action === "invite") {
                        actType = "groupInvite"
                    } else if (actions.type === "company" && actions.action === "newUserJoin") {
                        actType = "newUserJoin"
                    } else if (actions.type === "group" && actions.action === "newUserJoin") {
                        actType = "newUserJoinGroup"
                    } else {
                        actType = "normal"
                    }
                    getHistory[i].actionDetails.type = actType
                    getHistory[i].actionDetails.from = from[0];

                }
            }

        }
        getHistory.sort(function(a,b){
            return new Date(b.date) - new Date(a.date);
        });
        return httpResponse(res, 200, "success", null, getHistory);
    } else {
        return httpResponse(res, 200, "success", "You don't have any appointments yet.");
    }


}

exports.doAction = async (req, res, next) => {

    try {
        const {token, accept} = req.body;

        const response = await Action.prototype.get(token);
        if (response.length > 0) {
            const actions = JSON.parse(response[0].action);

            if (accept === "deny") {
                const from = actions.from;
                const to = actions.to;
                const type = actions.type;
                if (type === "company") {

                    const getUser = await User.prototype.getUser(to)
                    await notify({
                        messages: {"en": getUser[0].fullname + " has denied your company invite."},
                        template: "d4abd3d0-6ac7-4880-9f95-68b778624ff2",
                        headings: {"en": "Invitation has beend denied"},
                        userId: from
                    })
                    //console.log(response[0].id)
                    const updateN = await Action.prototype.update(response[0].id, {"status": 2})
                    const addNotify = await Action.prototype.insert({
                        "content": getUser[0].fullname + " has denied your company invite.",
                        "userId": from,
                        "actionId": 0,
                        "date": new Date().toISOString()
                    })
                    //if(addNotify) {
                    console.log("test")
                    console.log(addNotify)
                    //}

                    if (updateN.affectedRows === 0) {
                        return httpResponse(res, 200, "error", updateN.sqlMessage);
                    }
                    return httpResponse(res, 200, "success", "You have denied invite");
                } else if (type === "group") {

                    const getUser = await User.prototype.getUser(to)
                    await notify({
                        messages: {"en": getUser[0].fullname + " has denied your group invite."},
                        template: "d4abd3d0-6ac7-4880-9f95-68b778624ff2",
                        headings: {"en": "Invitation has beend denied"},
                        userId: from
                    })
                    //console.log(response[0].id)
                    const updateN = await Action.prototype.update(response[0].id, {"status": 2})
                    const addNotify = await Action.prototype.insert({
                        "content": getUser[0].fullname + " has denied your group invite.",
                        "userId": from,
                        "actionId": 0,
                        "date": new Date().toISOString()
                    })
                    //if(addNotify) {
                    console.log("test")
                    console.log(addNotify)
                    //}

                    if (updateN.affectedRows === 0) {
                        return httpResponse(res, 200, "error", updateN.sqlMessage);
                    }
                    return httpResponse(res, 200, "success", "You have denied invite");
                }

            }


            switch (actions.action) {
                case "invite":
                    console.log("invite accept")
                    const from = actions.from;
                    const to = actions.to;
                    const type = actions.type;
                    if (type === "company") {
                        const companyId = actions.companyId;
                        console.log("company invite")
                        const addUser = await Company.prototype.addCompanyUser(to, companyId);
                        if (addUser.affectedRows > 0) {
                            const getUser = await User.prototype.getUser(to)
                            await notify({
                                messages: {"en": getUser[0].fullname + " has accepted your company invite."},
                                template: "d4abd3d0-6ac7-4880-9f95-68b778624ff2",
                                headings: {"en": "New user joined to company"},
                                userId: from
                            })
                            //console.log(getUser[0].fullname)
                            const compUsers = await Company.prototype.findWorkers(companyId);
                            console.log(compUsers)
                            for (let i = 0; i < compUsers.length; i++) {
                                await notify({
                                    messages: {"en": getUser[0].fullname + " has joined your company."},
                                    template: "d4abd3d0-6ac7-4880-9f95-68b778624ff2",
                                    headings: {"en": "New user joined to company"},
                                    userId: compUsers[i].userId
                                })

                                const invite = {
                                    "action": "newUserJoin",
                                    "type": "company",
                                    "companyId": companyId,
                                    "from": to,
                                    "to": compUsers[i].userId
                                }
                                const token = md5(new Date().getTime() + companyId + to + getUser[0].id).toString();
                                const addQuery = await Action.prototype.createInviteCompany(token, JSON.stringify(invite));
                                if (addQuery) {
                                    const addNotify = await Action.prototype.insert({
                                        "content": getUser[0].fullname + " has joined your company.",
                                        "userId": compUsers[i].userId,
                                        "actionId": addQuery.insertId,
                                        "date": new Date().toISOString()
                                    })
                                    console.log(addNotify)
                                    console.log("ererererere")
                                }
                            }
                            const updateN = await Action.prototype.update(response[0].id, {"status": 1})
                            return httpResponse(res, 200, "success", "You have successfully joined a new company");
                        } else {
                            return httpResponse(res, 200, "error", addUser.sqlMessage.toString())
                        }
                    }
                    else if (type === "group") {
                        const groupId = actions.groupId;
                        console.log("GROUP INVITE")
                        const addUser = await Group.prototype.addMember(to, groupId)
                        if (addUser.affectedRows > 0) {
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
                            const insertNew = await User.prototype.insertPermission(to, JSON.stringify(permissions), groupId)
                            if (insertNew.affectedRows) {
                                const getUser = await User.prototype.getUser(to)
                                await notify({
                                    messages: {"en": getUser[0].fullname + " has accepted your group invite."},
                                    template: "d4abd3d0-6ac7-4880-9f95-68b778624ff2",
                                    headings: {"en": "New user joined to group"},
                                    userId: from
                                })
                                //console.log(getUser[0].fullname)
                                const compUsers = await Group.prototype.findWorkers(groupId);
                                console.log(compUsers)
                                for (let i = 0; i < compUsers.length; i++) {
                                    await notify({
                                        messages: {"en": getUser[0].fullname + " has joined your group."},
                                        template: "d4abd3d0-6ac7-4880-9f95-68b778624ff2",
                                        headings: {"en": "New user joined to group"},
                                        userId: compUsers[i].userId
                                    })

                                    const invite = {
                                        "action": "newUserJoinGroup",
                                        "type": "group",
                                        "groupId": groupId,
                                        "from": to,
                                        "to": compUsers[i].userId
                                    }
                                    const token = md5(new Date().getTime() + groupId + to + getUser[0].id).toString();
                                    const addQuery = await Action.prototype.createInviteCompany(token, JSON.stringify(invite)); //inserting new user joined notification, dont get mad for modal name
                                    if (addQuery) {
                                        const addNotify = await Action.prototype.insert({
                                            "content": getUser[0].fullname + " has joined your group.",
                                            "userId": compUsers[i].userId,
                                            "actionId": addQuery.insertId,
                                            "date": new Date().toISOString()
                                        })
                                        console.log(addNotify)
                                        console.log("ererererere")
                                    }
                                }
                                const updateN = await Action.prototype.update(response[0].id, {"status": 1})
                                return httpResponse(res, 200, "success", "You have successfully joined a new group");
                            } else {
                                return httpResponse(res, 200, "error", "Permission error ")
                            }


                        } else {
                            return httpResponse(res, 200, "error", addUser.sqlMessage.toString())
                        }
                    }

                    break;

                default:
                    return httpResponse(res, 200, "error", "It works!")
                    break;
            }

            //return httpResponse(res, 200, "success", response.message);
        }
        else {

            const {actionType, actionFrom, actionTo} = req.body;

            if (actionType === "companyInvite") {
                console.log("here")
                const {companyId} = req.body;

                const findUser = await User.prototype.find({userId: actionTo}, "users");
                if (findUser.length === 0) {
                    return httpResponse(res, 200, "error", "User cant be found");
                }
                const findUserComp = await User.prototype.find({
                    userId: findUser[0].id,
                    companyId: Number(companyId)
                }, "companyUsers");
                console.log(findUserComp)
                if (findUserComp.length > 0) {
                    return httpResponse(res, 200, "error", "User is already in this company");
                }

                const invite = {
                    "action": "invite",
                    "type": "company",
                    "companyId": companyId,
                    "from": actionFrom,
                    "to": findUser[0].id
                }
                const token = md5(new Date().getTime() + actionFrom + actionTo + actionType).toString();
                const addQuery = await Action.prototype.createInviteCompany(token, JSON.stringify(invite));

                if (addQuery?.affectedRows > 0) {
                    const company = await Company.prototype.getCompany(companyId);
                    const user = await User.prototype.getUser(actionFrom);
                    await Action.prototype.insert({
                        "content": "Invited you to " + company[0].companyName,
                        "userId": findUser[0].id,
                        "actionId": addQuery.insertId,
                        "date": new Date().toISOString()
                    })

                    addQuery.token = token;


                    // Push notification to device
                    console.log(findUser[0].id)

                    await notify({
                        messages: {"en": user[0].fullname + ", invited you to " + company[0].companyName},
                        template: "d4abd3d0-6ac7-4880-9f95-68b778624ff2",
                        headings: {"en": "New Company Invite"},
                        userId: findUser[0].id
                    })
                    return httpResponse(res, 200, "success", "User successfully invited to the company", addQuery);
                }
            } else if (actionType === "groupInvite") {
                /************ GROUP INVITE ************/
                console.log("here")
            const {groupId} = req.body;
                console.log(req.body)
            const findUser = await User.prototype.find({userId: actionTo}, "users");
            if (findUser.length === 0) {
                return httpResponse(res, 200, "error", "User cant be found");
            }
            const findUserComp = await User.prototype.find({
                userId: findUser[0].id,
                groupId: Number(groupId)
            }, "groupUsers");
            console.log(findUserComp)
            if (findUserComp.length > 0) {
                return httpResponse(res, 200, "error", "User is already in this group");
            }

            const invite = {
                "action": "invite",
                "type": "group",
                "groupId": groupId,
                "from": actionFrom,
                "to": findUser[0].id
            }
            const token = md5(new Date().getTime() + actionFrom + actionTo + actionType).toString();
            const addQuery = await Action.prototype.createInviteCompany(token, JSON.stringify(invite));

            if (addQuery?.affectedRows > 0) {
                const company = await Group.prototype.get(groupId);
                const user = await User.prototype.getUser(actionFrom);
                await Action.prototype.insert({
                    "content": "Invited you to " + company[0].groupName,
                    "userId": findUser[0].id,
                    "actionId": addQuery.insertId,
                    "date": new Date().toISOString()
                })

                addQuery.token = token;


                // Push notification to device
                console.log(findUser[0].id)

                await notify({
                    messages: {"en": user[0].fullname + ", invited you to " + company[0].groupName},
                    template: "d4abd3d0-6ac7-4880-9f95-68b778624ff2",
                    headings: {"en": "New Group Invite"},
                    userId: findUser[0].id
                })
                return httpResponse(res, 200, "success", "User successfully invited to the group", addQuery);
            }
        } else {
                return httpResponse(res, 200, "error", "An error occured", response.sqlMessage);
            }


        }
    } catch (error) {
        console.log(req.body)
        return httpResponse(res, 200, "error", error.toString());
    }

}