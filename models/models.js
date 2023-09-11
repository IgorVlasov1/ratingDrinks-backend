const sequelize = require("../config/db.config");
const { DataTypes } = require("sequelize");
const User = sequelize.define("Profiles", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: { type: DataTypes.STRING, unique: true },
  login: { type: DataTypes.STRING, unique: true },
  password: { type: DataTypes.STRING },
  role: { type: DataTypes.STRING, defaultValue: "USER" },
  avatar: { type: DataTypes.STRING, defaultValue: "" },
  comments: { type: DataTypes.ARRAY(DataTypes.STRING) },
  totalVotes: { type: DataTypes.INTEGER, defaultValue: 0 },
  selectedCards: { type: DataTypes.TEXT, defaultValue: "" },
});

const Energy = sequelize.define("Drinks", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  price: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  picture: {
    type: DataTypes.STRING,
    defaultValue: "",
  },
  usersWhoVote: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },

  totalVotes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  sumOfVotes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
});

const Comments = sequelize.define("Commentaries", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  authorName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  authorPicture: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  dateOpen: {
    type: DataTypes.DATE,
    defaultValue: Date.now(),
  },
  content: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  likeStat: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  usersWhoVote: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  pictures: {
    type: DataTypes.TEXT, // или DataTypes.STRING
    defaultValue: "",
  },
});

const DrinkInfo = sequelize.define("DrinkOtherInfo", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    defaultValue: "",
  },
  content: {
    type: DataTypes.STRING,
    defaultValue: "",
  },
});

const Voting = sequelize.define("Votings", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  votingContent: {
    type: DataTypes.JSONB,
    allowNull: false,
  },
  status: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  totalVotes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  picture: {
    type: DataTypes.STRING,
    defaultValue: "",
  },
  visibility: {
    type: DataTypes.STRING,
    defaultValue: "",
  },
  dateEnd: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  usersWhoVote: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
});

const Tags = sequelize.define("DrinkTags", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tagContent: {
    type: DataTypes.STRING,
    defaultValue: "",
    unique: true,
  },
});

const PublicChat = sequelize.define("PublicChat", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  authorName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  authorPicture: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  dateOpen: {
    type: DataTypes.DATE,
    defaultValue: Date.now(),
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
});

const EnergyUserSelected = sequelize.define("EnergyUserSelected", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  picture: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  drinkId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

Energy.hasMany(DrinkInfo, { as: "info" });
DrinkInfo.belongsTo(Energy);

const TagBrand = sequelize.define("energy_tag", {});
User.hasMany(EnergyUserSelected);
EnergyUserSelected.belongsTo(User);
Energy.belongsToMany(Tags, { through: "energy_tag" });
Tags.belongsToMany(Energy, { through: "energy_tag" });

User.hasMany(Comments);
Comments.belongsTo(User);
Energy.hasMany(Comments);
Comments.belongsTo(Energy);

module.exports = {
  User,
  Energy,
  Comments,
  Voting,
  DrinkInfo,
  Tags,
  TagBrand,
  PublicChat,
  EnergyUserSelected,
};
