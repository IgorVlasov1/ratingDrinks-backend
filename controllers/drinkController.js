const {
  Energy,
  Comments,
  DrinkInfo,
  Tags,
  TagBrand,
} = require("../models/models");
const ApiError = require("../error/ApiError");
const { Op, Sequelize } = require("sequelize");
const sequelize = require("../config/db.config");
const path = require("path");
const Uuid = require("uuid");
class drinksController {
  async createDrinkCard(req, res, next) {
    try {
      const { title, description, price } = JSON.parse(req.body.params);

      if (!title || !description || !price) {
        return next(ApiError.badRequest("Получены неккоректные данные"));
      }
      const tagContentArray = JSON.parse(req.body.tagContentArray);
      const picture = req.files.file;
      const pictureName = Uuid.v4() + ".jpg";
      const pathPicture = path.join(
        __dirname,
        `../static/cardImages/${pictureName}`
      );
      let newTagContent = tagContentArray.map((obj) => ({
        tagContent: obj.label,
      }));
      picture.mv(pathPicture);
      const drinkData = {
        title,
        description,
        price,
        picture: pictureName,
      };
      sequelize.transaction(async (t) => {
        const product = await Energy.create(drinkData, { transaction: t });
        const tags = await Promise.all(
          newTagContent.map(async (tagData) => {
            const [tag] = await Tags.findOrCreate({
              where: tagData,
              transaction: t,
            });

            await TagBrand.create(
              {
                DrinkId: product.id,
                DrinkTagId: tag.id,
              },
              { transaction: t }
            );

            return tag;
          })
        );
        const otherInfo = JSON.parse(req.body.otherInfo);
        otherInfo.forEach((element) =>
          DrinkInfo.create({
            name: element.name,
            content: element.content,
            DrinkId: product.id,
          })
        );
        product.tags = tags;
        return res.json({ product, message: "Напиток добавлен" });
      });
    } catch (e) {
      return next(ApiError.badRequest("Ошибка создания карточки"));
    }
  }
  async getAll(req, res, next) {
    try {
      let page = req.query.page;
      let limit = req.query.limit;
      let offset = page * limit - limit;
      let drinks;
      if (req.query.search && !req.query.tags) {
        drinks = await Energy.findAndCountAll({ limit, offset });
        const searchName = req.query.search;
        drinks.rows = drinks.rows.filter((drink) =>
          drink.title.toLowerCase().includes(searchName.toLowerCase())
        );
      }
      if (req.query.tags && req.query.search == undefined) {
        let listOfTags = req.query.tags;
        listOfTags = listOfTags.split(",");

        if (listOfTags.length > 1) {
          drinks = await Energy.findAndCountAll({
            include: [
              {
                model: Tags,
                where: { tagContent: { [Op.in]: listOfTags } },
              },
            ],
            distinct: true,
            where: {
              [Op.and]: listOfTags.map((tagName) => ({
                "$DrinkTags.tagContent$": `${tagName}`,
              })),
            },
            limit,
            offset,
          });
        } else {
          drinks = await Energy.findAndCountAll({
            include: [
              {
                model: Tags,
                where: { tagContent: { [Op.eq]: listOfTags[0] } },
              },
            ],
            limit,
            offset,
          });
        }
      }
      if (req.query.tags && req.query.search) {
        const searchName = req.query.search;
        let listOfTags = req.query.tags;

        listOfTags = listOfTags.split(",");

        drinks = await Energy.findAndCountAll({
          include: [
            {
              model: Tags,
              where: { tagContent: { [Op.in]: listOfTags } },
            },
          ],
          distinct: true,
          where: {
            [Op.and]: listOfTags.map((tagName) => ({
              "$DrinkTags.tagContent$": tagName,
            })),
          },
          limit,
          offset,
          subQuery: false,
        });
        drinks.rows = drinks.rows.filter((drink) =>
          drink.title.toLowerCase().includes(searchName.toLowerCase())
        );
      }
      if (!req.query.tags && req.query.search == undefined) {
        drinks = await Energy.findAndCountAll({ limit, offset });
      }
      return res.json(drinks);
    } catch (e) {
      return next(ApiError.internal("Ошибка получения карточек"));
    }
  }

  async getOne(req, res, next) {
    try {
      const { id } = req.params;
      const drink = await Energy.findOne({
        where: {
          id,
        },
        include: [{ model: DrinkInfo, as: "info" }, Tags],
      });

      return res.json(drink);
    } catch (e) {
      return next(ApiError.internal("Информация не найдена"));
    }
  }
  async setVote(req, res, next) {
    try {
      const { id } = req.params;

      const userId = req.body.userId;
      const vote = Number(req.body.vote);

      const drink = await Energy.findByPk(id);
      if (drink.usersWhoVote.includes(userId)) {
        return res.json({ message: "Вы уже оценивали!" });
      } else {
        drink.update({
          usersWhoVote: Sequelize.fn(
            "array_append",
            Sequelize.col("usersWhoVote"),
            userId
          ),
        });
        let totalVotes = drink.totalVotes + 1;
        let sumOfVotes = drink.sumOfVotes + vote;

        await drink.update({ totalVotes, sumOfVotes });
        return res.json({ message: "Вы оценили!" });
      }
    } catch (e) {
      return next(ApiError.badRequest("Ошибка оценивания"));
    }
  }
  async searchDrink(req, res, next) {
    try {
      const searchName = req.query.search;
      let drinks = await Energy.findAll();
      drinks = drinks.filter((drink) =>
        drink.title.toLowerCase().includes(searchName.toLowerCase())
      );
      return res.json(drinks);
    } catch (e) {
      return next(ApiError.internal("Ошибка поиска"));
    }
  }
  async deleteOneDrink(req, res, next) {
    try {
      const drink = await Energy.destroy({
        where: {
          id: req.query.id,
        },
      });
      const comments = await Comments.destroy({
        where: {
          DrinkId: req.query.id,
        },
      });
      return res.json({ message: "Карточка удалена" });
    } catch (e) {
      return next(ApiError.badRequest("Ошибка удаления"));
    }
  }
}
module.exports = new drinksController();
