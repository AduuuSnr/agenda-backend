const {httpResponse} = require("../utils/helpers");
const Task = require("../models_mysql/TaskModel");
const Group = require("../models_mysql/GroupModel");
const Company = require("../models_mysql/CompanyModel");
const User = require("../models_mysql/UserModel");
const query = require("../db/config");
const {log} = require("nodemon/lib/utils");
const notify = require("../utils/notify");
const checkPerm = require("../utils/perm");
const http = require("http");
const {add} = require("nodemon/lib/rules");

exports.createTask = async (req, res, next) => {
    const {
        taskName,
        startDate,
        endDate,
        groupId,
        description,
        address,
        users,
        type,
        gallery,
        banner,
        userId
    } = req.body;

    console.log("checcckinnn beggin")
    if (await checkPerm(userId, groupId, "allowCreateTask") === false) {
        return httpResponse(res, 200, "error", "You dont have permission to create task.")
    }


    try {
        let taskAdd = {};
        if (address) {
            taskAdd = {lat: address.lat, long: address.long, address: address.address};
        }


        const newTask = new Task(
            taskName,
            startDate,
            endDate,
            groupId,
            description,
            JSON.stringify(taskAdd),
            banner
        );

        if (!taskName) {
            return httpResponse(
                res,
                200,
                "error",
                "Please enter a valid Task Name"
            );
        } else if (!endDate || !startDate) {
            return httpResponse(
                res,
                200,
                "error",
                "Please enter Valid Start-End Dates"
            );
        } else if (!description) {
            return httpResponse(
                res,
                200,
                "error",
                "Please enter a valid Description"
            );
        } else if (!address) {
            return httpResponse(res, 200, "error", "Please enter a valid Address");
        } else if (!groupId) {
            return httpResponse(res, 200, "error", "Please select a valid group");
        } else if (!type) {
            return httpResponse(res, 200, "error", "Please select task type");
        } else if (!banner) {
            return httpResponse(res, 200, "error", "Please select banner image");
        } else if (type === "group" && !groupId) {
            return httpResponse(res, 200, "error", "Please select a group.")
        } else if (!groupId) {
            return httpResponse(res, 200, "error", "Cant detect the group.")
        }
        console.log(groupId)
        const response = await newTask.save();
        if (response.insertId) {
            const group = await Group.prototype.get(groupId);
            console.log(group)
            const comp = await Company.prototype.getCompany(group[0].companyId)
            console.log(comp)
            if (type === "personal") {
                for (let i = 0; i < users.length; i++) {
                    const addElements = await Task.prototype.insertUserTask(users[i].userId, response.insertId);
                    await notify({
                        messages: {"en": "You are assigned to " + taskName + " by " + comp[0].companyName},
                        template: "d4abd3d0-6ac7-4880-9f95-68b778624ff2",
                        headings: {"en": "A new task has assigned to you"},
                        userId: users[i].userId
                    })
                }
            } else {
                const addElements = await Task.prototype.insertGroupTask(groupId, response.insertId);
            }

            return httpResponse(res, 200, "success", "Task Successfully Created");

        } else {
            return httpResponse(res, 200, "error", response.message);
        }
    } catch (error) {
        console.log(error.toString())
        return httpResponse(res, 200, "error", error.toString());

    }
};

exports.getTask = async (req, res, next) => {
    const {taskId} = req.body;
    try {
        const response = await Task.prototype.getTask(taskId);
        if (response.length > 0) {
            for (let i = 0; i < response.length; i++) {

                let startDate = response[i].startDate
                    .toISOString()
                    .replace(/T/, ' ')
                    .replace(/\..+/, '');
                let endDate = response[i].endDate
                    .toISOString()
                    .replace(/T/, ' ')
                    .replace(/\..+/, '');
                let options = {month: 'long', day: 'numeric', hours: 'full'};

                startDate = new Date(startDate);
                endDate = new Date(endDate);
                response[i].times = {start: startDate, end: endDate}
            }
            return httpResponse(res, 200, "success", response);
        } else {
            return httpResponse(res, 200, "error", `No task found with id ${taskId}`);
        }

    } catch (error) {
        return httpResponse(res, 200, "error", error.toString());
    }
}

