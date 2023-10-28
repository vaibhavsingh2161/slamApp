//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const _ = require("lodash");
const https = require("https");

const app = express();

app.use(express.static(__dirname + "/views"));
app.use(express.json());

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

const date = new Date();

const options = {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
};

const currentDate = date.toLocaleString("en-IN", options);

app.use(
  session({
    secret: "this is secret sentence ",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());


const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI);


const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  userType: String,
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// REGISTER PAGE
let temperature = "";
let iconURL = "";
 
app.get("/initialRegister", function (req, res) {
  const query = "dharwad";
  const unit = "metric";
  const apiKey = "f8ca78219d0be062168d0e862b2c18c3";

  const url =
    "https://api.openweathermap.org/data/2.5/weather?q=" +
    query +
    "&units=" +
    unit +
    "&appid=" +
    apiKey;

  https.get(url, function (response) {
    response.on("data", function (data) {
      const weatherData = JSON.parse(data);

      temperature = weatherData.main.temp;
      const desc = weatherData.weather[0].description;
      const icon = weatherData.weather[0].icon;

      iconURL = "https://openweathermap.org/img/wn/" + icon + "@2x.png";
    });
  });
  res.render("initialRegister", {
    temperature: temperature,
    iconURL: iconURL,
    currentDate: currentDate,
  });
});

//REGISTRATION PAGE

app.get("/register", function (req, res) {
  res.render("register");
});

app.post("/register", function (req, res) {
  User.register(
    { username: req.body.username, userType: req.body.type },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/login");
        });
      }
    }
  );
});

// SIGNIN PAGE
app.get("/login", function (req, res) {
  res.render("login");
});
app

app.post("/login", function (req, res) {
  User.findOne({ username: req.body.username })
    .then(function (user) {
      if (user) {
        passport.authenticate("local", function (err, user, info) {
          if (err) {
            console.log(err);
          } else if (!user) {
            res.send(
              '<script>alert("Invalid username or password.Please try again.");window.location.href="/login";</script>'
            );
          } else {
            req.login(user, function (err) {
              if (err) {
                console.log(err);
              } else {
                if (user.userType === "productOwner") {
                  console.log(user.userType);
                  res.redirect("/productOwner");
                } else if (user.userType === "developer") {
                  console.log(user.userType);
                  res.redirect("/chooseproject1");
                } else if (user.userType === "Scrum-Master") {
                  console.log(user.userType);
                  res.redirect("/chooseproject");
                } else {
                  console.log("error");
                  res.redirect("/login");
                }
              }
            });
          }
        })(req, res);
      } else {
        console.log("User not found");
        res.redirect("/login");
      }
    })
    .catch(function (err) {
      console.log(err);
      res.redirect("/login");
    });
});

app.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      console.log(err);
    }
    res.redirect("/login");
  });
});

const backlogSchema = new mongoose.Schema({
  name: String,
});

const newBacklog = mongoose.model("newBacklog", backlogSchema);

const sprintSchema1 = new mongoose.Schema({
  name: String,
  status: String,
  scrumboard: String,
});

const newSprintBacklog1 = mongoose.model("newSprintBacklog1", sprintSchema1);

const sprintSchema2 = new mongoose.Schema({
  name: String,
  status: String,
  scrumboard: String,
});

const newSprintBacklog2 = mongoose.model("newSprintBacklog2", sprintSchema2);

const projectSchema = new mongoose.Schema({
  name: String,
});

const project = mongoose.model("project", sprintSchema2);

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const listSchema = {
  name: String,
  items: [backlogSchema],
};

const List = mongoose.model("List", listSchema);

// PRODUCT BACKLOG

app.get("/productbacklog", function (req, res) {
  newBacklog.find().then(function (foundItems) {
    res.render("productBacklog", {
      listTitle: "Product Backlog",
      newListItems: foundItems,
    });
  });
});

app.post("/productbacklog", function (req, res) {
  const itemName = req.body.newEntry;
  const listName = req.body.list;

  const item = new newBacklog({
    name: itemName,
  });

  item.save();

  res.redirect("/productbacklog");
});

// DELETE

app.post("/delete", function (req, res) {
  const checkedId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Product Backlog") {
    newBacklog
      .findByIdAndRemove(checkedId)
      .then(function () {
        console.log("data removed");
      })
      .catch(function (error) {
        console.log(error);
      });
    res.redirect("/productbacklog");
  } else {
    List.findOneAndUpdate(
      {
        name: listName,
      },
      {
        $pull: { items: { _id: checkedId } },
      }
    )
      .then(function (foundList) {
        res.redirect("/productbacklog" + listName);
      })
      .catch(function (error) {
        console.log(error);
      });
  }
});

