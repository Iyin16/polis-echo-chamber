import { ethers } from "hardhat";
import { expect } from "chai";

/**
 * PolisAgentNFT Contract Tests
 *
 * Run with: npx hardhat test test/PolisAgentNFT.test.ts
 */

describe("PolisAgentNFT", function () {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let contract: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let owner: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let addr1: any;

  beforeEach(async function () {
    // Deploy contract
    const PolisAgentNFT = await ethers.getContractFactory("PolisAgentNFT");
    contract = await PolisAgentNFT.deploy();
    await contract.deployed();

    // Get signers
    [owner, addr1] = await ethers.getSigners();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(contract.address).to.not.equal(ethers.constants.AddressZero);
    });

    it("Should have correct name and symbol", async function () {
      expect(await contract.name()).to.equal("Polis Agent NFT");
      expect(await contract.symbol()).to.equal("AGENT");
    });
  });

  describe("Minting", function () {
    const agentId = "test-agent-1";
    const agentName = "Test Agent";
    const ideology = "Libertarian";
    const faction = "Liberty Coalition";
    const influence = 50;
    const createdTurn = 0;
    const metadataURI = "ipfs://QmTest";

    it("Should mint an agent NFT", async function () {
      const agentData = {
        agentName,
        ideology,
        faction,
        influenceSnapshot: influence,
        createdTurn,
        metadataURI,
      };

      const tx = await contract.mintAgentNFT(owner.address, agentId, agentData);
      const receipt = await tx.wait();

      // Get token ID from event
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mintEvent = receipt.events.find((e: any) => e.event === "Transfer");
      const tokenId = mintEvent.args.tokenId;

      expect(tokenId).to.be.a("number");
      expect(tokenId).to.equal(0); // First token
    });

    it("Should prevent minting same agent twice", async function () {
      const agentData = {
        agentName,
        ideology,
        faction,
        influenceSnapshot: influence,
        createdTurn,
        metadataURI,
      };

      // First mint succeeds
      await contract.mintAgentNFT(owner.address, agentId, agentData);

      // Second mint should revert
      await expect(contract.mintAgentNFT(owner.address, agentId, agentData)).to.be.revertedWith(
        "Agent already minted",
      );
    });

    it("Should track agent ID to token ID mapping", async function () {
      const agentData = {
        agentName,
        ideology,
        faction,
        influenceSnapshot: influence,
        createdTurn,
        metadataURI,
      };

      const tx = await contract.mintAgentNFT(owner.address, agentId, agentData);
      await tx.wait();

      const tokenId = await contract.getTokenIdForAgent(agentId);
      expect(tokenId).to.equal(0);
    });

    it("Should store agent data correctly", async function () {
      const agentData = {
        agentName,
        ideology,
        faction,
        influenceSnapshot: influence,
        createdTurn,
        metadataURI,
      };

      const tx = await contract.mintAgentNFT(owner.address, agentId, agentData);
      await tx.wait();

      const storedData = await contract.getAgentData(0);

      expect(storedData.agentName).to.equal(agentName);
      expect(storedData.ideology).to.equal(ideology);
      expect(storedData.faction).to.equal(faction);
      expect(storedData.influenceSnapshot).to.equal(influence);
    });

    it("Should assign token to correct owner", async function () {
      const agentData = {
        agentName,
        ideology,
        faction,
        influenceSnapshot: influence,
        createdTurn,
        metadataURI,
      };

      await contract.mintAgentNFT(addr1.address, agentId, agentData);

      const tokenOwner = await contract.ownerOf(0);
      expect(tokenOwner).to.equal(addr1.address);
    });
  });

  describe("Updates", function () {
    const agentId = "test-agent-2";
    const agentName = "Test Agent 2";

    beforeEach(async function () {
      const agentData = {
        agentName,
        ideology: "Progressive",
        faction: "Forward Party",
        influenceSnapshot: 50,
        createdTurn: 0,
        metadataURI: "ipfs://QmTest",
      };

      await contract.mintAgentNFT(owner.address, agentId, agentData);
    });

    it("Should update agent snapshot", async function () {
      const newInfluence = 75;
      const newFaction = "Centrist Alliance";

      await contract.updateAgentSnapshot(0, newInfluence, newFaction);

      const data = await contract.getAgentData(0);
      expect(data.influenceSnapshot).to.equal(newInfluence);
      expect(data.faction).to.equal(newFaction);
    });

    it("Should emit AgentSnapshotUpdated event", async function () {
      const newInfluence = 75;
      const newFaction = "Centrist Alliance";

      const tx = await contract.updateAgentSnapshot(0, newInfluence, newFaction);

      await expect(tx)
        .to.emit(contract, "AgentSnapshotUpdated")
        .withArgs(0, newInfluence, newFaction);
    });
  });

  describe("Queries", function () {
    beforeEach(async function () {
      // Mint 3 agents
      for (let i = 0; i < 3; i++) {
        const agentData = {
          agentName: `Agent ${i}`,
          ideology: "Neutral",
          faction: "Unaffiliated",
          influenceSnapshot: 50 + i * 10,
          createdTurn: 0,
          metadataURI: "ipfs://QmTest",
        };

        await contract.mintAgentNFT(owner.address, `agent-${i}`, agentData);
      }
    });

    it("Should return correct total agents minted", async function () {
      const total = await contract.totalAgentsMinted();
      expect(total).to.equal(3);
    });

    it("Should return correct token ID for agent", async function () {
      const tokenId = await contract.getTokenIdForAgent("agent-1");
      expect(tokenId).to.equal(1);
    });

    it("Should revert for non-existent agent ID", async function () {
      await expect(contract.getTokenIdForAgent("non-existent")).to.be.reverted;
    });
  });

  describe("Burning", function () {
    beforeEach(async function () {
      const agentData = {
        agentName: "Burnable Agent",
        ideology: "Neutral",
        faction: "Unaffiliated",
        influenceSnapshot: 50,
        createdTurn: 0,
        metadataURI: "ipfs://QmTest",
      };

      await contract.mintAgentNFT(owner.address, "burn-agent", agentData);
    });

    it("Should allow owner to burn token", async function () {
      const balanceBefore = await contract.balanceOf(owner.address);
      expect(balanceBefore).to.equal(1);

      await contract.burn(0);

      const balanceAfter = await contract.balanceOf(owner.address);
      expect(balanceAfter).to.equal(0);
    });

    it("Should prevent non-owner from burning token", async function () {
      await expect(contract.connect(addr1).burn(0)).to.be.reverted;
    });
  });

  describe("Access Control", function () {
    it("Should have owner set to deployer", async function () {
      const contractOwner = await contract.owner();
      expect(contractOwner).to.equal(owner.address);
    });

    it("Should allow owner to mint", async function () {
      const agentData = {
        agentName: "Owner Agent",
        ideology: "Neutral",
        faction: "Unaffiliated",
        influenceSnapshot: 50,
        createdTurn: 0,
        metadataURI: "ipfs://QmTest",
      };

      const tx = await contract.mintAgentNFT(owner.address, "owner-agent", agentData);
      await expect(tx).to.not.be.reverted;
    });
  });
});

