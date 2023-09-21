const query = require("../db/config");
const { dateFormatter } = require("../utils/helpers");

class Company {
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

  async findAll() {
    return await query(`SELECT * FROM companies WHERE status = 0`);
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

    return await query(`UPDATE companies set ${placeholder} WHERE id =?`, [id]);
  }

  async deleteById(id) {
    return await query(`DELETE FROM companies WHERE id = ?`, [id]);
  }

  async deleteWorker(userId, companyId) {
    return await query(`DELETE FROM companyUsers WHERE userId = ? AND companyId = ?`, [userId, companyId]);
  }

  async addCompanyUser(userId, companyId) {
    return await query(`INSERT INTO companyUsers(userId, companyId) VALUES(?, ?)`, [userId, companyId])
  }

  async getCompany(id) {
    return await query(`SELECT * FROM companies WHERE id = ? AND status = 0`, [id]);
  }

  async getCompanies(id) {
    return await query(`SELECT * FROM companies WHERE id = ? AND status = 0`, [id]);
  }

  async findUserFromCompany(id) {
    return await query(`SELECT id, location, last_login, avatar, create_date, email, fullname FROM users WHERE id = ?`, [id]);
  }

  async findWorkers(companyId) {
    return await query(`SELECT * FROM companyUsers WHERE companyId = ?`, [companyId]);
  }

  async findUserCompanies(userId) {
    return await query(`SELECT * FROM companyUsers WHERE userId = ?`, [userId]);
  }

}

module.exports = Company;
