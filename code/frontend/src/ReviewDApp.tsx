// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

/**
 * Main dApp component for the decentralized review platform
 * Organizes Three.js scene, login, navigation, card system and features panels
 * Panel logic is fully modular
 */

import React, { useEffect, useState } from "react";
import Scene from "./Scene";
import { IdCard, MessageSquareText, ShieldUser } from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import clsx from "clsx";
import { ethers } from "ethers";
import { generateEd25519DID } from "./utils/generateEd25519DID";

// --- Import modular panels ---
import WalletAccessPanel from "./panels/WalletAccessPanel.tsx";
import SignedReviewsPanel from "./panels/SignedReviewsPanel.tsx";
import ZKPReputationPanel from "./panels/ZKPReputationPanel.tsx";
import DecryptingTitle from "./components/DecryptedTitle.tsx";

/**
 * FeatureCard config for rendering selection UI and linking to correct panel
 */
interface Feature {
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  bg: string;
  glow: string;
}

// List of available features/cards
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
  // State for expanded card panel (feature)
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  // State for connected wallet address
  const [wallet, setWallet] = useState<string | null>(null);

  // --- VC (Verifiable Credential) persistence and DID entries ---
  const [vc, setVc] = useState<any>(() => {
    const stored = localStorage.getItem("vc");
    return stored ? JSON.parse(stored) : null;
  });

  // --- DID entries persistence ---
  const [didEntries, setDidEntries] = useState<any[]>(() => {
    const stored = localStorage.getItem("didEntries");
    return stored ? JSON.parse(stored) : [];
  });

  // --- VC status and banned DIDs ---
  // Status of the loaded VC (valid/revoked/expired/null)
  const [vcStatus, setVcStatus] = useState<"valid" | "revoked" | "expired" | null>(null);
  // Banned DIDs for this user (array of DID strings)
  const [bannedDids, setBannedDids] = useState<string[]>([]);

  /**
   * On first render: load VC from URL if present and scroll to features
   */
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

  // --- Check VC status and banned DIDs whenever VC or DID entries change ---
  useEffect(() => {
    if (!vc || !vc.credentialSubject?.id) {
      setVcStatus(null);
      setBannedDids([]);
      return;
    }

    // Fetch VC status from backend
    fetch(`/vc-status?userHash=${vc.credentialSubject.id}`)
        .then((res) => res.json())
        .then((data) => {
          setVcStatus(data.status as "valid" | "revoked" | "expired");
        })
        .catch(() => setVcStatus(null));

    // Fetch banned DIDs from backend/IPFS
    fetch("/ban-list-cid")
        .then((res) => res.json())
        .then(async (data) => {
          if (!data.cid) return;
          // Use public IPFS gateway (or your own IPFS node)
          const ipfsRes = await fetch(`https://ipfs.io/ipfs/${data.cid}`);
          const didList = await ipfsRes.json();
          const banned = didEntries.filter(entry => didList.includes(entry.did));
          setBannedDids(banned.map(entry => entry.did));
        })
        .catch(() => setBannedDids([]));
  }, [vc, didEntries]);

  /**
   * Effect to manage body overflow when a card is expanded
   */
  useEffect(() => {
    if (expandedCard) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => document.body.classList.remove("overflow-hidden");
  }, [expandedCard]);

  /*
   * On full page reload, reset state if needed
   */
  useEffect(() => {
    // On full reload (F5), reset card and scroll to home
    setExpandedCard(null);
    document.body.classList.remove("overflow-hidden");
    const hero = document.querySelector("section.snap-start");
    if (hero) {
      hero.scrollIntoView({ behavior: "auto" });
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  /*
    * Listen for VC messages from popup after login-vc form
   */
  useEffect(() => {
    function handleVCMessage(event: MessageEvent) {
      // Accept only from your backend
      if (event.origin !== "http://localhost:8082") return;
      if (!event.data || event.data.type !== "VC_LOGIN") return;
      try {
        const vcBase64 = event.data.vc;
        const json = atob(vcBase64);
        setVc(JSON.parse(json));
        localStorage.setItem("vc", json);
        setExpandedCard("Wallet & Access");
        // Scroll smoothly to features section
        setTimeout(() => {
          const section = document.getElementById("features-section");
          if (section) section.scrollIntoView({ behavior: "smooth" });
        }, 400);
      } catch (err) {
        setVc(null);
        localStorage.removeItem("vc");
      }
    }
    // Listen for messages from the popup window
    window.addEventListener("message", handleVCMessage);
    return () => window.removeEventListener("message", handleVCMessage);
  }, []);

  /*
    * Prevent browser zooming via keyboard shortcuts or pinch gestures
   */
  useEffect(() => {
    function blockZoom(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && ["=", "-", "0", "+", "_"].includes(e.key)) {
        e.preventDefault();
      }
    }

    function blockWheel(e: WheelEvent) {
      if (e.ctrlKey) e.preventDefault();
    }

    let lastTouchEnd = 0;
    function preventDoubleTapZoom(e: TouchEvent) {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) e.preventDefault();
      lastTouchEnd = now;
    }

    window.addEventListener("keydown", blockZoom, { passive: false });
    window.addEventListener("wheel", blockWheel, { passive: false });
    document.addEventListener("touchend", preventDoubleTapZoom, false);

    return () => {
      window.removeEventListener("keydown", blockZoom);
      window.removeEventListener("wheel", blockWheel);
      document.removeEventListener("touchend", preventDoubleTapZoom);
    };
  }, []);

  /**
   * Scroll to cards/feature section
   */
  const scrollToCards = () => {
    const target = document.getElementById("features-section");
    if (target) target.scrollIntoView({ behavior: "smooth" });
  };

  /**
   * Connect wallet (MetaMask, etc.)
   */
  const connectWallet = async () => {
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setWallet(accounts[0]);
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Create a new Ed25519 DID and persist in localStorage
   */
  async function handleCreateDid() {
    const didData = await generateEd25519DID();
    const newEntry = {
      did: didData.did,
      skHex: didData.skHex,
      pkHex: didData.pkHex,
      vcName: vc?.credentialSubject?.name || "–"
    };
    const updated = [...didEntries, newEntry];
    setDidEntries(updated);
    localStorage.setItem("didEntries", JSON.stringify(updated));
  }

  /**
   * Download a DID+keypair as a text file
   */
  function handleDownloadKey(did: string, skHex: string, pkHex: string) {
    const content = `DID: ${did}\nPrivate key (hex): ${skHex}\nPublic key (hex): ${pkHex}\n`;
    const blob = new Blob([content], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `did-keys.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  /*
   * Handle delete DID action
   */
  function handleDeleteDid(did: string) {
    // Remove from state
    const updated = didEntries.filter(entry => entry.did !== did);
    setDidEntries(updated);
    // Sync with localStorage
    localStorage.setItem("didEntries", JSON.stringify(updated));
  }

  /*
   * Handler for logout, clean all local state and storage
   */
  function handleLogout() {
    setVc(null);
    setVcStatus(null);
    setDidEntries([]);
    setBannedDids([]);
    localStorage.removeItem("vc");
    localStorage.removeItem("didEntries");
    window.location.href = "/"; // Redirect to home
  }

  // --- Feature disabling logic: ---
  // Only allow access to Signed Reviews and ZKP Reputation if VC is valid and at least one DID is not banned
  const isVCInvalid = vcStatus === "revoked" || vcStatus === "expired";
  const allDIDsBanned = didEntries.length > 0 && bannedDids.length === didEntries.length;

  // -------------- RENDER -----------------
  return (
      <div className={`relative h-screen w-full text-[#ccccff] font-orbitron bg-gradient-to-b from-[#0f0f1f] via-[#1a0033] to-[#0f0f1f] ${
          expandedCard
              ? "overflow-hidden snap-none"
              : wallet
                  ? "overflow-y-scroll snap-y snap-mandatory"
                  : "snap-y snap-mandatory overflow-hidden"
      }`}>
        {/* Three.js Background Scene */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute w-full h-full bg-gradient-to-b from-transparent via-transparent to-black" />
          <Scene />
        </div>

        {/* Hero section */}
        <section className="relative z-10 h-screen snap-start flex flex-col items-center justify-center text-center px-4">
          <div className="absolute px-8 py-4 rounded-full backdrop-blur-lg bg-white/10 border z-0" style={{ minWidth: "50%" }} />
          <DecryptingTitle className="relative z-10 text-[50px] md:text-[50px] font-bold text-cyan-300 drop-shadow-[0_0_20px_#00fff7]"
            text="Your Identity. Your Reviews. Your Control." speed={50}
          />
          <div className="mt-12 flex space-x-[50px] items-center justify-center ">
            <button
                onClick={wallet ? undefined : connectWallet}
                disabled={!!wallet}
                className={clsx(
                    "px-[50px] py-[20px] rounded-full bg-cyan-500/20 text-cyan-300 border-cyan-300/30 transition-all duration-300 backdrop-blur-md animate-pulse hover:scale-105",
                    wallet
                        ? "bg-cyan-400/20 text-white animate-none cursor-default"
                        : "hover:bg-cyan-400/20 animate-pulse hover:scale-105"
                )}
                style={{ minWidth: "50%", fontSize: "24px", fontWeight: "600" }}
            >
              {wallet ? `Wallet Connected` : "Connect Wallet"}
            </button>
            <button
                onClick={wallet ? scrollToCards : undefined}
                disabled={!wallet}
                className={clsx(
                    "px-[50px] py-[20px] rounded-full bg-cyan-500/20 text-cyan-300 border-cyan-300/30 transition-all duration-300 backdrop-blur-md",
                    wallet
                        ? "hover:bg-cyan-400/20 animate-pulse hover:scale-105"
                        : "opacity-40 cursor-not-allowed"
                )}
                style={{ minWidth: "50%", fontSize: "24px", fontWeight: "600" }}
            >
              Explore Features
            </button>
          </div>
        </section>

        {/* Features grid and expanded feature panel */}
        <section
            id="features-section"
            className="relative z-10 h-screen snap-start flex bg-gradient-to-b from-transparent to-black"
        >
          <LayoutGroup>
            {/* Left: Feature selection grid */}
            {!expandedCard && (
                <div className="w-1/2 flex items-center justify-center mx-[200px] mr-[400px] px-[40px]">
                  <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[80px]">
                    {features.map((f) => {
                      // --- Disable feature card logic ---
                      const isWalletPanel = f.title === "Wallet & Access";
                      const isDisabled =
                          !isWalletPanel && (isVCInvalid || allDIDsBanned);
                      return (
                          <motion.div
                              key={f.title}
                              layoutId={`card-${f.title}`}
                              onClick={() =>
                                  !isDisabled && setExpandedCard(f.title)
                              }
                              className={clsx(
                                  "rounded-[30px] cursor-pointer backdrop-blur-md p-[10px] mr-[50px]",
                                  f.bg,
                                  f.glow,
                                  isDisabled &&
                                  "opacity-40 cursor-not-allowed grayscale"
                              )}
                              whileTap={isDisabled ? {} : { scale: 0.98 }}
                              tabIndex={isDisabled ? -1 : 0}
                              aria-disabled={isDisabled}
                              title={
                                isDisabled
                                    ? "This feature requires a valid VC and at least one non-banned DID"
                                    : f.title
                              }
                          >
                            <motion.div
                                layoutId={`icon-${f.title}`}
                                className="mb-4 flex justify-center"
                            >
                              <f.icon className="w-[50px] h-[50px] text-cyan-300" />
                            </motion.div>
                            <motion.h3
                                layoutId={`title-${f.title}`}
                                className="text-xl font-semibold mb-2 text-center"
                            >
                              {f.title}
                            </motion.h3>
                          </motion.div>
                      );
                    })}
                  </div>
                </div>
            )}

            {/* Right: Expanded feature panel (canvas) */}
            <div className="w-1/2 relative flex items-center justify-center mx-[200px]">
              <AnimatePresence>
                {expandedCard && (() => {
                  const f = features.find((x) => x.title === expandedCard)!;
                  return (
                      <motion.div
                          layoutId={`card-${expandedCard}`}
                          className={clsx(
                              "fixed inset-[7%] rounded-2xl z-10 p-8 flex flex-col items-center text-center shadow-neon-cyan glass-animate-in min-h-[80vh] h-[90vh] justify-between",
                              f.bg,
                              f.glow,
                              "backdrop-blur-3xl"
                          )}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                      >
                        <div className="flex-1 w-full flex flex-col items-center">
                          {/* Dark blurred background */}
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
                                className="text-lg mb-8 px-4"
                            >
                              {f.description}
                            </motion.div>
                            {/* --- Notification for VC/DID status --- */}
                            {expandedCard === "Wallet & Access" && (
                                <>
                                  {vcStatus === "revoked" && (
                                      <div className="mb-4 p-2 rounded bg-red-600/80 text-white font-bold shadow-xl">
                                        Your VC is <span className="underline">revoked</span> and is no longer valid
                                      </div>
                                  )}
                                  {vcStatus === "expired" && (
                                      <div className="mb-4 p-2 rounded bg-yellow-600/80 text-white font-bold shadow-xl">
                                        Your VC is <span className="underline">expired</span>. Please request a new credential
                                      </div>
                                  )}
                                  {bannedDids.length > 0 && (
                                      <div className="mb-4 p-2 rounded bg-red-800/80 text-white font-bold shadow-xl">
                                        Warning: One or more of your DIDs are <span className="underline">banned</span>!
                                      </div>
                                  )}
                                  {/* --- Feature-specific panel rendering --- */}
                                  <WalletAccessPanel
                                      vc={vc}
                                      vcStatus={vcStatus}
                                      didEntries={didEntries}
                                      bannedDids={bannedDids}
                                      onCreateDid={handleCreateDid}
                                      onDownloadKey={handleDownloadKey}
                                      onLogout={handleLogout}
                                      onDeleteDid={handleDeleteDid}
                                  />
                                </>
                            )}
                            {expandedCard === "Signed Reviews" && (
                                <SignedReviewsPanel wallet={wallet} />
                            )}
                            {expandedCard === "ZKP Reputation" && (
                                <ZKPReputationPanel wallet={wallet} />
                            )}
                          </div>
                        </div>
                        <motion.button
                            onClick={() => setExpandedCard(null)}
                            className="mx-[auto] mt-auto mb-2 mb-[20px] my-auto px-6 py-3 rounded-full shadow-lg bg-cyan-500/20 border-cyan-300/30 hover:bg-cyan-400/20 transition animate-pulse hover:scale-105"
                            style={{ fontSize: "20px", fontWeight: "600" }}
                        >
                          Close
                        </motion.button>
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