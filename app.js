const express = require("express");
const bodyParser = require("body-parser");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


/* --------Set up a mongoose connection----------- */
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/todolistDB');

// Create itemsSchema 
const itemsSchema = new mongoose.Schema({
  name: String
});

const customListSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const customList = mongoose.model("customList", customListSchema);

// Create a data model
const Item = mongoose.model("Item", itemsSchema);
const item1 = new Item({ name: "Buy Foods" });
const item2 = new Item({ name: "Cook Foods" });
const item3 = new Item({ name: "Wash Dishes" });

const defaultItemsArray = [item1, item2, item3];
/* ---------------------------------------------- */

app.get("/", function (req, res) {

  let day = "LIST";

  Item.find({}, function (err, foundItems) {

    if (foundItems.length === 0) {
      Item.insertMany(defaultItemsArray, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Succesfully saved the default item.")
        }
      });
      res.redirect("/");
    }
    res.render("list", { listTitle: day, newListItems: foundItems });
  })
});

app.post("/", function (req, res) {

  let itemName = req.body.newItem;
  let listName = req.body.list;

  let item = new Item({ name: itemName });

  if (listName == "LIST") {
    item.save();
    res.redirect("/");
  } else {
    customList.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
}
);

app.post("/delete", function (req, res) {

  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName == "LIST") {
    Item.findByIdAndRemove(checkedItemID, function (err) {
      if (err) {
        console.log(err);
      }
    });
    res.redirect("/");
  } else {
    customListSchema.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemID } } }, function (err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    })
  }
});

app.get("/:customListName", function (req, res) {
  const customListName = req.params.customListName;

  customList.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        const list = new customList({
          name: customListName,
          items: defaultItemsArray
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }
    }
  });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
