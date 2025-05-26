// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi
// ReviewDApp.tsx

import React, { useState } from "react";
import EthereumScene from "./EthereumScene";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/800.css";
import { IdCard, MessageSquareText, ShieldUser } from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import clsx from "clsx";
import { ethers } from "ethers";
import ReviewStorage from "./abi/ReviewStorage.json";
import reviewAddress from "./abi/ReviewStorage-address.json";

interface Feature {
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  bg: string;
  glow: string;
}

const features: Feature[] = [
  {
    title: "Wallet & Access",
    description: "Manage decentralized credentials and access securely",
    icon: IdCard,
    glow: "hover:shadow-[0_0_30px_#d1f7ff]",
    bg: "bg-[#d1f7ff]/20",
  },
  {
    title: "Signed Reviews",
    description: "Publish on-chain reviews signed with your digital identity",
    icon: MessageSquareText,
    glow: "hover:shadow-[0_0_30px_#132f5f]",
    bg: "bg-[#132f5f]/90",
  },
  {
    title: "ZKP Reputation",
    description: "Prove your reputation using zero-knowledge proofs",
    icon: ShieldUser,
    glow: "hover:shadow-[0_0_30px_#ba85ff]",
    bg: "bg-[#ba85ff]/20",
  },
];

export default function ReviewDApp() {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [wallet, setWallet] = useState<string | null>(null);
  const [reviews, setReviews] = useState<string[]>([]);

  const scrollToCards = () => {
    const target = document.getElementById("features-section");
    if (target) target.scrollIntoView({ behavior: "smooth" });
  };

  const connectWallet = async () => {
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setWallet(accounts[0]);
    } catch (err) {
      console.error(err);
    }
  };

  const loadReviewsFromIPFS = async () => {
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        reviewAddress.address,
        ReviewStorage.abi,
        signer
      );
      const data: string[] = await contract.getAllReviews();
      setReviews(data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative h-screen w-full text-[#ccccff] font-[Poppins] overflow-y-scroll snap-y snap-mandatory bg-gradient-to-b from-[#0f0f1f] via-[#1a0033] to-[#0f0f1f]">
      {/* Background Scene */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute w-full h-full bg-gradient-to-b from-transparent via-transparent to-black" />
        <EthereumScene />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 h-screen snap-start flex flex-col items-center justify-center text-center px-4">
        <div
          className="absolute px-8 py-4 rounded-full backdrop-blur-lg bg-white/10 border z-0"
          style={{ minWidth: "50%" }}
        />
        <h1 className="relative z-10 text-[50px] font-bold drop-shadow-[0_0_20px_#00fff7]">
          Your Identity. Your Reviews. Your Control.
        </h1>
        <button
          onClick={scrollToCards}
          className="mt-12 px-12 py-6 rounded-full bg-cyan-500/20 text-cyan-300 border-cyan-300/30 hover:bg-cyan-400/20 transition-all duration-300 backdrop-blur-md animate-pulse hover:scale-105"
          style={{ minWidth: "15%", minHeight: "80px", fontSize: "24px", fontWeight: "600" }}
        >
          Explore Features
        </button>
      </section>

      {/* Features Section with two-column layout */}
      <section
        id="features-section"
        className="relative z-10 h-screen snap-start flex bg-gradient-to-b from-transparent to-black"
      >
        <LayoutGroup>
          {/* Left column: grid of compact cards */}
          <div className="w-1/2 flex items-center justify-center mx-[200px] mr-[400px]">
            <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[80px]">
              {features.map((f) => (
                <motion.div
                  key={f.title}
                  layoutId={`card-${f.title}`}
                  onClick={() => setExpandedCard(f.title)}
                  className={clsx(
                    "rounded-[30px] p-6 cursor-pointer backdrop-blur-md",
                    f.bg,
                    f.glow
                  )}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div layoutId={`icon-${f.title}`} className="mb-4 flex justify-center">
                    <f.icon className="w-[50px] h-[50px] text-cyan-300" />
                  </motion.div>
                  <motion.h3
                    layoutId={`title-${f.title}`}
                    className="text-xl font-semibold mb-2 text-center"
                  >
                    {f.title}
                  </motion.h3>
                  <p className="text-sm text-white/80 leading-relaxed text-center px-4">
                    {f.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right column: overlay “canvas” for the expanded card */}
          <div className="w-1/2 relative flex items-center justify-center mx-[200px]">
            <AnimatePresence>
              {expandedCard && (() => {
                const f = features.find((x) => x.title === expandedCard)!;
                return (
                  <motion.div
                    layoutId={`card-${expandedCard}`}
                    className={clsx(
                        "fixed inset-[7%] rounded-2xl z-10 p-8 flex flex-col items-center text-center",
                        f.bg,
                        f.glow,
                        "backdrop-blur-3xl"
                    )}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* dark blurred background */}
                    <div className="absolute inset-0 rounded-2xl bg-black/70 backdrop-blur-3xl" />
                    <div className="relative z-10 w-full">
                      <motion.div layoutId={`icon-${expandedCard}`} className="mb-6">
                        <f.icon className="w-[80px] h-[80px] text-cyan-300" />
                      </motion.div>
                      <motion.h3
                        layoutId={`title-${expandedCard}`}
                        className="text-3xl font-bold mb-4 text-white"
                      >
                        {expandedCard}
                      </motion.h3>
                      <motion.div
                        layoutId={`content-${expandedCard}`}
                        className="text-lg text-white/80 mb-8 px-4"
                      >
                        {f.description}
                      </motion.div>
                      <motion.button
                        onClick={() => setExpandedCard(null)}
                        className="mt-[30px] px-12 py-6 backdrop-blur-md rounded-full text-white shadow-lg bg-cyan-500/20 border-cyan-300/30 hover:bg-cyan-400/20 transition animate-pulse hover:scale-105 transition-all duration-300"
                        style={{ minWidth: "90px", minHeight: "45px", fontSize: "20px", fontWeight: "600" }}
                      >
                        Close
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </div>
        </LayoutGroup>
      </section>


      {/* Footer */}
      <footer className="relative z-10 w-full h-auto py-[20px] text-center border-t border-white/10 text-sm text-white/60 snap-start">
        <p>Built with ❤</p>
        <button
          onClick={() => window.open("https://github.com/Kirito-Emo/Decentralized-Ecommerce", "_blank")}
          className="px-12 py-6 backdrop-blur-md rounded-full text-white shadow-lg bg-cyan-500/20 border-cyan-300/30 hover:bg-cyan-400/20 transition animate-pulse hover:scale-105 transition-all duration-300"
          style={{ minWidth: "150px", minHeight: "40px", fontSize: "16px", fontWeight: "600" }}
        >
          View on GitHub
        </button>
      </footer>
    </div>
  );
}