const User = require("../models_mysql/UserModel");
const {isEmail} = require("validator");
const {httpResponse, generateUserId} = require("../utils/helpers");
const md5 = require("md5");
const sha256 = require("sha256");
const jwt = require("jsonwebtoken");
const notify = require("../utils/notify");
const Company = require("../models_mysql/CompanyModel");
const checkPerm = require("../utils/perm");
const query = require("../db/config");
const twilio = require("twilio");
// const ngrok = ("ngrok");

const AccessToken = twilio.jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;

function generateAccessToken(email) {
    console.log(AccessToken)
    return jwt.sign(email, process.env.TOKEN_SECRET, {expiresIn: "90d"});
}

exports.createUser = async (req, res, next) => {
    const {fullName, email} = req.body;
    let {password} = req.body;
    try {
        password = md5(md5(password) + sha256(password));

        const check = await User.prototype.login(email);
        if (check.length !== 0) {
            return httpResponse(res, 200, "error", "This e-mail address has been already used.");
        }


        if (!email || !isEmail(email)) {
            return httpResponse(res, 200, "error", "Please enter a valid Email");
        } else if (!fullName) {
            return httpResponse(
                res,
                200,
                "error",
                "Please enter a valid Name and Surname"
            );
        } else if (!password) {
            return httpResponse(res, 200, "error", "Please enter a valid Password");
        }

        let createUserId = generateUserId(fullName);
        while (User.prototype.find({userId: createUserId}, "users").length === 0) {
            createUserId = generateUserId(fullName);
            console.log("Checked : " + createUserId)

        }


        const newUser = new User(fullName, email, password, null, null, null, createUserId);
        const response = await newUser.save();

        if (response.affectedRows !== 0) {
            return httpResponse(res, 200, "success", "User created successfully", newUser);
        } else {
            return httpResponse(res, 200, "error", "Something went wrong", response);
        }
    } catch (error) {
        return httpResponse(res, 200, "error", "Something went wrong", error);
    }
};

exports.findAllUsers = async (req, res, next) => {
    try {
        const response = await User.prototype.findAll();

        return httpResponse(res, 200, "success", "All users data", response);
    } catch (error) {
        return httpResponse(res, 200, "error", "Something went wrong", error);
    }
};

exports.login = async (req, res, next) => {
    const {email, password} = req.body;
    try {
        const response = await User.prototype.login(email);
        if (response.length === 1) {
            const hash = md5(md5(password) + sha256(password));
            let login = await User.prototype.loginp(email, hash);
            if (login.length === 1) {
                const token = generateAccessToken({email});

                login = login[0];
                login.token = token;

                return httpResponse(res, 200, "success", "Successfully logged in.", login);
            } else {
                return httpResponse(res, 200, "error", "Invalid credentials");
            }
        } else {
            return httpResponse(res, 200, "error", "Invalid or wrong credentials");
        }

    } catch (error) {
        return httpResponse(res, 200, "error", error);
    }
};

exports.updateUser = async (req, res, next) => {
    try {
        const {userId, updateFields} = req.body;

        const response = await User.prototype.update(userId, updateFields);
        if (response.affectedRows) {
            return httpResponse(res, 200, "success", "success", response.message);
        } else {
            return httpResponse(res, 200, "error", response.sqlMessage);
        }
    } catch (error) {
        return httpResponse(res, 200, "error", error.toString());
    }
};

exports.getRTCToken = async (req, res, next) => {

    const {query} = req.body;

    if (!req.query) {
        return res.status(400).send("Username parameter is required");
    }
    const accessToken = new AccessToken(
        process.env.ACCOUNT_SID,
        process.env.API_KEY_SID,
        process.env.API_KEY_SECRET
    );

    // Set the Identity of this token
    accessToken.identity = query.userName;

    // Grant access to Video
    const grant = new VideoGrant();
    accessToken.addGrant(grant);

    // Serialize the token as a JWT
    const jwt = accessToken.toJwt();
    return httpResponse(res, 200, "success", "Your token is ready!", jwt)

}

exports.searchUser = async (req, res, next) => {
    const {text,} = req.body;


    const result = await User.prototype.searchUser(text);

    return httpResponse(res, 200, "success", "Search results", result)
}

exports.getPermissions = async (req, res, next) => {
    const {userId, groupId} = req.body;

    if (!userId) {
        return httpResponse(res, 200, "error", "NO user specified")
    } else if (!groupId) {
        return httpResponse(res, 200, "error", "NO group specified")
    }
    // const permissions = {
    //   allowCreateTask: false,
    //   allowEditTask: false,
    //   allowDeleteTask: false,
    //   allowEditGroup: false,
    //   allowViewMap: false,
    //   allowAddUser: false,
    //   allowKickUser: false,
    // }

    // console.log(JSON.stringify(permissions))

    let result = await User.prototype.getPermission(userId, groupId);
    const permissions = result[0].permission;
    result[0].permission = JSON.parse(permissions);

    let permissionTitles = JSON.parse(permissions);

    for (let i = 0; i < Object.keys(result[0].permission).length; i++) {
        const title = await User.prototype.getPermissionTitles(Object.keys(result[0].permission)[i]);
        const key = Object.keys(result[0].permission)[i];
        permissionTitles[Object.keys(result[0].permission)[i]] = title[0].permissionTitle;
    }

    result[0].permissionTitles = permissionTitles;


    return httpResponse(res, 200, "success", "User permissions results", result[0])
}

