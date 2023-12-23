import { $query, $update, Record, Result, nat64, StableBTreeMap, ic, match } from 'azle';
import { v4 as uuidv4 } from 'uuid';

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
export function placeBid(itemId: string, bid: Bid): Result<Auction, string> {
    return match(auctions.get(itemId), {
        Some: (auction) => {
            if (ic.time() > auction.item.endTime) {
                return Result.Err<Auction, string>('Auction ended');
            }

            if (bid.amount <= auction.item.minBid || (auction.highestBid && bid.amount <= auction.highestBid.amount)) {
                return Result.Err<Auction, string>('Bid too low');
            }

            auction.bids.push(bid);
            auction.highestBid = bid;
            auctions.insert(itemId, auction); 
            return Result.Ok<Auction, string>(auction);
        },
        None: () => Result.Err<Auction, string>('Auction not found')
    });
}

$query;
export function getAuctions(): Result<Array<Auction>, string> {
    try {
        const auctionList = auctions.values();
        return Result.Ok(auctionList);
    } catch (error) {
        return Result.Err('Failed to fetch auctions');
    }
}

$query;
export function getWinner(itemId: string): Result<Bid | null, string> {
    return match(auctions.get(itemId), {
        Some: (auction) => {
            if (ic.time() <= auction.item.endTime) {
                return Result.Err<Bid | null, string>('Auction not ended yet');
            }

            return Result.Ok<Bid | null, string>(auction.highestBid);
        },
        None: () => Result.Err<Bid | null, string>('Auction not found')
    });
}