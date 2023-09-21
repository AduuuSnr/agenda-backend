const query = require("../db/config");

class Group {

    constructor(groupName, groupDescription, banner, companyId) {
        this.groupName = groupName;
        this.groupDescription = groupDescription;
        this.banner = banner;
        this.companyId = companyId;
    }

    async save() {
        return await query(
            `INSERT INTO groups(groupName, groupDescription, banner, companyId)
             VALUES (?, ?, ?, ?)`,
            [this.groupName, this.groupDescription, this.banner, this.companyId]
        );
    }

    async addMember(userId, groupId) {
        return await query(
            `INSERT INTO groupUsers(userId, groupId)
             VALUES (?, ?)`,
            [userId, groupId]
        );
    }

    async findAll() {
        return await query(`SELECT *
                            FROM groups`);
    }

    async findWorkers(teamId) {
        return await query(`SELECT *
                            FROM groupUsers
                            WHERE groupId = ?`, [teamId]);
    }

    async findUserGroups(userId) {
        return await query(`SELECT *
                            FROM groupUsers
                            WHERE userId = ?`, [userId]);
    }

    async getGroups(id) {
        return await query(`SELECT *
                            FROM groups
                            WHERE companyId = ?`, [id]);
    }

    async getGroup(id, comp) {
        return await query(`SELECT *
                            FROM groups
                            WHERE id = ? AND companyId = ?`, [id, comp]);
    }

    async get(id) {
        return await query(`SELECT *
                            FROM groups
                            WHERE id = ?`, [id]);
    }

    async update(id, updatedField) {
        let placeholder = "";
        for (let i = 0; i < Object.keys(updatedField).length; i++) {
            placeholder += `${Object.keys(updatedField)[
                i
                ].toString()} = "${Object.values(updatedField)[i].toString()}" ${
                i !== Object.keys(updatedField).length - 1 ? ", " : ""
            } `;
        }

        return await query(`UPDATE groups
                            set ${placeholder}
                            WHERE id = ?`, [id]);
    }

    async findUserFromTeam(id) {
        return await query(`SELECT id, location, last_login, avatar, create_date, email, fullname
                            FROM users
                            WHERE id = ?`, [id]);
    }

    async deleteById(id) {
        return await query(`DELETE
                            FROM groups
                            WHERE id = ?`, [id]);
    }

    async deleteTeamMember(userId, groupId) {
        return await query(`DELETE
                            FROM groupUsers
                            WHERE userId = ? AND groupId = ?`, [userId, groupId]);
    }


}

module.exports = Group;