exports.getTaskByGroup = async (req, res, next) => {
    const {groupId} = req.body;
    try {
        const response = await Task.prototype.getTaskByGroup(groupId);
        if (response.length > 0) {
            for (let i = 0; i < response.length; i++) {

                let startDate = response[i].startDate
                    .toISOString()
                    .replace(/T/, ' ')
                    .replace(/\..+/, '');
                let endDate = response[i].endDate
                    .toISOString()
                    .replace(/T/, ' ')
                    .replace(/\..+/, '');
                let options = {month: 'long', day: 'numeric', hours: 'full'};

                startDate = new Date(startDate);
                endDate = new Date(endDate);
                const taskResponsibles = await Task.prototype.findTaskUsers(response[i].id);
                let taskUsers = [];
                for (let tu = 0; tu < taskResponsibles.length; tu++) {
                    const taskUser = await User.prototype.getUser(taskResponsibles[tu].userId)
                    taskUsers = [...taskUsers, taskUser[0]];
                }
                response[i].users = taskUsers;

                response[i].times = {start: startDate, end: endDate}


            }


            return httpResponse(res, 200, "success", response);
        } else {
            return httpResponse(res, 200, "error", `No task found with id ${groupId}`);
        }

    } catch (error) {
        return httpResponse(res, 200, "error", error);
    }
}

exports.getTaskByUser = async (req, res, next) => {
    const {userId} = req.body;
    try {
        const userTasks = await Task.prototype.findUserTasks(userId);
        const userGroups = await Task.prototype.findUserGroups(userId);
        let taskArr = [];
        for (let ug = 0; ug < userGroups.length; ug++) {
            const groupTasks = await Task.prototype.findGroupTasks(userGroups[ug].groupId)
            for (let i = 0; i < groupTasks.length; i++) {
                let taskG = await Task.prototype.getTask(groupTasks[i].taskId);
                //console.log(taskG)
                taskG[0].type = "group"
                const startDate = new Date(taskG[0].startDate);
                const endDate = new Date(taskG[0].endDate);

                taskG[0].times = {start: startDate, end: endDate}
                taskArr = [...taskArr, taskG[0]];

            }

        }


        for (let i = 0; i < userTasks.length; i++) {
            let task = await Task.prototype.getTask(userTasks[i].taskId);
            const taskResponsibles = await Task.prototype.findTaskUsers(task[0].id);
            let taskUsers = [];
            for (let tu = 0; tu < taskResponsibles.length; tu++) {
                const taskUser = await User.prototype.getUser(taskResponsibles[tu].userId)
                taskUsers = [...taskUsers, taskUser[0]];
            }
            task[0].users = taskUsers;
            task[0].type = "personal"
            const startDate = new Date(task[0].startDate);
            const endDate = new Date(task[0].endDate);

            task[0].times = {start: startDate, end: endDate}
            taskArr = [...taskArr, task[0]];
        }


        if (userTasks.length > 0) {
            return httpResponse(res, 200, "success", taskArr);
        } else {
            return httpResponse(res, 200, "error", `No task found with id ${userId}`);
        }

    } catch (error) {
        return httpResponse(res, 200, "error", error.toString());
    }
}

exports.searchTask = async (req, res, next) => {
    const {query, userId} = req.body;

    const userTasks = await Task.prototype.findUserTasks(userId);
    let taskArr = [];
    let abc = 0;
    for (let i = 0; i < userTasks.length; i++) {
        const task = await Task.prototype.getTask(userTasks[i].taskId);
        if (task.length !== 0) {
            taskArr = [...taskArr, task[0]];
            taskArr[abc].type = "personal";

            let startDate = taskArr[abc].startDate
                .toISOString()
                .replace(/T/, ' ')
                .replace(/\..+/, '');
            let endDate = taskArr[abc].endDate
                .toISOString()
                .replace(/T/, ' ')
                .replace(/\..+/, '');
            let options = {month: 'long', day: 'numeric', hours: 'full'};

            startDate = new Date(startDate);
            endDate = new Date(endDate);

            taskArr[abc].times = {start: startDate, end: endDate}

            delete taskArr[abc]["startDate"];
            delete taskArr[abc]["endDate"];
            abc++;

        }

    }
    taskArr = taskArr.filter(task => (task?.taskName.toLowerCase().includes(query.toLowerCase())))


    if (taskArr.length > 0) {
        return httpResponse(res, 200, "success", taskArr);
    } else {
        return httpResponse(res, 200, "error", "Nothing found");
    }

}

exports.deleteTask = async (req, res, next) => {

    const {taskId, userId} = req.body;
    const getTask = await query(`SELECT *
                                 FROM tasks
                                 WHERE id = ${taskId}`);
    if (await checkPerm(userId, getTask[0].taskId, "allowDeleteTask") === false) {
        return httpResponse(res, 200, "error", "You dont have permission to delete this task.")
    }

    const delTaskUsers = await Task.prototype.deleteTaskUsers(taskId)
    if (delTaskUsers.affectedRows > 0) {
        console.log("Task users deleted")
    }
    const delGroupTaskUsers = await Task.prototype.deleteGroupTaskUsers(taskId)
    if (delGroupTaskUsers.affectedRows > 0) {
        console.log("Task group users deleted")
    }
    const deleteGallery = await Task.prototype.deleteTaskGallery(taskId)
    if (deleteGallery.affectedRows > 0) {
        console.log("Task gallery deleted")
    }

    const deleteTask = await Task.prototype.deleteTask(taskId)
    if (deleteTask.affectedRows > 0) {
        console.log("Task deleted")
    }

    return httpResponse(res, 200, "success", "Task successfully deleted")

}

