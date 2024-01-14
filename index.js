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


    // Middleware
    const verifyToken = async (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).send({message: 'Unauthorized'});
      };
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.SE_TOKEN, (err, decoded) => {
        if (err) {
          return res.status(401).send({message: 'Unauthorized'});
        };
        req.decoded = decoded;
        next();
      })
    }

    // verify admin
    const verifyAdmin = async (req, res, next) => {
      // console.log(req.decoded);
      const email = req.decoded.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const isAdmin = user.role === "Admin";
      if (!isAdmin) {
        return res.status(403).send({message : "forbidden access"})
      }
      next();
    }
    
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
    app.get("/api/v1/users",verifyToken,  async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    // get admin check:
    app.get("/api/v1/users/admin/:email", verifyToken, verifyAdmin, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
       return res.status(403).send({message: "forbidden access"})
      };
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === 'Admin';
      }
      res.send({admin})
    })

    // update users Admin
    app.patch("/api/v1/users/admin/:id",verifyToken,verifyAdmin, async (req, res) => {
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
    app.delete("/api/v1/users/:id",verifyToken, verifyAdmin, async (req, res) => {
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

    // menu post data
    app.post("/api/v1/menu",verifyToken, verifyAdmin, async (req, res) => {
      const myMenu = req.body;
      const result = await menuCollection.insertOne(myMenu);
      res.send(result);

    });

    // get By id
    app.get('/api/v1/menu/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: (id) };
      const result = await menuCollection.findOne(query);
      res.send(result);
    })

    // delete menu
    app.delete("/api/v1/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: (id) };
      const result = await menuCollection.deleteOne(query);
      res.send(result);
    })

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
