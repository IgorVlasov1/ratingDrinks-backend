const ApiError = require("../error/ApiError");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const {
  User,
  Voting,
  Tags,
  Energy,
  EnergyUserSelected,
} = require("../models/models");
const { Op } = require("sequelize");
const Uuid = require("uuid");
const generateJwt = (id, role) => {
  return jwt.sign({ id, role }, process.env.SECRET_KEY, {
    expiresIn: "24h",
  });
};

class UserController {
  async registration(req, res, next) {
    const { login, password, email } = req.body;
    if (!email || !password || !login) {
      return next(ApiError.badRequest("Некорректно введенные данные"));
    }

    const candidate = await User.findOne({
      where: {
        [Op.or]: [{ email }, { login }],
      },
    });

    if (candidate) {
      return next(ApiError.badRequest("Пользователь уже существует"));
    }

    const hashPassword = await bcrypt.hash(password, 5);
    let user;
    if (login == "root") {
      user = await User.create({
        email,
        login,
        password: hashPassword,
        role: "ADMIN",
      });
    } else {
      user = await User.create({
        email,
        login,
        password: hashPassword,
      });
    }

    return res.json({ message: "Пользователь создан" });
  }

  async logIn(req, res, next) {
    const { login, password } = req.body;
    const user = await User.findOne({ where: { login } });
    if (!user) {
      return next(ApiError.internal("Пользователь не найден"));
    }
    let comparePassword = bcrypt.compareSync(password, user.password);
    if (!comparePassword) {
      return next(ApiError.internal("Пользователь не найден"));
    }
    const token = generateJwt(user.id, user.role);
    return res.json({
      token,
      message: "Вы вошли",
      user: {
        id: user.id,
        email: user.email,
        login: user.login,
        avatar: user.avatar,
        role: user.role,
      },
    });
  }
  async auth(req, res, next) {
    const user = await User.findOne({ where: { id: req.user.id } });
    if (!user) {
      return next(ApiError.badRequest("Ошибка авторизации"));
    }
    const token = generateJwt(req.user.id, req.user.role);
    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        login: user.login,
        avatar: user.avatar,
        role: user.role,
      },
    });
  }
  async uploadAvatar(req, res, next) {
    const file = req.files.file;
    const user = await User.findByPk(req.user.id);
    if (!file || !user) {
      return next(ApiError.badRequest("Ошибка загрузки автара"));
    }
    const avatarName = Uuid.v4() + ".jpg";
    file.mv(path.join(__dirname, `../static/usersAvatars/${avatarName}`));
    user.avatar = avatarName;
    await user.save();
    return res.json(user);
  }

  async deleteAvatar(req, res, next) {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return next(ApiError.badRequest("Ошибка удаления аватара"));
    }
    fs.unlinkSync(
      path.join(__dirname, `../static/usersAvatars/${user.dataValues.avatar}`)
    );
    user.avatar = null;
    await user.save();
    return res.json(user);
  }
  async createVoting(req, res, next) {
    const votingContent = JSON.parse(req.body.votingParams);
    const title = req.body.title;
    const dateEnd = req.body.dateEnd;
    if (!votingContent || !title || !dateEnd) {
      return next(ApiError.badRequest("Не все данные получены"));
    }
    let picture;
    let pictureName;
    const visibility = req.body.visibility;
    if (req.files) {
      picture = req.files.file;
      pictureName = Uuid.v4() + ".jpg";
      const pathPicture = path.join(
        __dirname,
        `../static/voteBackgrounds/${pictureName}`
      );
      picture.mv(pathPicture);
    }
    const voting = await Voting.create({
      title,
      votingContent,
      dateEnd,
      picture: pictureName,
      visibility,
    });
    return res.json({ voting, message: "Голосование создано" });
  }
  async createTag(req, res, next) {
    const { tagContent } = req.body;
    if (!tagContent) {
      return next(ApiError.badRequest("Ошибка создания тэга"));
    }
    const tag = await Tags.create({ tagContent });
    return res.json({ message: "Тэг добавлен" });
  }
  async getAllTags(req, res, next) {
    try {
      const tags = await Tags.findAll();
      return res.json(tags);
    } catch (e) {
      console.log(e);
    }
  }
  async getTopUsers(req, res, next) {
    try {
      const users = await User.findAll({
        limit: 3,
        order: [["totalVotes", "DESC"]],
      });
      const usersList = users.map((el) => ({
        login: el.login,
        totalVotes: el.totalVotes,
        avatar: el.avatar,
      }));
      return res.json(usersList);
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }

  async getAllDrinksForAdmin(req, res, next) {
    try {
      const drinks = await Energy.findAll();
      return res.json(drinks);
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }

  async addToSelected(req, res, next) {
    try {
      let item;
      item = await EnergyUserSelected.findOne({
        where: {
          drinkId: req.body.drinkId,
          ProfileId: req.body.profileId,
        },
      });
      if (item) {
        await item.destroy();
        return res.json({ message: "Удалено из избранных" });
      } else {
        const itemSelected = await EnergyUserSelected.create({
          content: req.body.text,
          picture: req.body.picture,
          drinkId: req.body.drinkId,
          ProfileId: req.body.profileId,
        });
        return res.json({ itemSelected, message: "Добавлено в избранные" });
      }
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }
  async getAllSelectedByUser(req, res, next) {
    try {
      const selectedItems = await EnergyUserSelected.findAll({
        where: {
          ProfileId: req.params.id,
        },
      });
      return res.json(selectedItems);
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }
  async deleteFromSelected(req, res, next) {
    try {
      const deleteItem = await EnergyUserSelected.findByPk(req.params.id);
      await deleteItem.destroy();
      return res.json({ message: "Удалено из избранных" });
    } catch (e) {
      next(ApiError.badRequest("Ошибка удаления из избранных"));
    }
  }
  async changeRole(req, res, next) {
    try {
      let userName = req.body.userName;
      let actionType = req.body.actionType;
      const user = await User.findOne({ where: { login: userName } });
      if (!actionType) {
        return next(ApiError.internal("Не выбран тип действия"));
      }
      if (!user) {
        return next(ApiError.internal("Пользователь не найден"));
      }
      if (user.role == "USER" && actionType == "addRole") {
        await user.update({
          role: "ADMIN",
        });
        return res.json({ message: "Пользователь повышен" });
      } else if (user.role == "ADMIN" && actionType == "deleteRole") {
        await user.update({
          role: "USER",
        });
        return res.json({ message: "Пользователь понижен" });
      } else {
        return res.json({ message: "Невозможно изменить роль" });
      }
    } catch (e) {
      console.log(e);
    }
  }
}

module.exports = new UserController();
