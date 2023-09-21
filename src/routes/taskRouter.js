const express = require("express");
const {
    createTask,
    findAllTasks,
    updateTasks,
    getTask,
    getTaskByGroup,
    getTaskByUser,
    getTaskByUserDate,
    searchTask,
    deleteTask,
    addComment,
    getCommentTask,
    checkTasks
} = require("../controllers/taskController");
const router = express.Router();

router.route("/").post(createTask).get(findAllTasks);
router.route("/update").post(updateTasks);
router.route("/getTask").post(getTask);
router.route("/getTaskByGroup").post(getTaskByGroup);
router.route("/getTaskByUser").post(getTaskByUser);
router.route("/getTaskByUserDate").post(getTaskByUserDate);
router.route("/search").post(searchTask);
router.route("/deleteTask").post(deleteTask);
router.route("/addComment").post(addComment);
router.route("/getCommentTask").post(getCommentTask);
router.route("/checkTasks").get(checkTasks);

module.exports = router;