exports.getTaskByUserDate = async (req, res, next) => {
    const {userId, date} = req.body;


    // let actualDate = new Date(date.startDate);
    // let endOfDayDate = new Date(actualDate.getFullYear()
    //     , actualDate.getMonth()
    //     , actualDate.getDate()
    //     , actualDate.getHours());
    // date.endDate = date.startDate
    // date.startDate = endOfDayDate
    //     .toISOString()
    //     .replace(/T/, ' ')
    //     .replace(/\..+/, '');
    console.log(date.startDate)
    try {
        const userGroups = await Task.prototype.findUserGroups(userId);
        //console.log("aaa");
        let taskArr = [];
        let groupTaskArr = [];
        for (let ug = 0; ug < userGroups.length; ug++) {
            const groupTasks = await Task.prototype.findGroupTasks(userGroups[ug].groupId)
            //console.log(groupTasks)
            let abc = 0;
            for (let fgt = 0; fgt < groupTasks.length; fgt++) {

                let task = await Task.prototype.getTask(groupTasks[fgt].taskId, date);

                if (task.length === 1) {
                    groupTaskArr[abc] = task[0];
                    groupTaskArr[abc].type = "group";

                    let startDate = groupTaskArr[abc].startDate;
                    // .toISOString()
                    // .replace(/T/, ' ')
                    // .replace(/\..+/, '');
                    let endDate = groupTaskArr[abc].endDate;
                    // .toISOString()
                    // .replace(/T/, ' ')
                    // .replace(/\..+/, '');
                    let options = {month: 'long', day: 'numeric', hours: 'full'};

                    startDate = new Date(startDate);
                    // startDate = new Date(startDate).toLocaleDateString("en-US", options);
                    endDate = new Date(endDate);
                    // endDate = new Date(endDate).toLocaleDateString("en-US", options);

                    groupTaskArr[abc].times = {start: startDate, end: endDate}

                    delete groupTaskArr[abc]["startDate"];
                    delete groupTaskArr[abc]["endDate"];
                    abc++;
                }
            }
            //console.log(groupTaskArr)
        }

        const userTasks = await Task.prototype.findUserTasks(userId);


        let abc = 0;
        for (let i = 0; i < userTasks.length; i++) {
            let task = await Task.prototype.getTask(userTasks[i].taskId, date);

            if (task.length === 1) {

                taskArr[abc] = task[0];
                taskArr[abc].type = "personal";

                let startDate = taskArr[abc].startDate
                    .toISOString()
                    .replace(/T/, ' ')
                    .replace(/\..+/, '');
                let endDate = taskArr[abc].endDate
                    .toISOString()
                    .replace(/T/, ' ')
                    .replace(/\..+/, '');

                startDate = new Date(startDate);
                endDate = new Date(endDate);
                const taskResponsibles = await Task.prototype.findTaskUsers(taskArr[abc].id);
                let taskUsers = [];
                for (let tu = 0; tu < taskResponsibles.length; tu++) {
                    const taskUser = await User.prototype.getUser(taskResponsibles[tu].userId)
                    taskUsers = [...taskUsers, taskUser[0]];
                }
                taskArr[abc].users = taskUsers;
                taskArr[abc].times = {start: startDate, end: endDate}
                delete taskArr[abc]["startDate"];
                delete taskArr[abc]["endDate"];
                //console.log(taskArr)
                abc++;
            }
        }

        if (userTasks.length > 0 && taskArr.length > 0) {
            let response;
            if (groupTaskArr?.length !== 0 && groupTaskArr) {
                response = [taskArr, groupTaskArr];
            } else {
                response = [taskArr];
            }


            return httpResponse(res, 200, "success", response);
        } else {
            return httpResponse(res, 200, "error", []);
        }

    } catch (error) {
        return httpResponse(res, 200, "error", error.toString());
    }
}

exports.findAllTasks = async (req, res, next) => {
    try {
        const response = await Task.prototype.findAll();
        return httpResponse(res, 200, "success", response);
    } catch (error) {
        return httpResponse(res, 200, "error", error);
    }
};

