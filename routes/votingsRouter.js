const Router = require("express");
const router = new Router();
const controller = require("../controllers/votingsController");
const authMiddleware = require("../middleware/authMiddleware");
const checkRole = require("../middleware/checkRoleMiddleware");
router.get("", controller.getVotings);
router.post("/vote", authMiddleware, controller.setVote);
router.get("/singlevote/:voteid", controller.getListVotedUsers);
router.post(
  "/sendchatmessage",
  authMiddleware,
  controller.sendMessageInPublicChat
);
router.get("/publicchat", controller.getAllMessagesFromPublicChat);
router.post(
  "/manualchange",
  authMiddleware,
  checkRole("ADMIN"),
  controller.changeStatusVotingManually
);
router.delete(
  "/",
  authMiddleware,
  checkRole("ADMIN"),
  controller.deleteOneVoting
);
module.exports = router;
