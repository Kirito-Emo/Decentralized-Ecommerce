// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

import React, { useEffect, useState } from "react";
import Scene from "./Scene";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/800.css";
import { IdCard, MessageSquareText, ShieldUser } from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import clsx from "clsx";
import { ethers } from "ethers";
import ReviewStorage from "./abi/ReviewStorage.json";
import reviewAddress from "./abi/ReviewStorage-address.json";
import { LoginButton } from "./components/LoginButton";
import { VCCard } from "./components/VCCard";
import { DIDTable } from "./components/DIDTable";
import { generateEd25519DID } from "./utils/generateEd25519DID";

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

  // VC persistence
  const [vc, setVc] = useState<any>(() => {
    const stored = localStorage.getItem("vc");
    return stored ? JSON.parse(stored) : null;
  });
  // DID array, each one with skHex, pkHex
  const [didEntries, setDidEntries] = useState<any[]>(() => {
    const stored = localStorage.getItem("didEntries");
    return stored ? JSON.parse(stored) : [];
  });

  // Load VC from URL on initial render and scroll to features section
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const vcBase64 = params.get("vc");
    if (vcBase64) {
      try {
        const json = atob(vcBase64);
        setVc(JSON.parse(json));
        localStorage.setItem("vc", json);
        setExpandedCard("Wallet & Access");
        window.history.replaceState({}, document.title, window.location.pathname);

        setTimeout(() => {
          const section = document.getElementById("features-section");
          if (section) section.scrollIntoView({ behavior: "smooth" });
        }, 400);
      } catch (err) {
        setVc(null);
        localStorage.removeItem("vc");
      }
    }
  }, []);

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

  // Create new DID and update table
  async function handleCreateDid() {
    console.log("Create DID clicked!");
    const didData = await generateEd25519DID();
    const newEntry = {
      did: didData.did,
      skHex: didData.skHex,
      pkHex: didData.pkHex,
      vcName: vc?.credentialSubject?.name || "–"
    };
    const updated = [...didEntries, newEntry];
    setDidEntries(updated);
    console.log("didEntries updated:", didEntries);
    localStorage.setItem("didEntries", JSON.stringify(updated));
  }

  // Download DID, SK, PK as text file
  function handleDownloadKey(did: string, skHex: string, pkHex: string) {
    const content = `DID: ${did}\nPrivate key (hex): ${skHex}\nPublic key (hex): ${pkHex}\n`;
    const blob = new Blob([content], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `did-keys.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
      <div className="relative h-screen w-full text-[#ccccff] font-[Poppins] overflow-y-scroll snap-y snap-mandatory bg-gradient-to-b from-[#0f0f1f] via-[#1a0033] to-[#0f0f1f]">
        {/* SPID Login Button */}
        <header className="p-4 flex justify-end">
          <LoginButton />
        </header>

        {/* Background Scene */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute w-full h-full bg-gradient-to-b from-transparent via-transparent to-black" />
          <Scene />
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
          <div className="mt-12 flex space-x-[50px] items-center justify-center ">
            <button
                onClick={connectWallet}
                className="px-[50px] py-[20px] rounded-full bg-cyan-500/20 text-cyan-300 border-cyan-300/30 hover:bg-cyan-400/20 transition-all duration-300 backdrop-blur-md animate-pulse hover:scale-105"
                style={{ minWidth: "50%", fontSize: "24px", fontWeight: "600" }}
            >
              Connect Wallet
            </button>
            <button
                onClick={scrollToCards}
                className="px-[50px] py-[20px] rounded-full bg-cyan-500/20 text-cyan-300 border-cyan-300/30 hover:bg-cyan-400/20 transition-all duration-300 backdrop-blur-md animate-pulse hover:scale-105"
                style={{ minWidth: "50%", fontSize: "24px", fontWeight: "600" }}
            >
              Explore Features
            </button>
          </div>
        </section>

        {/* Features Section with two-column layout */}
        <section
            id="features-section"
            className="relative z-10 h-screen snap-start flex bg-gradient-to-b from-transparent to-black"
        >
          <LayoutGroup>
            {/* Left column: grid of compact cards */}
            <div className="w-1/2 flex items-center justify-center mx-[200px] mr-[400px] px-[40px]">
              <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[80px]">
                {features.map((f) => (
                    <motion.div
                        key={f.title}
                        layoutId={`card-${f.title}`}
                        onClick={() => setExpandedCard(f.title)}
                        className={clsx(
                            "rounded-[30px] cursor-pointer backdrop-blur-md p-[10px] mr-[50px]",
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
                        <div className="relative z-10 w-full flex flex-col items-center">
                          <motion.div layoutId={`icon-${expandedCard}`} className="mb-6 mt-[20px]">
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
                          {expandedCard === "Wallet & Access" && (
                              <div className="flex flex-row w-full h-full items-center justify-center gap-16">
                                {/* VC CARD - left */}
                                <div className="flex-1 flex flex-col items-center justify-center rounded-2xl shadow-2xl p-8 max-w-md w-full">
                                  <div className="bg-[lightskyblue] shadow-xl p-8 max-w-sm w-full flex flex-col items-center mb-6 border-2 border-cyan-400/50"
                                        style={{ fontSize: "16px", color: "black", width: "60%", borderRadius: "24px" }}
                                  >
                                    <VCCard vc={vc} />
                                    <button
                                        onClick={() => window.location.href = "http://localhost:8082/login"}
                                        className="rounded-full bg-cyan-500/30 text-cyan-900 border-cyan-400/70 hover:bg-cyan-400/30 transition-all"
                                        style={{ margin: "auto", marginTop: "20px", padding: "10px", width: "120px", fontSize: "20px", fontWeight: "800" }}
                                    >
                                      Get VC
                                    </button>
                                  </div>
                                </div>
                                {/* DID TABLE - right */}
                                <div className="flex-1 flex flex-col items-center justify-center">
                                  <DIDTable
                                      didEntries={didEntries}
                                      onCreateDid={handleCreateDid}
                                      onDownloadKey={handleDownloadKey}
                                  />
                                </div>
                              </div>
                          )}
                          {expandedCard === "Signed Reviews" && (
                              <button
                                  onClick={loadReviewsFromIPFS}
                                  className="mb-4 mt-[20px] px-8 py-4 rounded-full bg-cyan-500/20 text-cyan-300 border-cyan-300/30 hover:bg-cyan-400/20 transition-all duration-300 backdrop-blur-md animate-pulse hover:scale-105"
                                  style={{ fontSize: "18px", fontWeight: "600" }}
                              >
                                Load Reviews
                              </button>
                          )}
                          <motion.button
                              onClick={() => setExpandedCard(null)}
                              className="mx-[auto] my-[15px] px-6 py-3 rounded-full shadow-lg bg-cyan-500/20 border-cyan-300/30 hover:bg-cyan-400/20 transition animate-pulse hover:scale-105"
                              style={{ fontSize: "20px", fontWeight: "600" }}
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
              className="px-12 py-6 backdrop-blur-md rounded-full text-white shadow-lg bg-cyan-500/20 border-cyan-300/30 hover:bg-cyan-400/20 animate-pulse hover:scale-105 transition-all duration-300"
              style={{ minWidth: "150px", minHeight: "40px", fontSize: "16px", fontWeight: "600" }}
          >
            View on GitHub
          </button>
        </footer>
      </div>
  );
}