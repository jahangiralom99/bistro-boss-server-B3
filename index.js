const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const cors = require("cors");
var jwt = require('jsonwebtoken');
require("dotenv").config();
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
// body perse;
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.e9wqxpd.mongodb.net/?retryWrites=true&w=majority`;

// mongodb sever
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const menuCollection = client.db("bostroDB").collection("menu");
    const reviewsCollection = client.db("bostroDB").collection("reviews");
    const cartCollection = client.db("bostroDB").collection("carts");
    const usersCollection = client.db("bostroDB").collection("users");


    // JWT related APT Create.
    app.post("/api/v1/create-jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.SE_TOKEN, { expiresIn: '1h' });
      res.send({token})
    })


    // users create data Post
    app.post("/api/v1/users", async (req, res) => {
      const user = req.body;
      // insert email
      const query = { email: user?.email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({message: "This Email already exists", insertedId : null})
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // get User data.
    app.get("/api/v1/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    })

    // update users Admin
    app.patch("/api/v1/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const upDate = {
        $set: {
          role : 'Admin',
        }
      }
      const result = await usersCollection.updateOne(filter, upDate);
      res.send(result);

    })

    // delete users collection
    app.delete("/api/v1/users/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(filter);
      res.send(result);
    })

    //   menu data ;
    app.get("/api/v1/menu", async (req, res) => {
      const cursor = await menuCollection.find().toArray();
      res.send(cursor);
    });

    // get review data
    app.get("/api/v1/review", async (req, res) => {
      const cursor = await reviewsCollection.find().toArray();
      res.send(cursor);
    });

    // post cart data
    app.post("/api/v1/carts", async (req, res) => {
      const myCarts = req.body;
      const result = await cartCollection.insertOne(myCarts);
      res.send(result);
    });

    // get cart data
    app.get("/api/v1/carts", async (req, res) => {
      const email = req.query.email;
      // console.log(email);
      let queryObj = {};
      if (email) {
        queryObj.email = email;
      }
      const result = await cartCollection.find(queryObj).toArray();
      res.send(result);
    });

    // delete cart
    app.delete("/api/v1/carts-delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Boss Is Coming");
});

app.listen(port, () => {
  console.log(`listening on Boss Port ${port}`);
});
