# Digital Auction System

## Overview

This smart contract implements a digital auction system using TypeScript on Azle for the Internet Computer. It allows users to list items for auction, place bids, view ongoing auctions, and determine the auction winners.

## Prerequisites

- Node.js
- TypeScript
- DFX (DFINITY Canister SDK)
- Internet Computer CDK (Canister Development Kit)

## Installation

1. **Clone the repository:**

    ```bash
    git clone https://github.com/0xzre/icp-1.git
    ```

## Project Structure

The project is structured as follows:

- **`src/`**: Contains the source code for the digital auction system.
  - **`index.ts`**: Main implementation file for the digital auction system.

- **`node_modules/`**: Directory for Node.js project dependencies.

- **`package.json`**: Node.js configuration file, including project dependencies and scripts.

- **`tsconfig.json`**: TypeScript compiler configuration file.

- **`README.md`**: Documentation for the project, including overview, installation, and usage.

## Functions

### `listItem(title: string, description: string, minBid: number, endDate: string): Result<Auction, string>`

- Lists a new item for auction with the specified title, description, minimum bid, and end date.

### `placeBid(itemId: string, bid: Bid): Result<Auction, string>`

- Places a bid on an auction item.

### `getAuctions(): Array<Auction>`

- Retrieves a list of all ongoing auctions.

### `getWinner(itemId: string): Result<Bid | null, string>`

- Determines the winner of an auction based on the highest bid at the end of the auction.

## Usage

- List items for auction using `listItem`.
- Place bids on listed items with `placeBid`.
- View all ongoing auctions via `getAuctions`.
- Determine auction winners through `getWinner`.

## Try it out

Use `dfx` to interact with the Internet Computer:

1. **Install DFX:**

    ```bash
    sh -ci "$(curl -fsSL https://sdk.dfinity.org/install.sh)"
    ```

2. **Start a local Internet Computer replica:**

    ```bash
    dfx start --background
    ```

3. **Deploy the canister locally:**

    ```bash
    dfx deploy
    ```

4. **Interact with the canister:**

    To list an item for auction:
    ```bash
    dfx canister call digital_auction listItem '("Lamp", "Antique lamp", 100, "2023-12-31")'
    ```
   
    To place a bid:
    ```bash
    dfx canister call digital_auction placeBid '("auction_id", record { bidder = "user1"; amount = 150 })'
    ```
   
    To view auctions:
    ```bash
    dfx canister call digital_auction getAuctions
    ```
   
    To determine the winner:
    ```bash
    dfx canister call digital_auction getWinner '("auction_id")'
    ```

5. **Deploy to mainnet:**

    Assuming you have created a cycles wallet and funded it with cycles, deploy to mainnet:
    ```bash
    dfx deploy --network ic
    ```
