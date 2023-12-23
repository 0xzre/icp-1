import { $query, $update, Record, Result, nat64, StableBTreeMap, ic, match } from 'azle';
import { v4 as uuidv4 } from 'uuid';

/**
 * Converts a date string to a timestamp.
 * @param dateString - The input date string.
 * @returns The corresponding timestamp.
 */
function convertDateToTimestamp(dateString: string): nat64 {
    return BigInt(Math.floor(new Date(dateString).getTime() / 1000));
}

type AuctionItem = Record<{
    id: string;
    title: string;
    description: string;
    minBid: number;
    endTime: nat64;
}>;

type Bid = Record<{
    bidder: string;
    amount: number;
}>;

type Auction = Record<{
    item: AuctionItem;
    bids: Bid[];
    highestBid: Bid | null;
}>;

const auctions = new StableBTreeMap<string, Auction>(0, 44, 1024);

$update;
/**
 * Lists a new auction item.
 * @param title - The title of the auction item.
 * @param description - The description of the auction item.
 * @param minBid - The minimum bid amount for the auction item.
 * @param endDate - The end date of the auction item.
 * @returns The created auction.
 */
export function listItem(title: string, description: string, minBid: number, endDate: string): Result<Auction, string> {
    const id = uuidv4();
    const endTime = convertDateToTimestamp(endDate);

    const newAuction: Auction = {
        item: { id, title, description, minBid, endTime },
        bids: [],
        highestBid: null
    };

    auctions.insert(id, newAuction);
    return Result.Ok(newAuction);
}

$update;
/**
 * Places a bid on an auction item.
 * @param itemId - The ID of the auction item.
 * @param bid - The bid to be placed.
 * @returns The updated auction.
 */
export function placeBid(itemId: string, bid: Bid): Result<Auction, string> {
    return match(auctions.get(itemId), {
        Some: (auction) => {
            if (ic.time() > auction.item.endTime) {
                return Result.Err('Auction ended');
            }

            if (bid.amount <= auction.item.minBid || (auction.highestBid && bid.amount <= auction.highestBid.amount)) {
                return Result.Err('Bid too low');
            }

            auction.bids.push(bid);
            auction.highestBid = bid;
            auctions.insert(itemId, auction);
            return Result.Ok(auction);
        },
        None: () => Result.Err('Auction not found')
    });
}

$query;
/**
 * Retrieves a list of all auctions.
 * @returns The list of auctions.
 */
export function getAuctions(): Result<Array<Auction>, string> {
    try {
        const auctionList = auctions.values();
        return Result.Ok(auctionList);
    } catch (error) {
        return Result.Err('Failed to fetch auctions');
    }
}

$query;
/**
 * Retrieves the winner bid for a specific auction item.
 * @param itemId - The ID of the auction item.
 * @returns The winner bid or null if the auction is not ended yet.
 */
export function getWinner(itemId: string): Result<Bid | null, string> {
    return match(auctions.get(itemId), {
        Some: (auction) => {
            if (ic.time() <= auction.item.endTime) {
                return Result.Err('Auction not ended yet');
            }

            return Result.Ok(auction.highestBid);
        },
        None: () => Result.Err('Auction not found')
    });
}