exports.updateTasks = async (req, res, next) => {
    try {
        const {taskId, updateFields, users} = req.body;
        console.log(updateFields)

        let taskAdd = {};
        if (updateFields.address) {
            taskAdd = {lat: updateFields.address.lat, long: updateFields.address.long, address: updateFields.address.address};
        }

        const response = await query(`UPDATE tasks
                                      SET taskName = ?,
                                          startDate = ?,
                                          endDate = ?,
                                          groupId = ?,
                                          description = ?,
                                          address = ?,
                                          banner = ?
                                      WHERE id = ?`,
            [
                updateFields.taskName,
                updateFields.startDate,
                updateFields.endDate,
                updateFields.groupId,
                updateFields.description,
                JSON.stringify(taskAdd),
                updateFields.banner,
                taskId
            ]);


        //const response = await Task.prototype.update(taskId, updateFields);
        if (response.affectedRows) {

            const deleteUsersFromTask = await query(`DELETE
                                                     FROM userTasks
                                                     WHERE taskId = ${taskId}`)

            for (const user of users) {
                const addUser = await query(`INSERT INTO userTasks(taskId, userId)
                                             VALUES (?, ?)`, [taskId, user]);
            }
            const findTaskUsers = Task.prototype.findTaskUsers(taskId);
            for (let i = 0; i < findTaskUsers.length; i++) {
                const userId = findTaskUsers[i].userId;
                await notify({
                    messages: {"en": "Moderator of your group has updated your " + updateFields.taskName + " task."},
                    template: "d4abd3d0-6ac7-4880-9f95-68b778624ff2",
                    headings: {"en": "Your task has been updated"},
                    userId: userId
                });

            }

            return httpResponse(res, 200, "success", "Task successfully updated");
        } else {
            return httpResponse(res, 200, "error", response);
        }
    } catch (error) {
        return httpResponse(res, 200, "error", error.toString());
    }
};

exports.addComment = async (req, res, next) => {

    const {userId, taskId, comment, gallery, finish} = req.body;
    try {
        if (!userId) {
            return httpResponse(res, 200, "error", "Please send userId")
        } else if (!taskId) {
            return httpResponse(res, 200, "error", "Please send taskId")
        } else if (!comment) {
            return httpResponse(res, 200, "error", "Please send comment")
        } else if (!gallery) {
            return httpResponse(res, 200, "error", "Please send gallery")
        }



        const checkComment = await query(`SELECT *
                                      FROM taskComments
                                      WHERE taskId = ?
                                        AND userId = ?`, [taskId, userId]);
        if (checkComment.length > 0) {
            return httpResponse(res, 200, "error", "You have already 1 comment on this task!");
        }
        const addComment = await query(`INSERT INTO taskComments(taskId, userId, comment, finished, date)
                                    VALUES (?, ?, ?, ?, ?)`, [taskId, userId, comment, finish, new Date().toISOString()]);
        console.log(addComment)
        if (addComment.affectedRows > 0) {
            const insertId = addComment.insertId;

            for (let i = 0; i < gallery.length; i++) {
                const insertGallery = await query(`INSERT INTO taskGallery(image, commentId)
                                               VALUES (?, ?)`, [gallery[i], insertId]);
            }
            return httpResponse(res, 200, "success", "Your comment successfully added!");
        } else {
            return httpResponse(res, 200, "error", "Something wrong", addComment);
        }
    } catch (e) {
        return httpResponse(res, 200, "error", "Something wrong", e.toString());

    }

}

exports.getCommentTask = async (req, res, next) => {
    const {taskId} = req.body;

    const findTask = await query(`SELECT *
                                  FROM taskComments
                                  WHERE taskId = ?`, [taskId]);
    if (findTask.length > 0) {
        let taskGallery = [];
        for (let i = 0; i < findTask.length; i++) {
            const getUser = await User.prototype.getUser(findTask[i].userId);
            const getGallery = await query(`SELECT *
                                            FROM taskGallery
                                            WHERE commentId = ?`, [findTask[i].id])
            if (getGallery.length > 0) {
                taskGallery = [...taskGallery, getGallery[0]];
            }
            findTask[i].gallery = taskGallery;
            findTask[i].user = getUser;
        }
        return httpResponse(res, 200, "success", "", findTask);
    } else {
        return httpResponse(res, 200, "success", "This task does not have any comments yet.");
    }

}

exports.checkTasks = async (req, res, next) => {

    const today = new Date()
        .toISOString()
        .replace(/T/, ' ')
        .replace(/\..+/, '')

    const findAll = await Task.prototype.findAll();
    findAll.map(task => {
        if (today > task.endDate) {
            console.log("Task has overdued " + task.taskName)
        }
    })


    console.log(today)

}