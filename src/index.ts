import {
    $query,
    $update,
    Record,
    Result,
    nat64,
    StableBTreeMap,
    ic,
    Vec,
    match,
  } from 'azle';
  import { v4 as uuidv4 } from 'uuid';
  
  // Utility function to convert a date string to a timestamp
  function convertDateToTimestamp(dateString: string): nat64 {
    return BigInt(Math.floor(new Date(dateString).getTime() / 1000));
  }
  
  // Define the structure of an Auction Item
  type AuctionItem = Record<{
    id: string;
    title: string;
    description: string;
    minBid: nat64;
    endTime: string;
  }>;
  
  // Define the payload structure for listing an Auction Item
  type AuctionItemPayload = Record<{
    title: string;
    description: string;
    minBid: nat64;
    endTime: string;
  }>;
  
  // Define the structure of a Bid
  type Bid = Record<{
    bidder: string;
    amount: nat64;
  }>;
  
  // Define the structure of an Auction, combining an AuctionItem, bids, and the highest bid
  type Auction = Record<{
    item: AuctionItem;
    bids: Vec<Bid>;
    highestBid: Bid | null;
  }>;
  
  // Create a stable B-tree map to store Auctions
  const auctions = new StableBTreeMap<string, Auction>(0, 44, 1024);
  
  // Update function to list a new Auction Item
  $update
  export function listItem(payload: AuctionItemPayload): Result<Auction, string> {
    try {
      // Validate payload properties
    if (!payload.title || !payload.description || !payload.minBid || !payload.endTime) {
        return Result.Err<Auction, string>('Invalid payload');
      }
      const id = uuidv4();
      const endTime = convertDateToTimestamp(payload.endTime).toString(); // Convert to string
  
      const newAuction: Auction = {
        item: {
          id,
          title: payload.title,
          description: payload.description,
          minBid: payload.minBid,
          endTime,
        },
        bids: [],
        highestBid: null,
      };
  
      auctions.insert(id, newAuction);
      return Result.Ok(newAuction);
    } catch (error) {
      return Result.Err<Auction, string>(`Failed to list auction: ${error}`);
    }
  }
  
  // Update function to place a bid on an Auction
  $update
  export function placeBid(itemId: string, bid: Bid): Result<Auction, string> {
    return match(auctions.get(itemId), {
      Some: (auction) => {
        try {
          // Validate bid amount
          if (!bid.amount || bid.amount <= 0) {
            return Result.Err<Auction, string>('Invalid bid amount');
          }
  
          // Validate Auction status and bid amount
          const currentTime = ic.time();
          const endTime = convertDateToTimestamp(auction.item.endTime);
  
          if (currentTime > endTime) {
            return Result.Err<Auction, string>('Auction ended');
          }
  
          if (bid.amount <= auction.item.minBid || (auction.highestBid && bid.amount <= auction.highestBid.amount)) {
            return Result.Err<Auction, string>('Bid too low');
          }
  
          // Update the Auction with the new bid
          auction.bids.push(bid);
          auction.highestBid = bid;
          auctions.insert(itemId, auction);
          return Result.Ok<Auction, string>(auction);
        } catch (error) {
          return Result.Err<Auction, string>(`Failed to place bid: ${error}`);
        }
      },
      None: () => Result.Err<Auction, string>('Auction not found'),
    });
  }
  
  // Query function to get all auctions
  $query
  export function getAuctions(): Result<Array<Auction>, string> {
    try {
      const auctionList = auctions.values();
      return Result.Ok(auctionList);
    } catch (error) {
      return Result.Err('Failed to fetch auctions');
    }
  }
  
  // Query function to get the winner of an auction
  $query
  export function getWinner(itemId: string): Result<Bid | null, string> {
    return match(auctions.get(itemId), {
      Some: (auction) => {
        try {
          // Validate Auction status
          const currentTime = ic.time();
          const endTime = convertDateToTimestamp(auction.item.endTime);
  
          if (currentTime <= endTime) {
            return Result.Err<Bid | null, string>('Auction not ended yet');
          }
  
          return Result.Ok<Bid | null, string>(auction.highestBid);
        } catch (error) {
          return Result.Err<Bid | null, string>(`Failed to get winner: ${error}`);
        }
      },
      None: () => Result.Err<Bid | null, string>('Auction not found'),
    });
  }
  
  // Cryptographic utility for generating random values
  globalThis.crypto = {
    // @ts-ignore
    getRandomValues: () => {
      let array = new Uint8Array(32);
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    },
  };
  