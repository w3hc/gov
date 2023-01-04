# Storage

The project uses Web3.Storage to store files (membership NFTs metadata, and manifesto).

The `upload-manifesto.ts` script uses the content of the manifesto directory (a markdown file).

The `upload-metadata.ts` script uses the content of the metadata directory (an image file).

## Use

#### Upload manifesto

Edit the `manifesto.md` file, then:

```shell
npx hardhat run scripts/upload-manifesto.ts
```

Note that you can put a whole website in the manifesto directory, the result will be the same: you'll get the CID of your manifesto.

#### Upload metadata

Edit the metadata in `upload-metadata.ts`, then:

```shell
npx hardhat run scripts/upload-metadata.ts
```
