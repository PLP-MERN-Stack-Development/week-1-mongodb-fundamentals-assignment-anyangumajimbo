const { MongoClient } = require('mongodb');
const uri = 'mongodb://localhost:27017';

async function runQueries() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('plp_bookstore');
    const books = db.collection('books');

    // ----- Task 2: Basic CRUD Operations -----

    console.log("Fiction books:");
    console.log(await books.find({ genre: 'Fiction' }).toArray());

    console.log("\nBooks published after 1950:");
    console.log(await books.find({ published_year: { $gt: 1950 } }).toArray());

    console.log("\nBooks by George Orwell:");
    console.log(await books.find({ author: 'George Orwell' }).toArray());

    const updateResult = await books.updateOne(
      { title: 'The Great Gatsby' },
      { $set: { price: 11.99 } }
    );
    console.log(`\nUpdated The Great Gatsby price. Modified count: ${updateResult.modifiedCount}`);

    const deleteResult = await books.deleteOne({ title: 'Animal Farm' });
    console.log(`\nDeleted Animal Farm. Deleted count: ${deleteResult.deletedCount}`);

    // ----- Task 3: Advanced Queries -----

    console.log('\n1. Books in stock and published after 2010:');
    const recentInStock = await books.find({
      in_stock: true,
      published_year: { $gt: 2010 }
    }).toArray();
    console.log(recentInStock);

    console.log('\n2. Projection (title, author, price only):');
    const projected = await books.find({}, {
      projection: { _id: 0, title: 1, author: 1, price: 1 }
    }).toArray();
    console.log(projected);

    console.log('\n3. Sorting by price ascending:');
    const sortedAsc = await books.find({}).sort({ price: 1 }).toArray();
    console.log(sortedAsc);

    console.log('\n4. Sorting by price descending:');
    const sortedDesc = await books.find({}).sort({ price: -1 }).toArray();
    console.log(sortedDesc);

    console.log('\n5. Pagination (page 2, 5 books per page):');
    const page2 = await books.find({}).skip(5).limit(5).toArray();
    console.log(page2);

    // ----- ✅ Task 4: Aggregation Pipelines -----

    console.log('\n1. Average price of books by genre:');
    const avgPriceByGenre = await books.aggregate([
      {
        $group: {
          _id: "$genre",
          average_price: { $avg: "$price" },
          count: { $sum: 1 }
        }
      }
    ]).toArray();
    console.log(avgPriceByGenre);

    console.log('\n2. Author with the most books:');
    const topAuthor = await books.aggregate([
      {
        $group: {
          _id: "$author",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]).toArray();
    console.log(topAuthor);

    console.log('\n3. Books grouped by publication decade:');
    const booksByDecade = await books.aggregate([
      {
        $group: {
          _id: {
            $concat: [
              { $toString: { $multiply: [{ $floor: { $divide: ["$published_year", 10] } }, 10] } },
              "s"
            ]
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();
    console.log(booksByDecade);

     // ----- Task 5: Indexing -----

    // 1. Create index on the title field
    const titleIndex = await books.createIndex({ title: 1 });
    console.log(`\nIndex created on 'title': ${titleIndex}`);

    // 2. Create a compound index on author and published_year
    const compoundIndex = await books.createIndex({ author: 1, published_year: 1 });
    console.log(`Compound index created on 'author' and 'published_year': ${compoundIndex}`);

    // 3. Use explain() to show performance improvement
    console.log('\nQuery performance with explain():');
    const explainResult = await books.find({ title: 'The Great Gatsby' }).explain("executionStats");
    console.log(JSON.stringify(explainResult.executionStats, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
}


runQueries().catch(console.error);
