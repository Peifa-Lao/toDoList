//jshint esversion:6
//Node.js express ejs mongdb mongoose API

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-nick:<password>@cluster0.kjkmm.mongodb.net/?retryWrites=true&w=majority", {useNewUrlParser: true});

//create a doc
const itemsSchema = {
  name: String
};

//name of collection is called "Item"
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];



app.get("/", function(req, res) {
 //findALL
  Item.find({}, function(err, foundItems){
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err){
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully savevd default items to DB.");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });

});

//this uses for users to access by customlistname
const listSchema ={
  name: String,
  items: [itemsSchema]
};
const List = mongoose.model("List", listSchema);


//creating custom lists using Express Route Parameter
app.get("/:customListName", function(req, res){

  const customListName = _.capitalize(req.params.customListName);

  //this line is mongdb findOne(), to find within the list collection whether if there is a listTitle
  //has the same name as the one that the user is currently trying to access.
  /*
  format: <ModelName>.find({conditions}, function(err, results){
      //use the found results docs
  });
  */
  List.findOne({name: customListName}, function(err, foundList){
    if (!err){
      //!foundList = does not exist
      if (!foundList){
        //Create a collection called list
        const list = new List({
          name: customListName,
          items: defaultItems   //the default items
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //Show an existing list
        //render ejs "list"  {customListName, customList items}
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });
});

//Add items
app.post("/", function(req, res){

  const itemName = req.body.newItem;
  //get the list information for list.ejs -> post action("/")
  const listName = req.body.list;
//create new item document
  const item = new Item({
    name: itemName
  });
  //save it in mongodb  => item.save()
  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    //from submit button in list.ejs, add item to the respoinding list
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

//Delete items
app.post("/delete", function(req, res){
  //get id from list.ejs that item is going the delete
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    //provide id as agruement to delete in database
    //use callback function to handle any error or success
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    //mongoose findOneAndUpdate is to remove element from array on mongdb
    //{name: listName} is the list name
    //{$pull: {items: {_id: checkedItemId}}} remove the element based on the _id
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err){
        res.redirect("/" + listName);
      }
    });
  }


});

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started Successfully");
});
