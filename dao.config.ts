export const firstMembers = [
  "0xD8a394e7d7894bDF2C57139fF17e5CBAa29Dd977", // First members. Super important.
  "0xe61A1a5278290B6520f0CEf3F2c71Ba70CF5cf4C"
];

// DAO config
export const daoName = "Our DAO" // Give your DAO a name.
export const votingDelay = 1 // Just 1 block voting delay by default.
export const votingPeriod = 300 // Depends on the network you're deploying to.
export const quorum = 20 // Classic 20% quorum by default.
export const votingThreshold = 0 // 0 allows non-members to submit proposals.

// NFT config
export const nftSymbol = "MEMBER" // NFT symbol
export const nftDescription = "This is us." // Nft description

// set to false if you don't want any specific attributes to the membership NFT
export const attributes = true

// Attributes: relevant only when attributes is true
export const participationRate = "100%"
export const daoAddress = "unset"
export const nickname = "unset"
export const contribs = 0
export const role = "Hacker"