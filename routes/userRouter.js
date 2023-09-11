const Router = require("express");
const router = new Router();
const controller = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const checkRole = require("../middleware/checkRoleMiddleware");
router.post("/registration", controller.registration);
router.post(
  "/admin/changerole",
  authMiddleware,
  checkRole("ADMIN"),
  controller.changeRole
);
router.post("/login", controller.logIn);
router.get("/auth", authMiddleware, controller.auth);
router.get("/topusers", controller.getTopUsers);
router.post("/avatar", authMiddleware, controller.uploadAvatar);
router.post("/admin/createvote", authMiddleware, controller.createVoting);
router.delete("/avatar", authMiddleware, controller.deleteAvatar);
router.post("/admin/createtag", authMiddleware, controller.createTag);
router.get("/tags", controller.getAllTags);
router.get("/admindrinks", authMiddleware, controller.getAllDrinksForAdmin);
router.post("/selected", authMiddleware, controller.addToSelected);
router.delete(
  "/selected/delete/:id",
  authMiddleware,
  controller.deleteFromSelected
);
router.get("/selected/:id", controller.getAllSelectedByUser);
module.exports = router;
