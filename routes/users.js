var express = require("express");
var router = express.Router();
const User = require("../models/user");
var jwt = require("jsonwebtoken");
const passport = require("passport");

/*POST /api/v1.0/users/signup */
router.post("/signup", async function (req, res, next) {
  const user = new User(req.body);
  try {
    await user.save();
    res.status(201).send("Created");
  } catch (err) {
    res.status(400).send(err.message);
    next();
  }
});

/*POST /api/v1.0/users/login */
router.post("/login", async function (req, res, next) {
  const user = await User.findOne({ email: req.body.email });
  if (user === null) {
    return res
      .status(401)
      .send({ message: "The user does not exist in the system" });
  } else {
    const valid = await user.checkPassword(req.body.password);
    if (valid) {
      const accessToken = jwt.sign(
        { id: user._id },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "7d" }
      );
      let respo = {
        token: accessToken,
        email: user.email,
        username: user.username,
        phone: user.phone,
      };
      return res.status(200).send(respo);
    } else {
      return res.status(401).send("invalid password");
    }
  }
});

/*DELETE /api/v1.0/users/:email */
router.delete("/:email", function (req, res, next) {
  User.findOneAndRemove({ email: req.params.email })
    .exec()
    .then((doc) => {
      if (!doc) {
        return res.status(404).end();
      }
      return res.status(204).end();
    })
    .catch((err) => next(err));
});

/*GET /api/v1.0/users */
router.get("/", function (req, res, next) {
  User.find({}, function (err, users) {
    if (err) {
      return res.status(400).send(err.message);
    } else {
      return res.status(200).send(users);
    }
  });
});

/*For Debug only! */
/*POST /api/v1.0/users/newNotification */
router.post(
  "/newNotification",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    try {
      let user = await User.findOne({ _id: req.user._id });
      user.notifications.push(
        new Object({
          dogInfo: req.body.dogInfo,
          title: req.body.title,
          body: req.body.body,
          date: Date.now(),
        })
      );
      await user.save();
      res.status(201).send("message created");
    } catch (err) {
      res.status(400).send(err.message);
    }
  }
);

/*GET /api/v1.0/users/notification/:index*/
router.get(
  "/notification/:index",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    try {
      let user = await User.findOne({ _id: req.user._id });
      let index = req.params.index;
      let notifications = user.notifications;
      let notificationRes = notifications.slice(10 * index, 10 * index + 9);
      res.status(200).send(notificationRes);
    } catch (err) {
      res.status(400).send(err.message);
    }
  }
);

/*POST /api/v1.0/users/notification/:notificationID */
router.post(
  "/notification/:notifiationID",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    try {
      let user = await User.findOne({ _id: req.user._id });
      let notiIndex = user.notifications.findIndex(
        (x) => x._id == req.params.notifiationID
      );
      user.notifications[notiIndex].isAlreadyBeenRead = true;
      await user.save();
      res.status(200).send(user.notifications[notiIndex]);
    } catch (err) {
      res.status(400).send(err.message);
    }
  }
);

module.exports = router;