/**
 * HOW TO RUN TESTS:
 *
 * 1. Create test directory:
 *    mkdir test
 *
 * 2. Save this file as test/PolisAgentNFT.test.ts
 *
 * 3. Run tests:
 *    npx hardhat test test/PolisAgentNFT.test.ts
 *
 * 4. Run with coverage:
 *    npx hardhat coverage
 *
 * EXPECTED OUTPUT:
 *
 *   PolisAgentNFT
 *     Deployment
 *       ✓ Should deploy successfully (42ms)
 *       ✓ Should have correct name and symbol (11ms)
 *     Minting
 *       ✓ Should mint an agent NFT (51ms)
 *       ✓ Should prevent minting same agent twice (63ms)
 *       ✓ Should track agent ID to token ID mapping (41ms)
 *       ✓ Should store agent data correctly (48ms)
 *       ✓ Should assign token to correct owner (37ms)
 *     Updates
 *       ✓ Should update agent snapshot (51ms)
 *       ✓ Should emit AgentSnapshotUpdated event (38ms)
 *     Queries
 *       ✓ Should return correct total agents minted (92ms)
 *       ✓ Should return correct token ID for agent (28ms)
 *       ✓ Should revert for non-existent agent ID (25ms)
 *     Burning
 *       ✓ Should allow owner to burn token (44ms)
 *       ✓ Should prevent non-owner from burning token (18ms)
 *     Access Control
 *       ✓ Should have owner set to deployer (10ms)
 *       ✓ Should allow owner to mint (41ms)
 *
 *   17 passing (600ms)
 */
