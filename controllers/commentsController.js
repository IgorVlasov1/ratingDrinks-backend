const { Comments, User } = require("../models/models");
const ApiError = require("../error/ApiError");
const path = require("path");
const Uuid = require("uuid");
class CommentsController {
  async create(req, res, next) {
    try {
      let picturesString;
      let pictures;
      if (req?.files?.pictures !== undefined) {
        if (req?.files?.pictures.length > 1) {
          pictures = req.files?.pictures?.map((file) => {
            const newName = Uuid.v4() + ".jpg";
            file.mv(
              path.join(__dirname, `../static/imagesInComments/${newName}`)
            );
            return newName;
          });
          picturesString = pictures.join(",");
        } else {
          const newName = Uuid.v4() + ".jpg";
          req.files.pictures.mv(
            path.join(__dirname, `../static/imagesInComments/${newName}`)
          );
          picturesString = newName;
        }
      } else {
        picturesString = "";
      }
      let comment;
      const user = await User.findByPk(req.body.userId);
      if (user.avatar) {
        comment = await Comments.create({
          authorName: user.login,
          authorPicture: user.avatar,
          content: req.body.text,
          pictures: picturesString,
          ProfileId: user.id,
          DrinkId: req.body.drinkId,
        });
      } else {
        comment = await Comments.create({
          authorName: user.login,
          authorPicture: "",
          content: req.body.text,
          pictures: picturesString,
          ProfileId: user.id,
          DrinkId: req.body.drinkId,
        });
      }

      return res.json(comment);
    } catch (e) {
      // console.log(e);
      return next(ApiError.badRequest("Ошибка создания комментария"));
    }
  }
  async getAll(req, res, next) {
    try {
      let { id, limit, page } = req.params;
      let offset = page * limit - limit;
      let comments;
      console.log("Страница", page);
      if (limit == 3) {
        comments = await Comments.findAndCountAll({
          where: {
            DrinkId: id,
          },
          order: [["createdAt", "DESC"]],
          limit: 3,
          offset,
        });
      } else {
        offset = page * limit - limit;
        comments = await Comments.findAndCountAll({
          where: {
            DrinkId: id,
          },
          order: [["createdAt", "DESC"]],
          limit,
          offset,
        });
      }
      if (comments) {
        comments.rows.forEach((comment) => {
          comment.pictures = comment?.pictures?.split(",");
        });
      }
      return res.json(comments);
    } catch (e) {
      return next(ApiError.internal("Ошибка получения комментариев"));
    }
  }
  async deleteOne(req, res, next) {
    try {
      console.log(req.user, "Это пользователь");
      const comment = await Comments.findByPk(req.query.id);
      if (req.user.role == "ADMIN" || req.user.id == comment.ProfileId) {
        comment.destroy();
      } else {
        return next(ApiError.forbidden("Нет прав на удаление"));
      }
      return res.json({ message: "Комментарий удален" });
    } catch (e) {
      return next(ApiError.badRequest("Ошибка удаления комментария"));
    }
  }

  async setVote(req, res) {
    try {
      const { commentId, userId, rating } = req.body;

      const comment = await Comments.findByPk(commentId);
      let userVote = JSON.stringify({
        id: userId,
        vote: rating,
      });
      if (!comment.usersWhoVote || !Array.isArray(comment.usersWhoVote)) {
        comment.usersWhoVote = [];
      }
      let parsedArray = comment.usersWhoVote.map((item) => JSON.parse(item));
      let check = parsedArray.find((e) => e?.id === userId);
      if (rating === "like") {
        if (check !== undefined && check.vote === "like") {
          await comment.update({
            likeStat: comment.likeStat - 1,
            usersWhoVote: parsedArray.filter((el) => el.id !== userId),
          });
        } else if (check !== undefined && check.vote === "dislike") {
          await comment.update({
            likeStat: comment.likeStat + 2,
            usersWhoVote: parsedArray
              .filter((el) => el.id !== userId)
              .concat(userVote),
          });
        } else {
          await comment.update({
            likeStat: comment.likeStat + 1,
            usersWhoVote: parsedArray.concat(userVote),
          });
        }
      } else if (rating === "dislike") {
        if (check !== undefined && check.vote === "like") {
          await comment.update({
            likeStat: comment.likeStat - 2,
            usersWhoVote: parsedArray
              .filter((el) => el.id !== userId)
              .concat(userVote),
          });
        } else if (check !== undefined && check.vote === "dislike") {
          await comment.update({
            likeStat: comment.likeStat + 1,
            usersWhoVote: parsedArray.filter((el) => el.id !== userId),
          });
        } else {
          await comment.update({
            likeStat: comment.likeStat - 1,
            usersWhoVote: parsedArray.concat(userVote),
          });
        }
      }
      res.status(200).json({ success: true });
    } catch (e) {
      console.log(e);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }
}
module.exports = new CommentsController();
