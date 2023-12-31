const Router = require("express");
const router = new Router();
const userRouter = require("./userRouter");
const commentsRouter = require("./commentsRouter");
const drinksRouter = require("./drinksRouter");
const votingsRouter = require("./votingsRouter");
router.use("/user", userRouter);
router.use("/comments", commentsRouter);
router.use("/drinks", drinksRouter);
router.use("/votings", votingsRouter);
module.exports = router;
