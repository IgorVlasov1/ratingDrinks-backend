const { User, Voting, PublicChat } = require("../models/models");
const { Sequelize } = require("sequelize");
const ApiError = require("../error/ApiError");
class votingsController {
  async getVotings(req, res, next) {
    try {
      const { name } = req.query;
      let votings;
      let users;
      if (name == undefined) {
        votings = await Voting.findAll();
      }
      if (name != undefined) {
        votings = await Voting.findOne({ where: { title: name } });
      }

      if (votings.length > 1) {
        votings.forEach(async (vote) => {
          let date = new Date(vote.dateEnd);
          let diffInMinutes = Math.floor((date - new Date()) / 1000 / 60);
          if (diffInMinutes <= 0 && vote.status) {
            let voting = await Voting.findByPk(vote.id);
            await voting.update({
              status: false,
            });
          }
        });
      }
      return res.json(votings);
    } catch (e) {
      return next(ApiError.internal("Ошибка получения активных голосований"));
    }
  }
  async setVote(req, res, next) {
    try {
      const votingId = req.body.votingId;
      const candidateName = req.body.candidateName;
      const userId = req.body.userId;
      if (!votingId || !candidateName || !userId) {
        return next(ApiError.badRequest("Невозможно проголосовать"));
      }
      const user = await User.findByPk(userId);
      let userVotePlus = user.totalVotes + 1;
      await user.update({
        totalVotes: userVotePlus,
      });
      const voting = await Voting.findByPk(votingId);
      console.log("Это оно", voting.dataValues.usersWhoVote);
      if (voting.usersWhoVote.includes(userId)) {
        return res.json({ message: "Вы уже голосовали" });
      } else {
        voting.update({
          usersWhoVote: Sequelize.fn(
            "array_append",
            Sequelize.col("usersWhoVote"),
            userId
          ),
        });
        let votesPlus = voting.totalVotes + 1;
        let findedObj = voting.dataValues.votingContent.findIndex(
          (obj) => obj.name == candidateName
        );
        voting.votingContent[findedObj].votes =
          voting.votingContent[findedObj].votes + 1;
        voting.changed("votingContent", true);
        await voting.update({
          totalVotes: votesPlus,
        });
        voting.save();
        return res.json({ message: "Вы проголосовали" });
      }
    } catch (e) {
      return next(ApiError.badRequest(e.message));
    }
  }
  async getListVotedUsers(req, res, next) {
    try {
      let page = req.query.page;
      let limit = 12;
      let offset = page * limit - limit;
      if (req.params.voteid !== undefined) {
        const voting = await Voting.findByPk(req.params.voteid);
        const users = await User.findAll({
          where: {
            id: voting.usersWhoVote,
          },
          limit,
          offset,
        });
        const formattedUsers = users.map((el) => ({
          login: el.login,
          avatar: el.avatar,
        }));
        return res.json(formattedUsers);
      }
    } catch (e) {
      return next(ApiError.internal("Ошибка получения пользователей"));
    }
  }
  async getAllMessagesFromPublicChat(req, res, next) {
    try {
      const publicChat = await PublicChat.findAll();
      return res.json(publicChat);
    } catch (e) {
      return next(ApiError.internal("Ошибка получения сообщений"));
    }
  }
  async sendMessageInPublicChat(req, res, next) {
    try {
      const { name, avatar, message } = req.body;
      if (!name || !message) {
        return next(ApiError.badRequest("Ошибка отправки сообщения"));
      }
      let singleMessage;
      if (avatar) {
        singleMessage = await PublicChat.create({
          authorName: name,
          authorPicture: avatar,
          content: message,
        });
      } else {
        singleMessage = await PublicChat.create({
          authorName: name,
          content: message,
          authorPicture: "",
        });
      }
      console.log(singleMessage);
      return res.json(singleMessage);
    } catch (e) {
      console.log(e);
      // return next(ApiError.badRequest(e.message));
    }
  }
  async changeStatusVotingManually(req, res, next) {
    try {
      const singleVoting = await Voting.findByPk(req.body.voteId);
      await singleVoting.update({
        status: false,
      });
      return res.json({ message: "Голосование завершено" });
    } catch (e) {
      console.log(e);
      return next(ApiError.badRequest("Ошибка завершения голосования"));
    }
  }
  async deleteOneVoting(req, res) {
    try {
      const voting = await Voting.findByPk(req.query.id);
      voting.destroy();
      return res.json({ message: "Голосование удалено" });
    } catch (e) {
      return next(ApiError.internal(e.message));
    }
  }
}

module.exports = new votingsController();
