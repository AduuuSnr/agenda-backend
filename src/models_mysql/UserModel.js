const query = require("../db/config");

const { dateFormatter } = require("../utils/helpers");

class User {
  constructor(fullName, email, password, location, last_login, avatar, userId) {
    this.fullName = fullName;
    this.email = email;
    this.password = password;
    this.location = location;
    this.last_login = last_login;
    this.avatar = avatar;
    this.create_date = dateFormatter(new Date());
    this.userId = userId;
  }

  async save() {
    return await query(
      `INSERT INTO users(create_date, fullName, email, password, avatar, location, last_login, userId)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        this.create_date,
        this.fullName,
        this.email,
        this.password,
        this.avatar,
        this.location,
        this.last_login,
        this.userId,
      ]
    );
  }

  async findAll() {
    return await query(`SELECT * FROM users`);
  }

  async getUser(userId) {
    return await query(`SELECT * FROM users WHERE id = ?`,[userId]);
  }

  async searchUser(text) {
    text = `%` + text + `%`;
    return await query(`SELECT id, userId, fullname, avatar FROM users WHERE fullname LIKE ? OR userId LIKE ?`,[text, text]);
  }

  async getPermission(userId, groupId) {
    return await query(`SELECT * FROM userPermissions WHERE userId = ? AND groupId = ?`, [userId, groupId]);
  }

  async searchUserInvite(text) {
    text = `%` + text + `%`;
    return await query(`SELECT id, userId, fullname, avatar FROM users WHERE fullname LIKE ? OR userId LIKE ? LIMIT 2`,[text, text]);
  }

  async insertPermission(userId, permission, groupId) {
    return await query(`INSERT INTO userPermissions(userId, permission, groupId) VALUES(?, ?, ?)`, [userId, permission, groupId]);
  }

  async deletePermission(permId) {
    return await query(`DELETE FROM userPermissions WHERE id = ?`, [permId]);
  }

  async getPermissionTitles(key) {
    return await query(`SELECT * FROM permissions WHERE permissionKey = ?`, [key])
  }

  async getUserLoc(userId) {
    return await query(`SELECT id, userId, fullname, connectyId, avatar, location FROM users WHERE id = ?`,[userId]);
  }

  async login(email) {
    return await query(`SELECT * FROM users WHERE email = ?`,[email]
    );
  }

  // noinspection SpellCheckingInspection
  async loginp(email, password) {
      return await query(`SELECT * FROM users WHERE email = ? AND password = ?`, [email, password])
  }
  // noinspection
  async update(id, updatedField) {

    let placeholder = "";
    for (let i = 0; i < Object.keys(updatedField).length; i++) {
      placeholder += `${Object.keys(updatedField)[
        i
      ].toString()} = "${Object.values(updatedField)[i].toString()}" ${
        i !== Object.keys(updatedField).length - 1 ? ", " : ""
      } `;
    }

    return await query(`UPDATE users set ${placeholder} WHERE id =?`, [id]);
  }

  async updateLoc(userId, location) {
    return await query(`UPDATE users set location = ? WHERE id =?`, [location,userId]);
  }

  async createResetLink (email, token) {
    return await query(`INSERT INTO mailTokens(token, email) VALUES(?, ?)`, [token, email])
  }

  async find(params, table) {
    let placeholder = "";
    for (let i = 0; i < Object.keys(params).length; i++) {
      placeholder += `${Object.keys(params)[
          i
          ].toString()} = "${Object.values(params)[i].toString()}" ${
          i !== Object.keys(params).length - 1 ? "AND " : ""
      } `;
    }
    return await query(`SELECT * FROM ${table} WHERE ${placeholder}`)

  }

  async deleteById(id) {
    return await query(`DELETE FROM users WHERE id = ?`, [id]);
  }

  async deleteAll() {
    return await query(`TRUNCATE users`);
  }
}

module.exports = User;
