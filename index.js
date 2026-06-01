const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const dotenv = require('dotenv');
const cors = require('cors');
dotenv.config();
const app = express()
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 8080;


const uri = process.env.MONGODB_URI

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });

    const db = client.db("shadowplay");
    const moviesCollection = db.collection("movies");
    const castsCollection = db.collection("casts")
    const favoritesCollection = db.collection("favorites")

    const getCastsByMovieId = async (movieId) => {
    const query = { movieId: parseInt(movieId) };
    return await castsCollection.find(query).toArray();
    };


    app.get("/movies", async (req, res) => {
      const cursor = moviesCollection.find();
      const result = await cursor.toArray();
      // console.log(result);
      res.send(result);

    });

    app.get("/movies/:movieId", async (req, res) => {
  const { movieId } = req.params;
  
  const movie = await moviesCollection.findOne({ id: parseInt(movieId) });

  if (!movie) {
    return res.status(404).send({ message: "Movie not found" });
  }

  const casts = await getCastsByMovieId(movieId);

  res.send({
    ...movie,
    casts: casts
  });
});





    app.get('/nowStreaming', async (req, res) => {
      const cursor = moviesCollection.find().limit(8);
      const result = await cursor.toArray();
      res.send(result);
    });


    app.get('/suggestsMovie', async (req, res) => {
      const cursor = moviesCollection.find().limit(4);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/favorite/:userId/:movieId", async (req, res) => {
  const { userId, movieId } = req.params;
  const wish = await db.collection("favorites").findOne({ 
    userId, 
    movieId: parseInt(movieId) 
  });
  res.send({ isLiked: !!wish });
});
    

    app.post("/favorite", async (req, res) => {
  const { userId, movieId } = req.body;
  const query = { userId, movieId: parseInt(movieId) };
  
  const existing = await db.collection("favorites").findOne(query);

  if (existing) {
    await db.collection("favorites").deleteOne(query);
    res.send({ isLiked: false });
  } else {
    await db.collection("favorites").insertOne(query);
    res.send({ isLiked: true });
  }
});

   app.get("/favorites/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const favorites = await favoritesCollection.find({ userId }).toArray();
    const movieIds = favorites.map(item => item.movieId);

    const favoriteMovies = await moviesCollection.find({ id: { $in: movieIds } }).toArray();
    
    res.send(favoriteMovies);
  } catch (error) {
    res.status(500).send({ message: "Error fetching favorites" });
  }
});

    




    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})