// PRODUCT OWNER

app.get("/productowner", async function (req, res) {
  try {
    const projectData = await project.find().exec();

    const query = "dharwad";
    const unit = "metric";
    const apiKey = "f8ca78219d0be062168d0e862b2c18c3";

    const url =
      "https://api.openweathermap.org/data/2.5/weather?q=" +
      query +
      "&units=" +
      unit +
      "&appid=" +
      apiKey;

    https.get(url, function (response) {
      response.on("data", function (data) {
        const weatherData = JSON.parse(data);
        temperature = weatherData.main.temp;
        const desc = weatherData.weather[0].description;
        const icon = weatherData.weather[0].icon;
        iconURL = "https://openweathermap.org/img/wn/" + icon + "@2x.png";
      });
    });

    res.render("productOwner.ejs", {
      projectItems: projectData,
      temperature: temperature,
      iconURL: iconURL,
      currentDate: currentDate,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/productowner", function (req, res) {
  const projectName = req.body.newProject;

  const project1 = new project({
    name: projectName,
  });

  project1.save();
  res.redirect("/productowner");
});

app.post("/deleteproject", function (req, res) {
  const projectId = req.body.checkbox3;
  const projectName1 = req.body.projectName;

  if (projectName1 === "project") {
    project
      .findByIdAndRemove(projectId)
      .then(function () {
        console.log("data removed");
      })
      .catch(function (error) {
        console.log(error);
      });
    res.redirect("/productowner");
  } else {
    List.findOneAndUpdate(
      {
        name: projectName1,
      },
      {
        $pull: { items: { _id: projectId } },
      }
    )
      .then(function (foundList) {
        res.redirect("/productowner");
      })
      .catch(function (error) {
        console.log(error);
      });
  }
});

// CREATE SPRINT

app.get("/createsprint", async function (req, res) {
  try {
    const data1 = await newBacklog.find().exec();

    const data2 = await newSprintBacklog1.find().exec();

    const data3 = await newSprintBacklog2.find().exec();

    res.render("createSprint.ejs", {
      newListItems: data1,
      sprintItems1: data2,
      sprintItems2: data3,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/createsprint1", async function (req, res) {
  try {
    const data1 = await newBacklog.find().exec();

    const data2 = await newSprintBacklog1.find().exec();

    const data3 = await newSprintBacklog2.find().exec();

    res.render("createSprint1.ejs", {
      newListItems: data1,
      sprintItems1: data2,
      sprintItems2: data3,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/createsprint1", function (req, res) {
  const itemName1 = req.body.newEntry1;

  const item1 = new newSprintBacklog1({
    name: itemName1,
    status: "todo-list",
    scrumboard: "scrumboard1",
  });

  item1.save();

  res.redirect("/createsprint");
});

app.post("/createsprint2", function (req, res) {
  const itemName2 = req.body.newEntry2;

  const item2 = new newSprintBacklog2({
    name: itemName2,
    status: "todo-list",
    scrumboard: "scrumboard2",
  });
  item2.save();

  res.redirect("/createsprint");
});

app.post("/deletesprint1", function (req, res) {
  const checkedId1 = req.body.checkbox1;
  const listName1 = req.body.listName1;

  if (listName1 === "Sprint Backlog") {
    newSprintBacklog1
      .findByIdAndRemove(checkedId1)
      .then(function () {
        console.log("data removed");
      })
      .catch(function (error) {
        console.log(error);
      });
    res.redirect("/createsprint");
  } else {
    List.findOneAndUpdate(
      {
        name: listName1,
      },
      {
        $pull: { items: { _id: checkedId1 } },
      }
    )
      .then(function (foundList) {
        res.redirect("/createsprint" + listName1);
      })
      .catch(function (error) {
        console.log(error);
      });
  }
});

app.post("/deletesprint2", function (req, res) {
  const checkedId2 = req.body.checkbox2;
  const listName2 = req.body.listName2;

  if (listName2 === "Sprint Backlog") {
    newSprintBacklog2
      .findByIdAndRemove(checkedId2)
      .then(function () {
        console.log("data removed");
      })
      .catch(function (error) {
        console.log(error);
      });
    res.redirect("/createsprint");
  } else {
    List.findOneAndUpdate(
      {
        name: listName2,
      },
      {
        $pull: { items: { _id: checkedId2 } },
      }
    )
      .then(function (foundList) {
        res.redirect("/createsprint" + listName2);
      })
      .catch(function (error) {
        console.log(error);
      });
  }
});

// SCRUMBOARD

app.get("/scrumboard1", async function (req, res) {
  const boardId = req.query.boardId;
  try {
    const data1 = await newSprintBacklog1.find({ status: "todo-list" }).exec();
    const data2 = await newSprintBacklog1
      .find({ status: "inprogress-list" })
      .exec();
    const data3 = await newSprintBacklog1.find({ status: "done-list" }).exec();
    res.render("scrumboard.ejs", {
      todoItems: data1,
      inprogressItems: data2,
      doneItems: data3,
      scrumboard: boardId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/scrumboard2", async function (req, res) {
  const boardId = req.query.boardId;

  try {
    const data4 = await newSprintBacklog2.find({ status: "todo-list" }).exec();
    const data5 = await newSprintBacklog2
      .find({ status: "inprogress-list" })
      .exec();
    const data6 = await newSprintBacklog2.find({ status: "done-list" }).exec();

    res.render("scrumboard.ejs", {
      todoItems: data4,
      inprogressItems: data5,
      doneItems: data6,
      scrumboard: boardId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/scrumboard1/update-status", function (req, res) {
  const taskId = req.body.taskId;
  const newStatus = req.body.newStatus;

  console.log(taskId);
  console.log(newStatus);

  newSprintBacklog1
    .findByIdAndUpdate(taskId, { status: newStatus })
    .then((task) => {
      res.json({ success: true, message: "Task status updated successfully" });
      console.log(task.status);
    })
    .catch((error) => {
      res
        .status(500)
        .json({ success: false, message: "Failed to update task status" });
    });
});

app.post("/scrumboard2/update-status", function (req, res) {
  const taskId = req.body.taskId;
  const newStatus = req.body.newStatus;
  console.log(taskId);
  console.log(newStatus);

  newSprintBacklog2
    .findByIdAndUpdate(taskId, { status: newStatus })
    .then((task) => {
      res.json({ success: true, message: "Task status updated successfully" });
      console.log(task.status);
    })
    .catch((error) => {
      res
        .status(500)
        .json({ success: false, message: "Failed to update task status" });
    });
});

// CHOOSE PROJECTS

app.get("/chooseproject", async function (req, res) {
  try {
    const projectData = await project.find().exec();

    const query = "dharwad";
    const unit = "metric";
    const apiKey = "f8ca78219d0be062168d0e862b2c18c3";

    const url =
      "https://api.openweathermap.org/data/2.5/weather?q=" +
      query +
      "&units=" +
      unit +
      "&appid=" +
      apiKey;

    https.get(url, function (response) {
      response.on("data", function (data) {
        const weatherData = JSON.parse(data);

        temperature = weatherData.main.temp;
        const desc = weatherData.weather[0].description;
        const icon = weatherData.weather[0].icon;

        iconURL = "https://openweathermap.org/img/wn/" + icon + "@2x.png";
      });
    });

    res.render("chooseproject.ejs", {
      projects: projectData,
      temperature: temperature,
      iconURL: iconURL,
      currentDate: currentDate,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/chooseProject1", async function (req, res) {
  try {
    const projectData = await project.find().exec();

    const query = "dharwad";
    const unit = "metric";
    const apiKey = "f8ca78219d0be062168d0e862b2c18c3";

    const url =
      "https://api.openweathermap.org/data/2.5/weather?q=" +
      query +
      "&units=" +
      unit +
      "&appid=" +
      apiKey;

    https.get(url, function (response) {
      response.on("data", function (data) {
        const weatherData = JSON.parse(data);

        temperature = weatherData.main.temp;
        const desc = weatherData.weather[0].description;
        const icon = weatherData.weather[0].icon;

        iconURL = "https://openweathermap.org/img/wn/" + icon + "@2x.png";
      });
    });

    res.render("chooseProject1.ejs", {
      projects: projectData,
      temperature: temperature,
      iconURL: iconURL,
      currentDate: currentDate,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});



app.post("/chooseproject", function (req, res) {
  res.redirect("/createsprint");
});

app.post("/chooseproject1", function (req, res) {
  res.redirect("/createsprint1");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
