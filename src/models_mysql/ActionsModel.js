const query = require("../db/config");
const { dateFormatter } = require("../utils/helpers");

class Actions {
  constructor(companyName, companyDescription, banner, ownerId) {
    this.companyName = companyName;
    this.companyDescription = companyDescription;
    this.banner = banner;
    this.ownerId = ownerId;
  }

  async save() {
    return await query(
      `INSERT INTO companies(companyName,companyDescription,banner,createDate, ownerId) VALUES(?,?,?,?, ?)`,
      [
        this.companyName,
        this.companyDescription,
        this.banner,
        dateFormatter(new Date()),
        this.ownerId,
      ]
    );
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

    return await query(`UPDATE actions set ${placeholder} WHERE id =?`, [id]);
  }

  async deleteById(id) {
    return await query(`DELETE FROM actions WHERE id = ?`, [id]);
  }

  async find(params, table) {
    let placeholder = "";
    for (let i = 0; i < Object.keys(params).length; i++) {
      placeholder += `${Object.keys(params)[
          i
          ].toString()} = "${Object.values(params)[i].toString()}" ${
          i !== Object.keys(params).length - 1 ? ", " : ""
      } `;
    }
    return await query(`SELECT * FROM ${table} WHERE ${placeholder}`)

  }

  async insert(params) {
    return await query(`INSERT INTO notifications(content, userId, actionId, date) VALUES(?, ? ,? , ?)`, [params.content, params.userId, params.actionId, params.date])
  }

  async get(token) {
    return await query(`SELECT * FROM actions WHERE token = ?`, [token]);
  }

  async createInviteCompany(token, action) {
    return await query(`INSERT INTO actions(token, action) VALUES(?, ?)`, [token, action]);
  }


}

module.exports = Actions;
