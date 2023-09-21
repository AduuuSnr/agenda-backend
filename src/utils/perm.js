const User = require("../models_mysql/UserModel");


const checkPerm = async (userId, groupId, permission) => {

    const checkPerm = await User.prototype.getPermission(userId, groupId);

    if (checkPerm.length === 0) {
        return false;
    }
    let permissions = JSON.parse(checkPerm[0].permission);
    for (let i = 0; i < Object.keys(permissions).length; i++) {
        if (Object.keys(permissions)[i] === permission) {
            return Object.values(permissions)[i]
        }
    }
}

module.exports = checkPerm;