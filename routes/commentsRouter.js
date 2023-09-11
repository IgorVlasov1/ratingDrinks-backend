const Router = require("express");
const router = new Router();
const controller = require("../controllers/commentsController");
const authMiddleware = require("../middleware/authMiddleware");
router.post("/create", authMiddleware, controller.create);
router.get("/:id&:limit&:page", controller.getAll);
router.delete("/", authMiddleware, controller.deleteOne);
router.post("/estimate", authMiddleware, controller.setVote);
module.exports = router;
