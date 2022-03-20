"use strict"
const { Router } = require("express")
const fetch = require("node-fetch")
const Like = require("../db/schema/like")
const { getSaltedIp, getIp } = require("../utils/encrypt")

const router = Router()
const baseUrl = "/api/stock-prices"
const externalUrl =
  "https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock"

const compareLikes = (a, b) => a - b

const findLikedStock = async (stock, saltedIp) => {
  const res = await Like.find({
    stock,
    like: saltedIp,
  })
  return res
}

const getFccStock = async stock => {
  const url = `${externalUrl}/${stock}/quote`
  const res = await fetch(url).then(res => res.json())
  return res
}

const prepStock = async (stock, like, headers) => {
  const stockCount = await Like.countDocuments({ stock: stock })
  const resFcc = await getFccStock(stock)

  const stockData = {
    stock: resFcc?.symbol,
    price: resFcc?.delayedPrice,
  }

  if (like) {
    const ip = getIp(headers)
    const saltedIp = getSaltedIp(ip)
    const likedStock = await findLikedStock(stock, saltedIp)

    if (likedStock?.length <= 0) {
      await Like.create({ stock: stockData?.stock, like: saltedIp })
    }
  }
  return {
    stockData: {
      ...stockData,
      likes: stockCount,
    },
  }
}

const getStock = async (req, res) => {
  const like = req.query?.like
  const stock = req.query?.stock

  // Get one stock
  if (typeof stock === "string") {
    const data = await prepStock(stock.toUpperCase(), like, req.headers)
    return res.json(data)

    // get two stocks
  } else if (Array.isArray(stock) && stock.length === 2) {
    const { stockData: dataOne } = await prepStock(
      stock[0].toUpperCase(),
      like,
      req.headers
    )
    const { stockData: dataTwo } = await prepStock(
      stock[1].toUpperCase(),
      like,
      req.headers
    )
    dataOne.rel_likes = compareLikes(dataOne.likes, dataTwo.likes)
    dataTwo.rel_likes = compareLikes(dataTwo.likes, dataOne.likes)

    delete dataOne.likes
    delete dataTwo.likes

    const data = { stockData: [dataOne, dataTwo] }
    return res.json(data)
  }

  throw new Error("Maximum 2 stocks")
}

router.get(baseUrl, getStock)

module.exports = router
