import "./App.css";
import React, { useState, useEffect } from "react";
import { Connection, PublicKey } from "@solana/web3.js";

export default function App() {
  return (
    <main>
      <SolanaWalletTransactions />
    </main>
  );
}

const SolanaWalletTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const WALLET_ADDRESS = "5gjLjKtBhDxWL4nwGKprThQwyzzNZ7XNAVFcEtw3rD4i"; // Fixed address

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const connection = new Connection(
          "https://mainnet.helius-rpc.com/?api-key=882639be-8c5f-48f5-beab-ab2e8273d386",
          "confirmed",
        );
        const pubKey = new PublicKey(WALLET_ADDRESS);

        console.log("Fetching signatures...");
        const signatures = await connection.getSignaturesForAddress(pubKey, {
          limit: 10,
        });

        if (signatures.length === 0) {
          console.warn("No signatures found for the provided address.");
          throw new Error("No transactions found for this wallet address.");
        }

        console.log("Signatures fetched:", signatures);

        const txs = await Promise.all(
          signatures.map(async (sig) => {
            try {
              const tx = await connection.getTransaction(sig.signature);
              if (tx && tx.meta) {
                return {
                  signature: sig.signature,
                  slot: sig.slot,
                  blockTime: tx.blockTime,
                  amount: tx.meta.postBalances[0] - tx.meta.preBalances[0],
                };
              } else {
                console.warn(
                  "Transaction data is null for signature:",
                  sig.signature,
                );
                return null;
              }
            } catch (innerErr) {
              console.error(
                "Error fetching transaction details for signature:",
                sig.signature,
                innerErr,
              );
              return null;
            }
          }),
        );

        // Filter out any null transactions (if any errors occurred)
        const validTxs = txs.filter((tx) => tx !== null);
        if (validTxs.length === 0) {
          throw new Error("No valid transactions were found.");
        }

        setTransactions(validTxs);
        setLoading(false);
      } catch (err) {
        console.error("Error during transaction fetch process:", err);
        setError("Failed to fetch transactions. Please try again later.");
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  if (loading) return <div>Loading transactions...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">
        Your Recent Solana Wallet Transactions
      </h2>
      <p className="mb-4">Your Wallet Address: {WALLET_ADDRESS}</p>
      <ul className="space-y-4">
        {transactions.map((tx) => (
          <li key={tx.signature} className="border p-4 rounded shadow">
            <p>
              <strong>Signature:</strong> {tx.signature}
            </p>
            <p>
              <strong>Slot:</strong> {tx.slot}
            </p>
            <p>
              <strong>Time:</strong>{" "}
              {new Date(tx.blockTime * 1000).toLocaleString()}
            </p>
            <p>
              <strong>Amount Change:</strong> {tx.amount / 1e9} SOL
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};
