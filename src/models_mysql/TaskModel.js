const query = require("../db/config");
class Task {
  constructor(taskName, startDate, endDate, groupId, description, address, banner) {
    this.taskName = taskName;
    this.startDate = startDate;
    this.endDate = endDate;
    this.groupId = groupId;
    this.description = description;
    this.address = address;
    this.banner = banner;
  }

  async save() {
    return await query(
      `INSERT INTO tasks(taskName,startDate,endDate,groupId,description,address,banner) VALUES(?,?,?,?,?,?,?)`,
      [
        this.taskName,
        this.startDate,
        this.endDate,
        this.groupId,
        this.description,
        this.address,
        this.banner
      ]
    );
  }

  async findAll() {
    return await query(`SELECT * FROM tasks`);
  }

  async getTask(id, date) {
    if(date) {
      return await query(`SELECT * FROM tasks WHERE id = ? AND startDate <= ? AND endDate >= ?`, [id, date.startDate, date.startDate]);
    } else {
      return await query(`SELECT * FROM tasks WHERE id = ?`, [id]);
    }

  }

  async deleteTaskUsers(taskId) {
    return await query(`DELETE FROM userTasks WHERE taskId = ?`, [taskId])
  }

  async deleteGroupTaskUsers(taskId) {
    return await query(`DELETE FROM groupTasks WHERE taskId = ?`, [taskId])
  }

  async deleteTaskGallery(taskId) {
    return await query(`DELETE FROM taskGallery WHERE taskId = ?`, [taskId])
  }

  async deleteTask(taskId) {
    return await query(`DELETE FROM tasks WHERE id = ?`, [taskId])
  }



  async getTaskByGroup(id) {
    return await query(`SELECT * FROM tasks WHERE groupId = ?`, [id]);
  }

  async search(querys, userId) {
    return await query(`SELECT * FROM tasks WHERE taskName LIKE '%${querys}%'`);
  }

  async insertUserTask(userId, taskId) {
    return await query(`INSERT INTO userTasks(taskId, userId) VALUES(?, ?)`, [taskId, userId]);
  }

  async insertGroupTask(groupId, taskId) {
    return await query(`INSERT INTO groupTasks(taskId, groupId) VALUES(?, ?)`, [taskId, groupId]);
  }

  async insertGalleryTask(image, taskId) {
    return await query(`INSERT INTO taskGallery(taskId, image) VALUES(?, ?)`, [taskId, image]);
  }

  async findUserTasks(id) {
    return await query(`SELECT * FROM userTasks WHERE userId = ?`, [id]);
  }

  async findUserGroups(id) {
    return await query(`SELECT * FROM groupUsers WHERE userId = ?`, [id])
  }

  async findTaskUsers(id) {
    return await query(`SELECT * FROM userTasks WHERE taskId = ?`, [id])
  }

  async findGroupTasks(id) {
    return await query(`SELECT * FROM groupTasks WHERE groupId = ?`, [id]);
  }

  async update(id, updatedField) {
    let placeholder = "";
    for (let i = 0; i < Object.keys(updatedField).length; i++) {
      const values = Object.values(updatedField)[i].toString();
      const keys = Object.keys(updatedField)[i].toString();

      placeholder += `${keys} = "` + values + `" ${ i !== Object.keys(updatedField).length - 1 ? ", " : ""} `;
    }

    return await query(`UPDATE tasks set ${placeholder} WHERE id =?`, [id]);
  }

  async deleteById(id) {
    return await query(`DELETE FROM tasks WHERE id = ?`, [id]);
  }
}

module.exports = Task;