exports.testNotify = async (req, res, next) => {
    const {title, message, user} = req.body;
    const notifys = await notify({
        messages: {"en": message},
        template: "d4abd3d0-6ac7-4880-9f95-68b778624ff2",
        headings: {"en": title},
        userId: user
    });
    //console.log(await notifys)
    return httpResponse(res, 200, "success", "notification sent", null)
}

exports.updatePermissions = async (req, res, next) => {
    const {permission, userId, groupId, memberId} = req.body;

    //console.log(permission);
    //console.log(JSON.stringify(permission))

    if (permission && userId && groupId) {

        const checkCompany = await query(`SELECT companyId FROM groups WHERE id = ${groupId}`);
        const checkOwner = await query(`SELECT ownerId FROM companies WHERE id = ${checkCompany[0].companyId}`);
        console.log(checkOwner[0].ownerId)
        if(checkOwner[0].ownerId !== userId) {
            return httpResponse(res, 200, "error", "You don't have enough permission to do this.")
        }

        const checkCurrent = await query(`SELECT *
                                          FROM userPermissions
                                          WHERE userId = ?
                                          AND groupId = ?`, [memberId, groupId]);
        //console.log(checkCurrent.length)
        if (checkCurrent.length > 0) {
            const delOld = await User.prototype.deletePermission(checkCurrent[0].id);
            if (delOld.affectedRows > 0) {
                const insertNew = await User.prototype.insertPermission(memberId, JSON.stringify(permission), groupId)
                if (insertNew) {
                    return httpResponse(res, 200, "success", "User permissions has been updated", null)
                }
            } else {
                return httpResponse(res, 200, "error", "Update fail", delOld)
            }
        } else {
            const insertNew = await User.prototype.insertPermission(userId, JSON.stringify(permission), groupId)
            if (insertNew) {
                return httpResponse(res, 200, "success", "User permissions has been updated", null)
            } else {
                return httpResponse(res, 200, "error", "insert fail", null)
            }
        }
    }
}

exports.searchUserInvite = async (req, res, next) => {
    const {text} = req.body;

    const result = await User.prototype.searchUserInvite(text);

    return httpResponse(res, 200, "success", "Search results", result)
}

exports.getLocation = async (req, res, next) => {

    const {userId, lat, long, address} = req.body;

    if (lat && long) {


        const updateUser = await User.prototype.updateLoc(userId, `${JSON.stringify({
            lat: lat,
            long: long,
            address: address
        })}`);
        if (updateUser.affectedRows) {
            //console.log("User updated location " + userId)
            return httpResponse(res, 200, "success", "User location updated.")

        } else {
            return httpResponse(res, 200, "error", "Error, cant updated", updateUser.sqlMessage)
        }
    } else if (userId) {
        //sadece kendi companyleri olacak şekilde güncellenecek
        const getCompanies = await Company.prototype.findUserCompanies(userId)
        let userData = [];
        for(const comp of getCompanies) {
            const users = await Company.prototype.findWorkers(comp.companyId);

            for (let i = 0; i < users.length; i++) {
                const findUser = await User.prototype.getUserLoc(users[i].userId);
                findUser[0].companyId = comp.companyId
                userData = [...userData, findUser[0]];
                console.log(findUser[0])
            }


        }


        console.log("map location fetch req")
        return httpResponse(res, 200, "success", "Company Users", userData)
    }


}

exports.createForgot = async (req, res, next) => {
    try {


        const {email} = req.body;
        const checkEmail = await User.prototype.login(email);
        if (checkEmail.length === 1) {

            const find = await User.prototype.find({"email": email}, "mailTokens");

            if (find.length > 0) {
                httpResponse(res, 200, "error", "You already have a waiting recovery request. Please check your email.");
                return;
            }


            const token = md5(md5(Math.random(10000) + sha256(new Date().toString())));
            const addToken = await User.prototype.createResetLink(email, token);
            if (addToken.affectedRows > 0) {

                return httpResponse(res, 200, "success", "Check your email to recover your account.")
            } else {
                return httpResponse(res, 200, "error", "Something went wrong, please contact us.")
            }
        } else {
            return httpResponse(res, 200, "error", "Wrong E-Mail")
        }


    } catch (error) {
        console.log(error)
    }
}

exports.getUser = async (req, res, next) => {
    const {userId} = req.body;

    const user = await User.prototype.getUser(userId);

    httpResponse(res, 200, "success", user);

}
