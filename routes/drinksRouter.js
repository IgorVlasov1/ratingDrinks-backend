const Router = require("express");
const router = new Router();
const controller = require("../controllers/drinkController");
const authMiddleware = require("../middleware/authMiddleware");
const checkRole = require("../middleware/checkRoleMiddleware");
router.post("/create", authMiddleware, controller.createDrinkCard);
router.post("/estimate/:id", authMiddleware, controller.setVote);
router.get("", controller.getAll);
router.get("/search", controller.searchDrink);
router.get("/:id", controller.getOne);
router.delete(
  "/",
  authMiddleware,
  checkRole("ADMIN"),
  controller.deleteOneDrink
);

module.exports = router;
