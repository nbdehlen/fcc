const chaiHttp = require("chai-http")
const chai = require("chai")
const assert = chai.assert
const server = require("../server")
const Like = require("../db/schema/like")
const { getSaltedIp, getIp } = require("../utils/encrypt")

chai.use(chaiHttp)
const baseUrl = "/api/stock-prices"

suite("Functional Tests", () => {
  test("Viewing one stock", done => {
    const stock = "TSLA"

    chai
      .request(server)
      .get(baseUrl)
      .query({ stock })
      .end((err, res) => {
        assert.equal(res.body.stockData.stock, stock)
        assert.isNumber(res.body.stockData.likes)
        done()
      })
  })

  test("Viewing one stock and liking it", async () => {
    const stock = "TSLA"

    const getHeader = await chai.request(server).get(baseUrl).query({ stock })
    // removing oldLike
    const saltedIp = await getSaltedIp(getHeader.req.host)
    await Like.deleteOne({ stock, like: saltedIp })
    const oldCount = await chai.request(server).get(baseUrl).query({ stock })

    const likeStock = await chai
      .request(server)
      .get(baseUrl)
      .query({ stock, like: true })

    const newCount = await chai.request(server).get(baseUrl).query({ stock })

    assert.isAbove(newCount.body.stockData.likes, oldCount.body.stockData.likes)

    // removing the like
    await Like.deleteOne({ stock, like: saltedIp })
  })

  test("Viewing same stock and liking it again", async () => {
    const stock = "TSLA"
    const first = await chai
      .request(server)
      .get(baseUrl)
      .query({ stock, like: true })

    const oldCount = await chai.request(server).get(baseUrl).query({ stock })

    await chai.request(server).get(baseUrl).query({ stock, like: true })

    const newCount = await chai.request(server).get(baseUrl).query({ stock })

    assert.equal(oldCount.body.stockData.likes, newCount.body.stockData.likes)

    // removing the like
    const saltedIp = await getSaltedIp(first.req.host)
    await Like.deleteOne({ stock, like: saltedIp })
  })

  test("Viewing two stocks", async () => {
    const stocks = ["TSLA", "MSFT"]
    const res = await chai.request(server).get(baseUrl).query({ stock: stocks })
    assert.equal(res.body.stockData[0].stock, stocks[0])
    assert.isNumber(res.body.stockData[0].rel_likes)

    assert.equal(res.body.stockData[1].stock, stocks[1])
    assert.isNumber(res.body.stockData[1].rel_likes)
  })

  test("Viewing two stocks and liking them", async function () {
    this.timeout(4000)
    const stocks = ["TSLA", "MSFT"]
    // Making sure we haven't liked stocks yet
    const getHeaders = await chai
      .request(server)
      .get(baseUrl)
      .query({ stock: stocks })

    const saltedIp = await getSaltedIp(getHeaders.req.host)

    stocks.forEach(async st => {
      await Like.deleteOne({ stock: st, like: saltedIp })
    })
    const res = await chai.request(server).get(baseUrl).query({ stock: stocks })

    const first = await chai
      .request(server)
      .get(baseUrl)
      .query({ stock: stocks, like: true })

    const resTwo = await chai
      .request(server)
      .get(baseUrl)
      .query({ stock: stocks })

    assert.equal(resTwo.body.stockData[0].stock, stocks[0])
    assert.isNumber(resTwo.body.stockData[0].rel_likes)
    assert.equal(
      resTwo.body.stockData[0].rel_likes,
      res.body.stockData[0].rel_likes
    )

    assert.equal(resTwo.body.stockData[1].stock, stocks[1])
    assert.isNumber(resTwo.body.stockData[1].rel_likes)
    assert.equal(
      resTwo.body.stockData[1].rel_likes,
      res.body.stockData[1].rel_likes
    )

    stocks.forEach(async st => {
      await Like.deleteOne({ stock: st, like: saltedIp })
    })
  })
})
