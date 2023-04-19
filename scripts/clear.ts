import hre, { ethers, network, artifacts } from 'hardhat'
import fs from 'fs'
import path from 'path'

const removeDir = function(path:any) {
  if (fs.existsSync(path)) {
    const files = fs.readdirSync(path)

    if (files.length > 0) {
      files.forEach(function(filename:any) {
        if (fs.statSync(path + "/" + filename).isDirectory()) {
          removeDir(path + "/" + filename)
        } else {
          fs.unlinkSync(path + "/" + filename)
        }
      })
      fs.rmdirSync(path)
    } else {
      fs.rmdirSync(path)
    }
  } else {
    console.log("Directory path not found.")
  }
}

const pathToArtifacts = path.join(__dirname, "../artifacts")
const pathToCache = path.join(__dirname, "../cache")
const typechainTypes = path.join(__dirname, "../typechain-types")

removeDir(pathToArtifacts)
removeDir(pathToCache)
removeDir(typechainTypes)

console.log("\n/artifacts, /cache and /typechain-types were removed. ✅")