# 🛒 Decentralized Ecommerce Review System

A blockchain-powered platform that reimagines product reviews in e-commerce by ensuring **authenticity**, **transparency**, **immutability**, and **privacy**.
Built as part of a Master's thesis project at the University of Salerno, this system empowers users to publish trustworthy reviews without compromising their identity, and guarantees fairness in reputation and incentives without relying on centralized control.

---

## 📌 Introduction

In today's e-commerce landscape, fake reviews, vote manipulation and vendor interference are common.
This project provides a decentralized alternative by leveraging blockchain and privacy-enhancing technologies to ensure:

- Only **real buyers** can write reviews.
- Reviews are **tamper-proof** and **publicly auditable**.
- User identities remain **pseudonymous**, while all actions are **cryptographically verifiable**.
- **Reputation and rewards** are computed objectively, without upvotes or platform interference.

---

## 🔧 How It Works

The system combines several cutting-edge Web3 technologies:

- 🧩 **Ethereum Smart Contracts**: Record review actions immutably on-chain.
- 🆔 **Decentralized Identifiers (DIDs)**: Give users pseudo-anonymous, cryptographically verifiable identities.
- 🪪 **Verifiable Credentials (VCs)**: Attest user registration and uniqueness without disclosing personal information.
- 🪙 **Soulbound NFTs**: Non-transferable tokens act as cryptographic proof-of-purchase for review eligibility.
- 🔐 **Zero-Knowledge Proofs (ZKPs)**: Allow users to prove reputation or rights without revealing their identity.
- 🗃️ **IPFS**: Used for off-chain storage of review content and revocation lists.
- ⚖️ **Smart Incentives**: Rewards are granted upon purchase, and reputational impact is determined by whether the user reviews the product within a 60-day window.

---

## 🧰 Tech Stack

|                 | Technologies Used                                                |
|-----------------|------------------------------------------------------------------|
| Blockchain      | Ethereum (Ganache for local testing)                             |
| Identity        | ethr-did, did-jwt-vc, MetaMask                                   |
| Smart Contracts | Solidity with Hardhat                                            |
| Off-chain       | IPFS, CID-based referencing                                      |
| Cryptography    | EdDSA signatures, ZKP, Selective Disclosure with BBS+ Signatures |
| Frontend        | JavaScript, Three.js, Web3.js, MetaMask integration              |

---

## 📁 Repository Structure

```
📦 Decentralized-Ecommerce Review System
├── code/contracts                                  # Solidity smart contracts
├── code/scripts                                    # Scripts to automate deploy and testing
├── code/frontend                                   # Web frontend with Web3 integration
├── Decentralized-Ecommerce-reverseEkans-latex/     # LaTeX documentation about the project
├── Decentralized-Ecommerce-reverseEkans.pdf        # PDF render file for LaTeX
├── LICENSE                                         # License for the project
└── README.md                                       # Introductionary doc
```

---

## ✅ TO DO: Future Evolutions

- [ ] **SPID / EUDI Wallet integration** for government-issued digital identity credentials
- [ ] **Web-DApp**
- [ ] **Mobile-friendly DApp** (probably Flutter)
- [ ] **DAO governance module** for decentralized policy updates
- [ ] **ZKP-based reputation visualization** that protects anonymity
- [ ] **Marketplace plugin API** to integrate with platforms like Shopify or WooCommerce
- [ ] **Gamification**: badges, reviewer streaks, reward levels

---

## 📜 License
© 2025 Emanuele Relmi

This project is licensed under the [Apache License 2.0](./LICENSE).

All custom images (except [logo unisa](Decentralized-Ecommerce-reverseEkans-latex/Images/logo_unisa.png)) are © 2025 Emanuele Relmi and licensed under Apache License 2.0.

### NOTICE

This project includes third-party software:

  - [Semaphore Protocol (MIT License)](https://github.com/semaphore-protocol/semaphore)

The files used are:
  - `code/contracts/SemaphoreVerifier.sol`
  - `code/contracts/SemaphoreVerifierKeyPts.sol`
  - `code/contracts/Contract.sol`
  - `code/contracts/SemaphoreGroups.sol`

These components are distributed under their respective licenses and
are not covered by the Apache License 2.0 that governs this project

---

## 👤 Authors
- [Emanuele Relmi](https://github.com/Kirito-Emo)
- [Francesco Quagliuolo](https://github.com/quagliofranci)
- [Giuseppe Alfonso Mangiola](https://github.com/PeppeMangiola)